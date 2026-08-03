-- ============================================================
-- IP Sports OS — 0012: analytics definitions, widgets,
--                      dashboards, dashboard widgets
-- ============================================================

-- ------------------------------------------------------------
-- analytics_definitions (reusable chart data-source configs)
-- ------------------------------------------------------------
create table if not exists public.analytics_definitions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  definition     jsonb not null,
  allowed_roles  jsonb,
  sport_id       uuid not null references public.sports(id),
  created_by     uuid not null references public.profiles(id),
  status         text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index analytics_definitions_sport_id_idx on public.analytics_definitions(sport_id);

create trigger analytics_definitions_set_updated_at
  before update on public.analytics_definitions
  for each row execute function public.set_updated_at();

alter table public.analytics_definitions enable row level security;

-- Definitions are platform content; signed-in users may read published ones.
create policy "analytics_definitions_authenticated_read" on public.analytics_definitions
  for select
  to authenticated
  using (status = 'PUBLISHED' or public.is_platform_admin());

-- Platform administrators create and manage definitions.
create policy "analytics_definitions_platform_manage" on public.analytics_definitions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- analytics_widgets (reusable widgets)
-- ------------------------------------------------------------
create table if not exists public.analytics_widgets (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid references public.organizations(id),
  analytics_definition_id   uuid not null references public.analytics_definitions(id),
  name                      text not null,
  category                  text not null check (category in ('PERFORMANCE', 'PLAYER', 'FORM')),
  widget_type               text not null check (widget_type in ('line_chart', 'bar_chart', 'table')),
  status                    text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
  created_by                uuid not null references public.profiles(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index analytics_widgets_org_idx on public.analytics_widgets(organization_id);

create trigger analytics_widgets_set_updated_at
  before update on public.analytics_widgets
  for each row execute function public.set_updated_at();

alter table public.analytics_widgets enable row level security;

-- Organization members read widgets of their organization (and platform
-- widgets where organization_id is null).
create policy "analytics_widgets_member_read" on public.analytics_widgets
  for select
  to authenticated
  using (
    organization_id is null
    or public.has_permission(organization_id, 'analytics:read')
  );

create policy "analytics_widgets_member_manage" on public.analytics_widgets
  for all
  to authenticated
  using (
    (organization_id is not null and public.can(organization_id, 'analytics:update'))
    or public.is_platform_admin()
  )
  with check (
    (organization_id is not null and public.can(organization_id, 'analytics:update'))
    or public.is_platform_admin()
  );

-- ------------------------------------------------------------
-- dashboards
-- ------------------------------------------------------------
create table if not exists public.dashboards (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  team_id           uuid references public.teams(id),
  name              text not null,
  role_scope        text,
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index dashboards_org_idx on public.dashboards(organization_id);

create trigger dashboards_set_updated_at
  before update on public.dashboards
  for each row execute function public.set_updated_at();

alter table public.dashboards enable row level security;

create policy "dashboards_member_read" on public.dashboards
  for select
  to authenticated
  using (public.has_permission(organization_id, 'dashboards:read'));

create policy "dashboards_member_manage" on public.dashboards
  for all
  to authenticated
  using (public.can(organization_id, 'dashboards:update'))
  with check (public.can(organization_id, 'dashboards:update'));

-- ------------------------------------------------------------
-- dashboard_widgets (layout mapping)
-- ------------------------------------------------------------
create table if not exists public.dashboard_widgets (
  id                uuid primary key default gen_random_uuid(),
  dashboard_id      uuid not null references public.dashboards(id) on delete cascade,
  widget_id         uuid not null references public.analytics_widgets(id) on delete cascade,
  position          integer not null,
  size              text not null default 'MEDIUM' check (size in ('SMALL', 'MEDIUM', 'LARGE')),
  created_at        timestamptz not null default now()
);

create index dashboard_widgets_dashboard_id_idx on public.dashboard_widgets(dashboard_id);

alter table public.dashboard_widgets enable row level security;

create policy "dashboard_widgets_member_read" on public.dashboard_widgets
  for select
  to authenticated
  using (exists (
    select 1 from public.dashboards d
    where d.id = dashboard_id
      and public.has_permission(d.organization_id, 'dashboards:read')
  ));

create policy "dashboard_widgets_member_manage" on public.dashboard_widgets
  for all
  to authenticated
  using (exists (
    select 1 from public.dashboards d
    where d.id = dashboard_id
      and public.can(d.organization_id, 'dashboards:update')
  ))
  with check (exists (
    select 1 from public.dashboards d
    where d.id = dashboard_id
      and public.can(d.organization_id, 'dashboards:update')
  ));
