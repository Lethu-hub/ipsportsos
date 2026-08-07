-- ============================================================
-- IP Sports OS — 0003: teams
-- ============================================================
create table if not exists public.teams (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  sport_id          uuid not null references public.sports(id),
  name              text not null,
  slug              text not null,
  gender            text check (gender in ('MEN', 'WOMEN', 'MIXED')),
  category          text check (category in ('SENIOR', 'U21', 'ACADEMY')),
  logo_url          text,
  banner_url        text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, slug)
);

create index teams_organization_id_idx on public.teams(organization_id);
create index teams_sport_id_idx on public.teams(sport_id);
create index teams_org_status_idx on public.teams(organization_id, is_active, deleted_at);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

alter table public.teams enable row level security;

-- Teams of active organizations are publicly visible.
create policy "teams_public_read" on public.teams
  for select
  to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

-- Members may read teams of their own organization.
create policy "teams_member_read" on public.teams
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Members with team permissions manage their organization's teams.
create policy "teams_member_insert" on public.teams
  for insert
  to authenticated
  with check (public.can(organization_id, 'teams:create'));

create policy "teams_member_update" on public.teams
  for update
  to authenticated
  using (public.can(organization_id, 'teams:update'))
  with check (public.can(organization_id, 'teams:update'));

create policy "teams_member_delete" on public.teams
  for delete
  to authenticated
  using (public.can(organization_id, 'teams:delete'));
