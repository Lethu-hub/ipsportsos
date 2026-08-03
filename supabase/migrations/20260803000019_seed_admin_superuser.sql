-- ============================================================
-- IP Sports OS — 0019: seed admin superuser
-- ============================================================
-- Creates the OS admin superuser account:
--   email:    mpofu9898@gmail.com
--   password: Admin123!
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
  where email = 'mpofu9898@gmail.com'
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
      'mpofu9898@gmail.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "OS Admin Superuser"}',
      now(),
      now()
    )
    returning id into v_user_id;
  else
    -- Update password if the user already exists, to ensure it is set to Admin123!
    update auth.users
    set encrypted_password = crypt('Admin123!', gen_salt('bf'))
    where id = v_user_id;
  end if;

  -- Profile (trigger also creates it; upsert for safety).
  insert into public.profiles (id, auth_user_id, email, first_name, last_name, status)
  values (v_user_id, v_user_id, 'mpofu9898@gmail.com', 'Admin', 'Superuser', 'ACTIVE')
  on conflict (auth_user_id) do update
    set first_name = 'Admin', last_name = 'Superuser', status = 'ACTIVE';

  select id into v_profile_id
  from public.profiles
  where auth_user_id = v_user_id;

  -- Platform-scoped membership (organization_id is NULL for PLATFORM scope).
  insert into public.organization_memberships (organization_id, profile_id, role_id, status)
  values (null, v_profile_id, v_role_id, 'ACTIVE')
  on conflict (organization_id, profile_id, role_id) do nothing;
end $$;
