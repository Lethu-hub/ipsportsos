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
  first_name   text,
  last_name    text,
  avatar_url   text,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'DISABLED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_status_idx on public.profiles(status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, auth_user_id, email)
  values (new.id, new.id, coalesce(new.email, ''))
  on conflict (auth_user_id) do nothing;
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

-- Members of an organization may read the profiles of their co-members.
create policy "profiles_member_read" on public.profiles
  for select
  to authenticated
  using (exists (
    select 1
    from public.organization_memberships m
    where m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and exists (
        select 1 from public.organization_memberships mine
        where mine.organization_id = m.organization_id
          and mine.profile_id = profiles.id
      )
  ));

-- Users with users:update manage profiles of their organization.
create policy "profiles_member_update" on public.profiles
  for update
  to authenticated
  using (exists (
    select 1
    from public.organization_memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and p.key = 'users:update'
      and exists (
        select 1 from public.organization_memberships target
        where target.organization_id = m.organization_id
          and target.profile_id = profiles.id
      )
  ))
  with check (true);

-- Platform administrators manage all profiles.
create policy "profiles_platform_manage" on public.profiles
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
