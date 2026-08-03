-- ============================================================
-- IP Sports OS — 0008: athletes, athlete_team_history,
--                     athlete_visibility, athlete_statistics
-- ============================================================

-- ------------------------------------------------------------
-- athletes (sport-agnostic person/player records)
-- ------------------------------------------------------------
create table if not exists public.athletes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  first_name        text not null,
  last_name         text not null,
  date_of_birth     date,
  nationality       text,
  position          text,
  shirt_number      integer,
  height            numeric(5,2),
  weight            numeric(5,2),
  preferred_foot    text check (preferred_foot in ('LEFT', 'RIGHT', 'BOTH')),
  photo_url         text,
  biography         text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index athletes_organization_id_idx on public.athletes(organization_id);
create index athletes_org_active_idx on public.athletes(organization_id, is_active, deleted_at);
create index athletes_position_idx on public.athletes(position);

create trigger athletes_set_updated_at
  before update on public.athletes
  for each row execute function public.set_updated_at();

alter table public.athletes enable row level security;

-- Public users see only athletes the club has published.
create policy "athletes_public_read" on public.athletes
  for select
  to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and public.is_athlete_public(id)
  );

-- Organization members read all athletes of their organization.
create policy "athletes_member_read" on public.athletes
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "athletes_member_insert" on public.athletes
  for insert
  to authenticated
  with check (public.can(organization_id, 'athletes:create'));

create policy "athletes_member_update" on public.athletes
  for update
  to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));

create policy "athletes_member_delete" on public.athletes
  for delete
  to authenticated
  using (public.can(organization_id, 'athletes:delete'));

-- ------------------------------------------------------------
-- athlete_team_history (career/transfer history)
-- ------------------------------------------------------------
create table if not exists public.athlete_team_history (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references public.athletes(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  start_date  date,
  end_date    date,
  is_current  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index athlete_team_history_athlete_id_idx on public.athlete_team_history(athlete_id);
create index athlete_team_history_team_id_idx on public.athlete_team_history(team_id);

alter table public.athlete_team_history enable row level security;

-- History of published athletes is public (career records).
create policy "athlete_team_history_public_read" on public.athlete_team_history
  for select
  to anon, authenticated
  using (public.is_athlete_public(athlete_id));

-- Organization members read history of their athletes.
create policy "athlete_team_history_member_read" on public.athlete_team_history
  for select
  to authenticated
  using (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.is_org_member(a.organization_id)
  ));

create policy "athlete_team_history_member_manage" on public.athlete_team_history
  for all
  to authenticated
  using (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.can(a.organization_id, 'athletes:update')
  ))
  with check (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.can(a.organization_id, 'athletes:update')
  ));

-- ------------------------------------------------------------
-- athlete_visibility (club-controlled public exposure)
-- ------------------------------------------------------------
create table if not exists public.athlete_visibility (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null unique references public.athletes(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id),
  is_public         boolean not null default false,
  show_age          boolean not null default false,
  show_height       boolean not null default false,
  show_weight       boolean not null default false,
  show_nationality  boolean not null default false,
  show_statistics   boolean not null default false,
  show_photo        boolean not null default false,
  show_biography    boolean not null default false,
  updated_at        timestamptz not null default now()
);

create index athlete_visibility_org_idx on public.athlete_visibility(organization_id);

create trigger athlete_visibility_set_updated_at
  before update on public.athlete_visibility
  for each row execute function public.set_updated_at();

alter table public.athlete_visibility enable row level security;

-- Visibility settings are internal; only members of the organization
-- (or platform admins) may read them.
create policy "athlete_visibility_member_read" on public.athlete_visibility
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "athlete_visibility_member_manage" on public.athlete_visibility
  for all
  to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));

-- ------------------------------------------------------------
-- athlete_statistics (separated from the core profile)
-- ------------------------------------------------------------
create table if not exists public.athlete_statistics (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  athlete_id        uuid not null references public.athletes(id) on delete cascade,
  season_id         uuid references public.seasons(id) on delete set null,
  appearances       integer not null default 0,
  minutes           integer not null default 0,
  goals             integer not null default 0,
  assists           integer not null default 0,
  rating            numeric(4,2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index athlete_statistics_athlete_id_idx on public.athlete_statistics(athlete_id);
create index athlete_statistics_org_idx on public.athlete_statistics(organization_id);
create index athlete_statistics_season_idx on public.athlete_statistics(season_id);

create trigger athlete_statistics_set_updated_at
  before update on public.athlete_statistics
  for each row execute function public.set_updated_at();

alter table public.athlete_statistics enable row level security;

-- Statistics of published athletes are public.
create policy "athlete_statistics_public_read" on public.athlete_statistics
  for select
  to anon, authenticated
  using (public.is_athlete_public(athlete_id));

-- Organization members read statistics of their athletes.
create policy "athlete_statistics_member_read" on public.athlete_statistics
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "athlete_statistics_member_manage" on public.athlete_statistics
  for all
  to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));
