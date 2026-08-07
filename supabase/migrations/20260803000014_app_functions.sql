-- ============================================================
-- IP Sports OS — 0014: application helper functions (RPC)
-- ============================================================
-- These SECURITY DEFINER functions let the portal perform
-- privileged operations (creating auth users) without ever
-- exposing a service-role/secret key to the client. Every
-- function re-validates the caller's permissions internally.

-- ------------------------------------------------------------
-- create_staff_user
-- ------------------------------------------------------------
-- Creates a Supabase Auth user, profile, and organization
-- membership in one atomic step. Callable by:
--   * platform administrators (any organization), or
--   * organization members with users:create.
--
-- Parameters:
--   p_organization_id  target organization (NULL + PLATFORM role for
--                      platform-level users)
--   p_role_name        role name, e.g. CLUB_ADMIN, COACH, MEDIA
--   p_email            login email (must be unique)
--   p_password         initial password (plaintext — only used to
--                      create the auth record, never stored/logged)
--   p_first_name / p_last_name  display name (optional)
--
-- Returns the new profile id.
-- ------------------------------------------------------------
create or replace function public.create_staff_user(
  p_organization_id uuid,
  p_role_name       text,
  p_email           text,
  p_password        text,
  p_first_name      text default null,
  p_last_name       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller       uuid := public.current_profile_id();
  v_role_id      uuid;
  v_role_scope   text;
  v_org_id       uuid := p_organization_id;
  v_user_id      uuid;
  v_profile_id   uuid;
  v_new_email    text := lower(trim(p_email));
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if v_new_email is null or v_new_email = '' then
    raise exception 'Email is required';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  -- Resolve role.
  select r.id, r.scope into v_role_id, v_role_scope
  from public.roles r
  where r.name = p_role_name;

  if v_role_id is null then
    raise exception 'Unknown role: %', p_role_name;
  end if;

  -- Platform roles may only be assigned by platform administrators.
  if v_role_scope = 'PLATFORM' then
    if not public.is_platform_admin() then
      raise exception 'Only platform administrators can assign platform roles';
    end if;
    v_org_id := null;
  else
    -- Organization roles require an organization + permission.
    if v_org_id is null then
      raise exception 'An organization is required for organization roles';
    end if;
    if not (public.is_platform_admin() or public.has_permission(v_org_id, 'users:create')) then
      raise exception 'You do not have permission to create users in this organization';
    end if;
  end if;

  -- Existing auth user?
  select id into v_user_id
  from auth.users
  where email = v_new_email
  limit 1;

  if v_user_id is null then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_new_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    )
    returning id into v_user_id;
  end if;

  -- Profile (the on_auth_user_created trigger normally creates it; the
  -- trigger fires on this insert too, but we upsert for safety).
  insert into public.profiles (id, auth_user_id, email, first_name, last_name, status)
  values (v_user_id, v_user_id, v_new_email, p_first_name, p_last_name, 'ACTIVE')
  on conflict (auth_user_id) do update
    set first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name  = coalesce(excluded.last_name, public.profiles.last_name),
        email      = v_new_email
  returning id into v_profile_id;

  -- Membership.
  insert into public.organization_memberships (
    organization_id, profile_id, role_id, status, invited_by
  ) values (
    v_org_id, v_profile_id, v_role_id, 'ACTIVE', v_caller
  )
  on conflict (organization_id, profile_id, role_id) do update
    set status = 'ACTIVE', invited_by = v_caller;

  perform public.log_action(
    'CREATE',
    'profiles',
    v_profile_id,
    v_org_id,
    jsonb_build_object('email', v_new_email, 'role', p_role_name, 'created_by', v_caller::text)
  );

  return v_profile_id;
end;
$$;

revoke all on function public.create_staff_user(uuid, text, text, text, text, text) from public;
grant execute on function public.create_staff_user(uuid, text, text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- get_my_access
-- ------------------------------------------------------------
-- Convenience RPC returning the caller's memberships (with role,
-- organization slug/name, and permission keys). Powers role-aware
-- navigation without multi-query client code.
-- ------------------------------------------------------------
create or replace function public.get_my_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_result  jsonb;
begin
  if v_profile is null then
    return '[]'::jsonb;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'membership_id', m.id,
      'organization_id', m.organization_id,
      'organization_name', o.name,
      'organization_slug', o.slug,
      'organization_type', o.organization_type,
      'role', r.name,
      'role_scope', r.scope,
      'permissions', coalesce((
        select jsonb_agg(p.key order by p.key)
        from public.role_permissions rp
        join public.permissions p on p.id = rp.permission_id
        where rp.role_id = m.role_id
      ), '[]'::jsonb)
    ) order by r.scope, o.name
  )
  into v_result
  from public.organization_memberships m
  join public.roles r on r.id = m.role_id
  left join public.organizations o on o.id = m.organization_id
  where m.profile_id = v_profile
    and m.status = 'ACTIVE';

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_access() from public;
grant execute on function public.get_my_access() to authenticated;
