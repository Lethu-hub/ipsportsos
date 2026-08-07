-- ============================================================
-- IP Sports OS — 0011: subscription plans, organization
--                      subscriptions, feature entitlements
-- ============================================================

-- ------------------------------------------------------------
-- subscription_plans
-- ------------------------------------------------------------
create table if not exists public.subscription_plans (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  code                    text not null unique,
  description             text,
  max_organizations       integer,
  max_teams               integer,
  max_users               integer,
  analytics_widget_limit  integer,
  content_publish_limit   integer,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

-- Plans are public product information.
create policy "subscription_plans_public_read" on public.subscription_plans
  for select
  to anon, authenticated
  using (is_active = true);

-- Platform administrators manage plans.
create policy "subscription_plans_platform_manage" on public.subscription_plans
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- organization_subscriptions
-- ------------------------------------------------------------
create table if not exists public.organization_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null unique references public.organizations(id) on delete cascade,
  plan_id           uuid not null references public.subscription_plans(id),
  status            text not null default 'PENDING' check (status in ('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED')),
  started_at        timestamptz not null default now(),
  ends_at           timestamptz,
  auto_renew        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger organization_subscriptions_set_updated_at
  before update on public.organization_subscriptions
  for each row execute function public.set_updated_at();

alter table public.organization_subscriptions enable row level security;

-- Subscription state is private: organization members with
-- subscriptions:read, and platform administrators.
create policy "organization_subscriptions_member_read" on public.organization_subscriptions
  for select
  to authenticated
  using (public.has_permission(organization_id, 'subscriptions:read'));

create policy "organization_subscriptions_platform_read" on public.organization_subscriptions
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "organization_subscriptions_platform_manage" on public.organization_subscriptions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- feature_entitlements
-- ------------------------------------------------------------
create table if not exists public.feature_entitlements (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  feature_key       text not null,
  enabled           boolean not null default true,
  limit_value       integer,
  expires_at        timestamptz,
  granted_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, feature_key)
);

create index feature_entitlements_org_idx on public.feature_entitlements(organization_id);

create trigger feature_entitlements_set_updated_at
  before update on public.feature_entitlements
  for each row execute function public.set_updated_at();

alter table public.feature_entitlements enable row level security;

-- Entitlements are private to the organization (via subscriptions:read)
-- and platform administrators.
create policy "feature_entitlements_member_read" on public.feature_entitlements
  for select
  to authenticated
  using (public.has_permission(organization_id, 'subscriptions:read'));

create policy "feature_entitlements_platform_read" on public.feature_entitlements
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "feature_entitlements_platform_manage" on public.feature_entitlements
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
