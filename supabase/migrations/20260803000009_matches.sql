-- ============================================================
-- IP Sports OS — 0009: matches, event_types, match_events
-- ============================================================

-- ------------------------------------------------------------
-- matches
-- ------------------------------------------------------------
create table if not exists public.matches (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  competition_id    uuid references public.competitions(id),
  season_id         uuid references public.seasons(id),
  home_team_id      uuid not null references public.teams(id),
  away_team_id      uuid not null references public.teams(id),
  venue             text,
  match_date        timestamptz not null,
  status            text not null default 'UPCOMING' check (status in ('UPCOMING', 'LIVE', 'FINISHED', 'POSTPONED')),
  home_score        integer,
  away_score        integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create index matches_organization_id_idx on public.matches(organization_id);
create index matches_competition_id_idx on public.matches(competition_id);
create index matches_home_team_id_idx on public.matches(home_team_id);
create index matches_away_team_id_idx on public.matches(away_team_id);
create index matches_date_idx on public.matches(match_date);
create index matches_status_idx on public.matches(status);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

alter table public.matches enable row level security;

-- Fixtures and results are public.
create policy "matches_public_read" on public.matches
  for select
  to anon, authenticated
  using (true);

-- Organization members read and manage their own matches.
create policy "matches_member_read" on public.matches
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "matches_member_insert" on public.matches
  for insert
  to authenticated
  with check (public.can(organization_id, 'matches:create'));

create policy "matches_member_update" on public.matches
  for update
  to authenticated
  using (public.can(organization_id, 'matches:update'))
  with check (public.can(organization_id, 'matches:update'));

create policy "matches_member_delete" on public.matches
  for delete
  to authenticated
  using (public.can(organization_id, 'matches:delete'));

-- ------------------------------------------------------------
-- event_types (taxonomy of match events)
-- ------------------------------------------------------------
create table if not exists public.event_types (
  id          uuid primary key default gen_random_uuid(),
  sport_id    uuid not null references public.sports(id),
  name        text not null,
  code        text not null unique,
  category    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index event_types_sport_id_idx on public.event_types(sport_id);

alter table public.event_types enable row level security;

-- Event taxonomy is public.
create policy "event_types_public_read" on public.event_types
  for select
  to anon, authenticated
  using (is_active = true);

-- Platform administrators manage the taxonomy.
create policy "event_types_platform_manage" on public.event_types
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ------------------------------------------------------------
-- match_events
-- ------------------------------------------------------------
create table if not exists public.match_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  match_id          uuid not null references public.matches(id) on delete cascade,
  athlete_id        uuid references public.athletes(id),
  event_type_id     uuid not null references public.event_types(id),
  minute            integer,
  description       text,
  created_at        timestamptz not null default now()
);

create index match_events_match_id_idx on public.match_events(match_id);
create index match_events_athlete_id_idx on public.match_events(athlete_id);
create index match_events_org_idx on public.match_events(organization_id);

alter table public.match_events enable row level security;

-- Match events (goals, cards…) are public as part of match data.
create policy "match_events_public_read" on public.match_events
  for select
  to anon, authenticated
  using (true);

-- Organization members manage events of their matches.
create policy "match_events_member_insert" on public.match_events
  for insert
  to authenticated
  with check (public.can(organization_id, 'matches:update'));

create policy "match_events_member_update" on public.match_events
  for update
  to authenticated
  using (public.can(organization_id, 'matches:update'))
  with check (public.can(organization_id, 'matches:update'));

create policy "match_events_member_delete" on public.match_events
  for delete
  to authenticated
  using (public.can(organization_id, 'matches:update'));
