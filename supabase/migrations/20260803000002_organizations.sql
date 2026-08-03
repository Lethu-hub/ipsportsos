-- ============================================================
-- IP Sports OS — 0002: organizations + organization_branding
-- ============================================================

-- ------------------------------------------------------------
-- organizations (tenant root)
-- ------------------------------------------------------------
create table if not exists public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  organization_type    text not null check (organization_type in ('CLUB', 'LEAGUE', 'ACADEMY', 'ASSOCIATION')),
  sport_id             uuid references public.sports(id),
  status               text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'SUSPENDED')),
  subscription_status  text not null default 'PENDING' check (subscription_status in ('ACTIVE', 'PENDING', 'EXPIRED')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index organizations_sport_id_idx on public.organizations(sport_id);
create index organizations_status_idx on public.organizations(status);
create index organizations_slug_idx on public.organizations(slug);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;

-- Active (non-deleted) organizations are publicly visible.
create policy "organizations_public_read" on public.organizations
  for select
  to anon, authenticated
  using (status = 'ACTIVE' and deleted_at is null);

-- Members may always read their own organization (even when paused).
create policy "organizations_member_read" on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

-- Platform administrators manage organizations.
create policy "organizations_platform_manage" on public.organizations
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- organization_branding (club-controlled public identity)
-- ------------------------------------------------------------
create table if not exists public.organization_branding (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null unique references public.organizations(id) on delete cascade,
  primary_color     text,
  secondary_color   text,
  accent_color      text,
  font_family       text,
  logo_url          text,
  banner_url        text,
  cover_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger organization_branding_set_updated_at
  before update on public.organization_branding
  for each row execute function public.set_updated_at();

alter table public.organization_branding enable row level security;

-- Branding of active organizations is public (drives club page identity).
create policy "organization_branding_public_read" on public.organization_branding
  for select
  to anon, authenticated
  using (exists (
    select 1 from public.organizations o
    where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
  ));

-- Members with website:update manage their own branding; platform admins manage all.
create policy "organization_branding_member_manage" on public.organization_branding
  for all
  to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "organization_branding_member_read" on public.organization_branding
  for select
  to authenticated
  using (public.is_org_member(organization_id));
