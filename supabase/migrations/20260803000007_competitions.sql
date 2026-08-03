-- ============================================================
-- IP Sports OS — 0007: competitions, competition_participants, seasons
-- ============================================================

-- ------------------------------------------------------------
-- competitions (leagues / cups)
-- ------------------------------------------------------------
create table if not exists public.competitions (
  id                    uuid primary key default gen_random_uuid(),
  sport_id              uuid not null references public.sports(id),
  owner_organization_id uuid references public.organizations(id),
  name                  text not null,
  country               text,
  slug                  text not null unique,
  status                text not null default 'UPCOMING' check (status in ('UPCOMING', 'ACTIVE', 'COMPLETED')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index competitions_sport_id_idx on public.competitions(sport_id);
create index competitions_status_idx on public.competitions(status);

create trigger competitions_set_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

alter table public.competitions enable row level security;

-- Competitions are public (they power league tables and fixture pages).
create policy "competitions_public_read" on public.competitions
  for select
  to anon, authenticated
  using (true);

-- Members of the owning organization may manage their competition.
create policy "competitions_member_manage" on public.competitions
  for all
  to authenticated
  using (public.can(owner_organization_id, 'organizations:update'))
  with check (public.can(owner_organization_id, 'organizations:update'));

-- Platform administrators manage all competitions.
create policy "competitions_platform_manage" on public.competitions
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- competition_participants (team ↔ competition ↔ season)
-- ------------------------------------------------------------
create table if not exists public.competition_participants (
  id               uuid primary key default gen_random_uuid(),
  competition_id   uuid not null references public.competitions(id) on delete cascade,
  team_id          uuid not null references public.teams(id) on delete cascade,
  season_id        uuid not null references public.seasons(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (competition_id, team_id, season_id)
);

create index competition_participants_team_id_idx on public.competition_participants(team_id);
create index competition_participants_season_id_idx on public.competition_participants(season_id);

alter table public.competition_participants enable row level security;

-- Participation is public.
create policy "competition_participants_public_read" on public.competition_participants
  for select
  to anon, authenticated
  using (true);

-- Members of the team's organization manage participation.
create policy "competition_participants_member_manage" on public.competition_participants
  for all
  to authenticated
  using (exists (
    select 1 from public.teams t where t.id = team_id
      and public.can(t.organization_id, 'matches:create')
  ))
  with check (exists (
    select 1 from public.teams t where t.id = team_id
      and public.can(t.organization_id, 'matches:create')
  ));

-- Platform administrators manage all participation.
create policy "competition_participants_platform_manage" on public.competition_participants
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- seasons
-- ------------------------------------------------------------
create table if not exists public.seasons (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  competition_id    uuid not null references public.competitions(id) on delete cascade,
  name              text not null,
  start_date        date,
  end_date          date,
  is_active         boolean not null default false,
  created_at        timestamptz not null default now()
);

create index seasons_competition_id_idx on public.seasons(competition_id);
create index seasons_org_idx on public.seasons(organization_id);

alter table public.seasons enable row level security;

-- Seasons are public.
create policy "seasons_public_read" on public.seasons
  for select
  to anon, authenticated
  using (true);

-- Organization members manage seasons of their organization.
create policy "seasons_member_manage" on public.seasons
  for all
  to authenticated
  using (public.can(organization_id, 'matches:create'))
  with check (public.can(organization_id, 'matches:create'));

-- Platform administrators manage all seasons.
create policy "seasons_platform_manage" on public.seasons
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
