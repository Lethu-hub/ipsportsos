-- ============================================================
-- IP Sports OS — 0004: roles, permissions, role_permissions
-- ============================================================

-- ------------------------------------------------------------
-- roles
-- ------------------------------------------------------------
create table if not exists public.roles (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  scope          text not null check (scope in ('PLATFORM', 'ORGANIZATION')),
  description    text,
  is_system_role boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.roles enable row level security;

-- Role catalogue is readable by anyone (role names are not sensitive).
create policy "roles_public_read" on public.roles
  for select
  to anon, authenticated
  using (true);

-- Platform administrators manage roles.
create policy "roles_platform_manage" on public.roles
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- permissions
-- ------------------------------------------------------------
create table if not exists public.permissions (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  description  text,
  module       text not null,
  action       text not null
);

alter table public.permissions enable row level security;

-- Permission catalogue is readable by signed-in users (used to render
-- role-aware UIs).
create policy "permissions_authenticated_read" on public.permissions
  for select
  to authenticated
  using (true);

-- Platform administrators manage permissions.
create policy "permissions_platform_manage" on public.permissions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- role_permissions
-- ------------------------------------------------------------
create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx on public.role_permissions(permission_id);

alter table public.role_permissions enable row level security;

-- Signed-in users may read the mapping (needed for server-side checks).
create policy "role_permissions_authenticated_read" on public.role_permissions
  for select
  to authenticated
  using (true);

-- Platform administrators manage mappings.
create policy "role_permissions_platform_manage" on public.role_permissions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
