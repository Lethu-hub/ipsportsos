-- ============================================================
-- IP Sports OS — 0006: organization_memberships
-- ============================================================
-- NOTE: organization_id is nullable (per schema spec) so that
-- PLATFORM-scoped roles (PLATFORM_OWNER, SUPER_ADMIN) can hold
-- memberships without belonging to a tenant.

create table if not exists public.organization_memberships (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid references public.organizations(id) on delete cascade,
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  role_id           uuid not null references public.roles(id),
  status            text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'REMOVED')),
  invited_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, profile_id, role_id)
);

create index organization_memberships_profile_id_idx on public.organization_memberships(profile_id);
create index organization_memberships_organization_id_idx on public.organization_memberships(organization_id);

create trigger organization_memberships_set_updated_at
  before update on public.organization_memberships
  for each row execute function public.set_updated_at();

alter table public.organization_memberships enable row level security;

-- Users may read their own memberships (with roles for role-aware UIs).
create policy "organization_memberships_own_read" on public.organization_memberships
  for select
  to authenticated
  using (profile_id = public.current_profile_id());

-- Organization members may read the membership list of their own organization.
create policy "organization_memberships_org_read" on public.organization_memberships
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Platform administrators may read everything.
create policy "organization_memberships_platform_read" on public.organization_memberships
  for select
  to authenticated
  using (public.is_platform_admin());

-- Users with users:create/assign_role add members to their organization;
-- platform administrators manage all memberships.
create policy "organization_memberships_insert" on public.organization_memberships
  for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or (public.has_permission(organization_id, 'users:create'))
    or (public.has_permission(organization_id, 'users:assign_role'))
  );

create policy "organization_memberships_update" on public.organization_memberships
  for update
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_permission(organization_id, 'users:update')
    or public.has_permission(organization_id, 'users:assign_role')
  )
  with check (
    public.is_platform_admin()
    or public.has_permission(organization_id, 'users:update')
    or public.has_permission(organization_id, 'users:assign_role')
  );

create policy "organization_memberships_delete" on public.organization_memberships
  for delete
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_permission(organization_id, 'users:delete')
  );
