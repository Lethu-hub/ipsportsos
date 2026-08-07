-- ============================================================
-- IP Sports OS — 0005: profiles
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email        text not null unique,
  username     text unique,
  first_name   text,
  last_name    text,
  avatar_url   text,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'DISABLED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_status_idx on public.profiles(status);
create index profiles_username_idx on public.profiles(lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Users may read their own profile.
create policy "profiles_own_read" on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Users may update their own profile (but not disable themselves).
create policy "profiles_own_update" on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and status <> 'DISABLED');

-- Platform administrators manage all profiles.
create policy "profiles_platform_manage" on public.profiles
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Note: profiles_member_read and profiles_member_update policies are defined
-- in 0006_memberships.sql after organization_memberships table is created.
