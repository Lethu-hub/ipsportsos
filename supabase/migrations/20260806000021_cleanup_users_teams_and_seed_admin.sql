-- ============================================================
-- IP Sports OS — 0021: Kill existing users, purge demo teams/clubs,
--                      support username login, and seed default admin
-- ============================================================
-- 1. Adds username column and index to profiles, plus resolution RPC.
-- 2. Safely purges all existing users (auth.users, profiles, memberships).
-- 3. Safely purges all demo teams, demo clubs, demo matches, demo athletes,
--    demo competitions, and demo website pages from the platform.
-- 4. Creates default admin user:
--      email:    mpofu9898@gmail.com
--      username: mpofu9898
--      password: Test123!
--      role:     PLATFORM_OWNER
--
-- This admin has complete platform authority to add sports, clubs,
-- software users, assign permissions, and manage subscriptions.
-- ============================================================

-- ------------------------------------------------------------
-- Schema enhancements: username support on profiles
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists username text unique;

create index if not exists profiles_username_idx
  on public.profiles(lower(username));

-- Auto-create/update profile trigger to include username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := lower(coalesce(
    new.raw_user_meta_data->>'username',
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  insert into public.profiles (id, auth_user_id, email, username)
  values (new.id, new.id, coalesce(new.email, ''), nullif(v_username, ''))
  on conflict (auth_user_id) do update
    set email = excluded.email,
        username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$;

-- Function allowing client login forms to resolve a username to an email
create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_clean text := lower(trim(p_identifier));
begin
  if v_clean is null or v_clean = '' then
    return null;
  end if;

  -- If it is already an email address, verify or return it
  if position('@' in v_clean) > 0 then
    select email into v_email
    from public.profiles
    where lower(email) = v_clean
    limit 1;

    return coalesce(v_email, v_clean);
  end if;

  -- Look up profile by username
  select email into v_email
  from public.profiles
  where lower(username) = v_clean
  limit 1;

  -- Fallback: match by email prefix before '@'
  if v_email is null then
    select email into v_email
    from public.profiles
    where lower(split_part(email, '@', 1)) = v_clean
    limit 1;
  end if;

  return v_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- Drop old 6-param signature if it exists
drop function if exists public.create_staff_user(uuid, text, text, text, text, text);

-- Enhanced create_staff_user to accept optional username
create or replace function public.create_staff_user(
  p_organization_id uuid,
  p_role_name       text,
  p_email           text,
  p_password        text,
  p_first_name      text default null,
  p_last_name       text default null,
  p_username        text default null
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
  v_username     text := lower(trim(coalesce(p_username, split_part(v_new_email, '@', 1))));
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

  -- Check if username is already taken by another profile
  if exists (select 1 from public.profiles where lower(username) = v_username and lower(email) <> v_new_email) then
    raise exception 'Username "%" is already taken', v_username;
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
      jsonb_build_object('username', v_username, 'full_name', trim(concat(coalesce(p_first_name, ''), ' ', coalesce(p_last_name, '')))),
      now(),
      now()
    )
    returning id into v_user_id;
  end if;

  -- Profile
  insert into public.profiles (id, auth_user_id, email, username, first_name, last_name, status)
  values (v_user_id, v_user_id, v_new_email, v_username, p_first_name, p_last_name, 'ACTIVE')
  on conflict (auth_user_id) do update
    set first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name  = coalesce(excluded.last_name, public.profiles.last_name),
        username   = coalesce(excluded.username, public.profiles.username),
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
    jsonb_build_object('email', v_new_email, 'username', v_username, 'role', p_role_name, 'created_by', v_caller::text)
  );

  return v_profile_id;
end;
$$;

revoke all on function public.create_staff_user(uuid, text, text, text, text, text, text) from public;
grant execute on function public.create_staff_user(uuid, text, text, text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- Safe data reset & default admin creation
-- ------------------------------------------------------------
do $$
declare
  v_table        text;
  v_tables       text[] := array[
    'public.match_events',
    'public.matches',
    'public.athlete_statistics',
    'public.athlete_visibility',
    'public.athlete_team_history',
    'public.athletes',
    'public.competition_participants',
    'public.seasons',
    'public.competitions',
    'public.dashboard_widgets',
    'public.dashboards',
    'public.analytics_widgets',
    'public.analytics_definitions',
    'public.website_page_versions',
    'public.website_pages',
    'public.news_items',
    'public.club_page_sections',
    'public.feature_entitlements',
    'public.organization_subscriptions',
    'public.organization_branding',
    'public.teams',
    'public.organization_memberships',
    'public.organizations',
    'public.audit_logs',
    'public.profiles'
  ];
  v_user_id      uuid;
  v_profile_id   uuid;
  v_owner_role   uuid;
  v_sport_id     uuid;
  v_starter_plan uuid;
begin
  -- ----------------------------------------------------------
  -- Step 1 & 2: Wipe all demo data, demo teams, and existing users
  -- Safely deletes from each existing table in dependency order
  -- ----------------------------------------------------------
  foreach v_table in array v_tables loop
    if to_regclass(v_table) is not null then
      execute format('delete from %s', v_table);
    end if;
  end loop;

  -- Delete auth users
  delete from auth.users;

  -- ----------------------------------------------------------
  -- Ensure Base Sport & Subscription Plans exist for Admin
  -- ----------------------------------------------------------
  insert into public.sports (name, code, is_active)
  values ('Football', 'FOOTBALL', true)
  on conflict (code) do update set name = excluded.name, is_active = true
  returning id into v_sport_id;

  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Starter', 'STARTER', 'For clubs getting started', 1, 3, 10, 5, 20, true)
  on conflict (code) do nothing
  returning id into v_starter_plan;

  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Professional', 'PROFESSIONAL', 'For growing clubs', 3, 10, 50, 25, 200, true)
  on conflict (code) do nothing;

  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Enterprise', 'ENTERPRISE', 'For leagues and large organisations', null, null, null, null, null, true)
  on conflict (code) do nothing;

  -- ----------------------------------------------------------
  -- Step 3: Create Default Admin User
  -- Email:    mpofu9898@gmail.com
  -- Username: mpofu9898
  -- Password: Test123!
  -- Role:     PLATFORM_OWNER
  -- ----------------------------------------------------------
  select id into v_owner_role
  from public.roles
  where name = 'PLATFORM_OWNER'
  limit 1;

  if v_owner_role is null then
    raise exception 'PLATFORM_OWNER role not found — ensure roles are seeded';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'mpofu9898@gmail.com',
    crypt('Test123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "OS Admin", "username": "mpofu9898"}',
    now(),
    now()
  )
  returning id into v_user_id;

  -- Profile
  insert into public.profiles (id, auth_user_id, email, username, first_name, last_name, status)
  values (v_user_id, v_user_id, 'mpofu9898@gmail.com', 'mpofu9898', 'OS', 'Admin', 'ACTIVE')
  on conflict (auth_user_id) do update
    set email = 'mpofu9898@gmail.com',
        username = 'mpofu9898',
        first_name = 'OS',
        last_name = 'Admin',
        status = 'ACTIVE';

  select id into v_profile_id
  from public.profiles
  where auth_user_id = v_user_id;

  -- Platform-scoped membership (organization_id is NULL for PLATFORM scope)
  insert into public.organization_memberships (organization_id, profile_id, role_id, status)
  values (null, v_profile_id, v_owner_role, 'ACTIVE')
  on conflict (organization_id, profile_id, role_id) do update
    set status = 'ACTIVE';

end $$;
