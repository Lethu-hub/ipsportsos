-- ============================================================
-- IP Sports OS — 0001: security helpers + sports
-- ============================================================
-- RLS helper functions used by policies across all tables.
-- Functions are `security definer` so they can be evaluated inside
-- RLS policies without causing infinite recursion, and PL/pgSQL bodies
-- are deferred until first execution (tables created in later
-- migrations are referenced safely).

set check_function_bodies = off;

-- ------------------------------------------------------------
-- Current profile id for the authenticated user
-- ------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (
    select p.id
    from public.profiles p
    where p.auth_user_id = auth.uid()
    limit 1
  );
end;
$$;

-- ------------------------------------------------------------
-- Platform-level administrator (PLATFORM_OWNER / SUPER_ADMIN)
-- ------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.organization_memberships m
    join public.roles r on r.id = m.role_id
    where m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and r.scope = 'PLATFORM'
  );
end;
$$;

-- ------------------------------------------------------------
-- Active member of a given organization
-- ------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_org_id
      and m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
  );
end;
$$;

-- ------------------------------------------------------------
-- Organization-scoped permission check
-- ------------------------------------------------------------
create or replace function public.has_permission(p_org_id uuid, p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.organization_memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_org_id
      and m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and p.key = p_key
  );
end;
$$;

-- ------------------------------------------------------------
-- "Can" — platform admins can do anything; otherwise check the
-- organization-scoped permission.
-- ------------------------------------------------------------
create or replace function public.can(p_org_id uuid, p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_platform_admin()
      or public.has_permission(p_org_id, p_key);
end;
$$;

-- ------------------------------------------------------------
-- Public visibility gate for athletes (reads athlete_visibility
-- as the table owner so anonymous users can evaluate it via RLS).
-- ------------------------------------------------------------
create or replace function public.is_athlete_public(p_athlete_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_public boolean;
begin
  select v.is_public into v_public
  from public.athlete_visibility v
  join public.athletes a on a.id = v.athlete_id
  join public.organizations o on o.id = v.organization_id
  where v.athlete_id = p_athlete_id
    and a.is_active = true
    and a.deleted_at is null
    and o.status = 'ACTIVE'
    and o.deleted_at is null
  limit 1;

  return coalesce(v_public, false);
end;
$$;

-- ------------------------------------------------------------
-- Generic updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- sports
-- ============================================================
create table if not exists public.sports (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger sports_set_updated_at
  before update on public.sports
  for each row execute function public.set_updated_at();

alter table public.sports enable row level security;

-- Active sports are publicly visible.
create policy "sports_public_read" on public.sports
  for select
  to anon, authenticated
  using (is_active = true);

-- Platform administrators manage sports.
create policy "sports_platform_manage" on public.sports
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
