-- ============================================================
-- IP Sports OS — 0016: seed platform owner
-- ============================================================
-- Creates the platform owner account:
--   email:    owner@ipsportsos.app
--   password: RANDOM (generated below — you MUST reset it before
--             logging in)
--
-- The password is generated as an unguessable random value so no
-- credential ever lives in the repository (this repo is public).
-- To log in for the first time, reset the password via:
--
--   Supabase Dashboard → Authentication → Users → owner@ipsportsos.app
--   → Reset password (sends a recovery email), OR run this in the
--   Dashboard SQL editor:
--
--   select auth.admin_update_user_by_id(
--     (select id from auth.users where email = 'owner@ipsportsos.app'),
--     '{"password": "YourNewStrongPassword123!"}'
--   );
--
-- Idempotent.

do $$
declare
  v_user_id    uuid;
  v_profile_id uuid;
  v_role_id    uuid;
begin
  select id into v_role_id
  from public.roles
  where name = 'PLATFORM_OWNER'
  limit 1;

  if v_role_id is null then
    raise exception 'PLATFORM_OWNER role not found — run 0015 seed first';
  end if;

  -- Create the auth user only if it does not exist yet.
  select id into v_user_id
  from auth.users
  where email = 'owner@ipsportsos.app'
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
      'owner@ipsportsos.app',
      crypt(gen_random_uuid()::text, gen_salt('bf')),  -- random; reset via dashboard
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "Platform Owner"}',
      now(),
      now()
    )
    returning id into v_user_id;
  end if;

  -- Profile (trigger also creates it; upsert for safety).
  insert into public.profiles (id, auth_user_id, email, first_name, last_name, status)
  values (v_user_id, v_user_id, 'owner@ipsportsos.app', 'Platform', 'Owner', 'ACTIVE')
  on conflict (auth_user_id) do nothing;

  select id into v_profile_id
  from public.profiles
  where auth_user_id = v_user_id;

  -- Platform-scoped membership (organization_id is NULL for PLATFORM scope).
  insert into public.organization_memberships (organization_id, profile_id, role_id, status)
  values (null, v_profile_id, v_role_id, 'ACTIVE')
  on conflict (organization_id, profile_id, role_id) do nothing;
end $$;
