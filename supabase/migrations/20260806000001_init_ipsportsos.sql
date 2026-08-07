-- ============================================================
-- IP Sports OS — Complete Database Initialization
-- ============================================================
-- Complete schema, security functions, RLS policies, audit system,
-- app RPCs, role catalogue, subscription plans, sport catalogue,
-- and default admin account (username: admin, password: Test123!).
-- ============================================================

set check_function_bodies = off;
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 1. Helper Functions (RLS & Security)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- ============================================================
-- 2. Sports
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

create policy "sports_public_read" on public.sports
  for select to anon, authenticated
  using (is_active = true);

create policy "sports_platform_manage" on public.sports
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ============================================================
-- 3. Organizations & Branding
-- ============================================================

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

create policy "organizations_public_read" on public.organizations
  for select to anon, authenticated
  using (status = 'ACTIVE' and deleted_at is null);

create policy "organizations_member_read" on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

create policy "organizations_platform_manage" on public.organizations
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

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

create policy "organization_branding_public_read" on public.organization_branding
  for select to anon, authenticated
  using (exists (
    select 1 from public.organizations o
    where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
  ));

create policy "organization_branding_member_manage" on public.organization_branding
  for all to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "organization_branding_member_read" on public.organization_branding
  for select to authenticated
  using (public.is_org_member(organization_id));

-- ============================================================
-- 4. Teams
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

create policy "teams_public_read" on public.teams
  for select to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

create policy "teams_member_read" on public.teams
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "teams_member_insert" on public.teams
  for insert to authenticated
  with check (public.can(organization_id, 'teams:create'));

create policy "teams_member_update" on public.teams
  for update to authenticated
  using (public.can(organization_id, 'teams:update'))
  with check (public.can(organization_id, 'teams:update'));

create policy "teams_member_delete" on public.teams
  for delete to authenticated
  using (public.can(organization_id, 'teams:delete'));

-- ============================================================
-- 5. Roles, Permissions, Role Permissions
-- ============================================================

create table if not exists public.roles (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  scope          text not null check (scope in ('PLATFORM', 'ORGANIZATION')),
  description    text,
  is_system_role boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.roles enable row level security;

create policy "roles_public_read" on public.roles
  for select to anon, authenticated
  using (true);

create policy "roles_platform_manage" on public.roles
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.permissions (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  description  text,
  module       text not null,
  action       text not null
);

alter table public.permissions enable row level security;

create policy "permissions_authenticated_read" on public.permissions
  for select to authenticated
  using (true);

create policy "permissions_platform_manage" on public.permissions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx on public.role_permissions(permission_id);

alter table public.role_permissions enable row level security;

create policy "role_permissions_authenticated_read" on public.role_permissions
  for select to authenticated
  using (true);

create policy "role_permissions_platform_manage" on public.role_permissions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ============================================================
-- 6. Profiles & Auth Trigger
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email        text not null unique,
  username     text unique,
  first_name   text,
  last_name    text,
  avatar_url   text,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'DISABLED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_status_idx on public.profiles(status);
create index profiles_username_idx on public.profiles(lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_username text;
begin
  v_username := lower(coalesce(
    new.raw_user_meta_data->>'username',
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  insert into public.profiles (id, auth_user_id, email, username)
  values (new.id, new.id, coalesce(new.email, ''), nullif(v_username, ''))
  on conflict (auth_user_id) do update
    set email = excluded.email,
        username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_own_read" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_own_update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and status <> 'DISABLED');

create policy "profiles_platform_manage" on public.profiles
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ============================================================
-- 7. Organization Memberships
-- ============================================================

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

create policy "organization_memberships_own_read" on public.organization_memberships
  for select to authenticated
  using (profile_id = public.current_profile_id());

create policy "organization_memberships_org_read" on public.organization_memberships
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "organization_memberships_platform_read" on public.organization_memberships
  for select to authenticated
  using (public.is_platform_admin());

create policy "organization_memberships_insert" on public.organization_memberships
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (public.has_permission(organization_id, 'users:create'))
    or (public.has_permission(organization_id, 'users:assign_role'))
  );

create policy "organization_memberships_update" on public.organization_memberships
  for update to authenticated
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
  for delete to authenticated
  using (
    public.is_platform_admin()
    or public.has_permission(organization_id, 'users:delete')
  );

-- ------------------------------------------------------------
-- Cross-table policies on public.profiles (now that organization_memberships exists)
-- ------------------------------------------------------------

create policy "profiles_member_read" on public.profiles
  for select to authenticated
  using (exists (
    select 1
    from public.organization_memberships m
    where m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and exists (
        select 1 from public.organization_memberships mine
        where mine.organization_id = m.organization_id
          and mine.profile_id = profiles.id
      )
  ));

create policy "profiles_member_update" on public.profiles
  for update to authenticated
  using (exists (
    select 1
    from public.organization_memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.profile_id = public.current_profile_id()
      and m.status = 'ACTIVE'
      and p.key = 'users:update'
      and exists (
        select 1 from public.organization_memberships target
        where target.organization_id = m.organization_id
          and target.profile_id = profiles.id
      )
  ))
  with check (true);

create policy "organization_memberships_delete" on public.organization_memberships
  for delete to authenticated
  using (
    public.is_platform_admin()
    or public.has_permission(organization_id, 'users:delete')
  );

-- ============================================================
-- 8. Competitions, Seasons, Competition Participants
-- ============================================================

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

create policy "competitions_public_read" on public.competitions
  for select to anon, authenticated
  using (true);

create policy "competitions_member_manage" on public.competitions
  for all to authenticated
  using (public.can(owner_organization_id, 'organizations:update'))
  with check (public.can(owner_organization_id, 'organizations:update'));

create policy "competitions_platform_manage" on public.competitions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- seasons created BEFORE competition_participants
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

create policy "seasons_public_read" on public.seasons
  for select to anon, authenticated
  using (true);

create policy "seasons_member_manage" on public.seasons
  for all to authenticated
  using (public.can(organization_id, 'matches:create'))
  with check (public.can(organization_id, 'matches:create'));

create policy "seasons_platform_manage" on public.seasons
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- competition_participants references seasons(id)
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

create policy "competition_participants_public_read" on public.competition_participants
  for select to anon, authenticated
  using (true);

create policy "competition_participants_member_manage" on public.competition_participants
  for all to authenticated
  using (exists (
    select 1 from public.teams t where t.id = team_id
      and public.can(t.organization_id, 'matches:create')
  ))
  with check (exists (
    select 1 from public.teams t where t.id = team_id
      and public.can(t.organization_id, 'matches:create')
  ));

create policy "competition_participants_platform_manage" on public.competition_participants
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ============================================================
-- 9. Athletes, History, Visibility, Statistics
-- ============================================================

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

create policy "athletes_public_read" on public.athletes
  for select to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and public.is_athlete_public(id)
  );

create policy "athletes_member_read" on public.athletes
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "athletes_member_insert" on public.athletes
  for insert to authenticated
  with check (public.can(organization_id, 'athletes:create'));

create policy "athletes_member_update" on public.athletes
  for update to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));

create policy "athletes_member_delete" on public.athletes
  for delete to authenticated
  using (public.can(organization_id, 'athletes:delete'));

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

create policy "athlete_team_history_public_read" on public.athlete_team_history
  for select to anon, authenticated
  using (public.is_athlete_public(athlete_id));

create policy "athlete_team_history_member_read" on public.athlete_team_history
  for select to authenticated
  using (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.is_org_member(a.organization_id)
  ));

create policy "athlete_team_history_member_manage" on public.athlete_team_history
  for all to authenticated
  using (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.can(a.organization_id, 'athletes:update')
  ))
  with check (exists (
    select 1 from public.athletes a
    where a.id = athlete_id and public.can(a.organization_id, 'athletes:update')
  ));

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

create policy "athlete_visibility_member_read" on public.athlete_visibility
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "athlete_visibility_member_manage" on public.athlete_visibility
  for all to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));

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

create policy "athlete_statistics_public_read" on public.athlete_statistics
  for select to anon, authenticated
  using (public.is_athlete_public(athlete_id));

create policy "athlete_statistics_member_read" on public.athlete_statistics
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "athlete_statistics_member_manage" on public.athlete_statistics
  for all to authenticated
  using (public.can(organization_id, 'athletes:update'))
  with check (public.can(organization_id, 'athletes:update'));

-- ============================================================
-- 10. Matches & Event Types
-- ============================================================

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

create policy "matches_public_read" on public.matches
  for select to anon, authenticated
  using (true);

create policy "matches_member_read" on public.matches
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "matches_member_insert" on public.matches
  for insert to authenticated
  with check (public.can(organization_id, 'matches:create'));

create policy "matches_member_update" on public.matches
  for update to authenticated
  using (public.can(organization_id, 'matches:update'))
  with check (public.can(organization_id, 'matches:update'));

create policy "matches_member_delete" on public.matches
  for delete to authenticated
  using (public.can(organization_id, 'matches:delete'));

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

create policy "event_types_public_read" on public.event_types
  for select to anon, authenticated
  using (is_active = true);

create policy "event_types_platform_manage" on public.event_types
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

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

create policy "match_events_public_read" on public.match_events
  for select to anon, authenticated
  using (true);

create policy "match_events_member_insert" on public.match_events
  for insert to authenticated
  with check (public.can(organization_id, 'matches:update'));

create policy "match_events_member_update" on public.match_events
  for update to authenticated
  using (public.can(organization_id, 'matches:update'))
  with check (public.can(organization_id, 'matches:update'));

create policy "match_events_member_delete" on public.match_events
  for delete to authenticated
  using (public.can(organization_id, 'matches:update'));

-- ============================================================
-- 11. Website Pages, Versions, News, Sections
-- ============================================================

create table if not exists public.website_pages (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id),
  team_id               uuid references public.teams(id),
  slug                  text not null,
  section_key           text not null,
  title                 text,
  body                  text,
  status                text not null default 'DRAFT' check (status in ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
  visibility            text not null default 'PUBLIC' check (visibility in ('PUBLIC', 'PRIVATE', 'MEMBERS_ONLY')),
  published_version_id  uuid,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  published_at          timestamptz,
  unique (organization_id, slug)
);

create index website_pages_org_status_idx on public.website_pages(organization_id, status);
create index website_pages_org_section_idx on public.website_pages(organization_id, section_key);

create trigger website_pages_set_updated_at
  before update on public.website_pages
  for each row execute function public.set_updated_at();

alter table public.website_pages enable row level security;

create policy "website_pages_public_read" on public.website_pages
  for select to anon, authenticated
  using (
    status = 'PUBLISHED'
    and visibility = 'PUBLIC'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

create policy "website_pages_member_read" on public.website_pages
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "website_pages_member_insert" on public.website_pages
  for insert to authenticated
  with check (public.can(organization_id, 'website:create'));

create policy "website_pages_member_update" on public.website_pages
  for update to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "website_pages_member_delete" on public.website_pages
  for delete to authenticated
  using (public.can(organization_id, 'website:delete'));

create table if not exists public.website_page_versions (
  id                uuid primary key default gen_random_uuid(),
  website_page_id   uuid not null references public.website_pages(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id),
  version_number    integer not null,
  title             text,
  body              text,
  status            text not null default 'DRAFT' check (status in ('DRAFT', 'REVIEW', 'PUBLISHED')),
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now(),
  published_at      timestamptz,
  unique (website_page_id, version_number)
);

create index website_page_versions_org_idx on public.website_page_versions(organization_id);
create index website_page_versions_page_idx on public.website_page_versions(website_page_id);

alter table public.website_page_versions enable row level security;

create policy "website_page_versions_member_read" on public.website_page_versions
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "website_page_versions_member_insert" on public.website_page_versions
  for insert to authenticated
  with check (public.can(organization_id, 'website:create'));

create policy "website_page_versions_member_update" on public.website_page_versions
  for update to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "website_page_versions_member_delete" on public.website_page_versions
  for delete to authenticated
  using (public.can(organization_id, 'website:delete'));

create table if not exists public.news_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  team_id           uuid references public.teams(id),
  title             text not null,
  summary           text,
  body              text,
  image_url         text,
  status            text not null default 'DRAFT' check (status in ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
  visibility        text not null default 'PUBLIC' check (visibility in ('PUBLIC', 'PRIVATE')),
  published_at      timestamptz,
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index news_items_org_status_idx on public.news_items(organization_id, status);
create index news_items_published_at_idx on public.news_items(published_at);

create trigger news_items_set_updated_at
  before update on public.news_items
  for each row execute function public.set_updated_at();

alter table public.news_items enable row level security;

create policy "news_items_public_read" on public.news_items
  for select to anon, authenticated
  using (
    status = 'PUBLISHED'
    and visibility = 'PUBLIC'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

create policy "news_items_member_read" on public.news_items
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "news_items_member_insert" on public.news_items
  for insert to authenticated
  with check (public.can(organization_id, 'news:create'));

create policy "news_items_member_update" on public.news_items
  for update to authenticated
  using (public.can(organization_id, 'news:update'))
  with check (public.can(organization_id, 'news:update'));

create policy "news_items_member_delete" on public.news_items
  for delete to authenticated
  using (public.can(organization_id, 'news:delete'));

create table if not exists public.club_page_sections (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  section_type      text not null check (section_type in ('history', 'squad', 'sponsors', 'news', 'stadium')),
  enabled           boolean not null default true,
  display_order     integer not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, section_type)
);

create index club_page_sections_org_idx on public.club_page_sections(organization_id);

create trigger club_page_sections_set_updated_at
  before update on public.club_page_sections
  for each row execute function public.set_updated_at();

alter table public.club_page_sections enable row level security;

create policy "club_page_sections_public_read" on public.club_page_sections
  for select to anon, authenticated
  using (exists (
    select 1 from public.organizations o
    where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
  ));

create policy "club_page_sections_member_manage" on public.club_page_sections
  for all to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

-- ============================================================
-- 12. Subscriptions & Feature Entitlements
-- ============================================================

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

create policy "subscription_plans_public_read" on public.subscription_plans
  for select to anon, authenticated
  using (is_active = true);

create policy "subscription_plans_platform_manage" on public.subscription_plans
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.organization_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null unique references public.organizations(id) on delete cascade,
  plan_id           uuid not null references public.subscription_plans(id),
  status            text not null default 'ACTIVE' check (status in ('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED')),
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

create policy "organization_subscriptions_member_read" on public.organization_subscriptions
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "organization_subscriptions_platform_manage" on public.organization_subscriptions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.feature_entitlements (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  feature_key       text not null,
  enabled           boolean not null default false,
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

create policy "feature_entitlements_member_read" on public.feature_entitlements
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "feature_entitlements_platform_manage" on public.feature_entitlements
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ============================================================
-- 13. Analytics Engine
-- ============================================================

create table if not exists public.analytics_definitions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  definition    jsonb not null,
  allowed_roles text[] not null default array['ANALYST', 'COACH', 'CLUB_ADMIN'],
  sport_id      uuid not null references public.sports(id),
  created_by    uuid not null references public.profiles(id),
  status        text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger analytics_definitions_set_updated_at
  before update on public.analytics_definitions
  for each row execute function public.set_updated_at();

alter table public.analytics_definitions enable row level security;

create policy "analytics_definitions_authenticated_read" on public.analytics_definitions
  for select to authenticated
  using (status = 'PUBLISHED' or public.is_platform_admin());

create policy "analytics_definitions_platform_manage" on public.analytics_definitions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.analytics_widgets (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid references public.organizations(id),
  analytics_definition_id uuid not null references public.analytics_definitions(id),
  name                    text not null,
  category                text not null check (category in ('PERFORMANCE', 'PLAYER', 'FORM')),
  widget_type             text not null check (widget_type in ('line_chart', 'bar_chart', 'table')),
  status                  text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
  created_by              uuid not null references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger analytics_widgets_set_updated_at
  before update on public.analytics_widgets
  for each row execute function public.set_updated_at();

alter table public.analytics_widgets enable row level security;

create policy "analytics_widgets_member_read" on public.analytics_widgets
  for select to authenticated
  using (organization_id is null or public.is_org_member(organization_id));

create policy "analytics_widgets_member_manage" on public.analytics_widgets
  for all to authenticated
  using (organization_id is not null and public.can(organization_id, 'analytics:create'))
  with check (organization_id is not null and public.can(organization_id, 'analytics:create'));

create policy "analytics_widgets_platform_manage" on public.analytics_widgets
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table if not exists public.dashboards (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  team_id           uuid references public.teams(id),
  name              text not null,
  role_scope        text check (role_scope in ('COACH', 'ANALYST', 'MEDICAL', 'SCOUT', 'PLAYER', 'ALL')),
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger dashboards_set_updated_at
  before update on public.dashboards
  for each row execute function public.set_updated_at();

alter table public.dashboards enable row level security;

create policy "dashboards_member_read" on public.dashboards
  for select to authenticated
  using (public.has_permission(organization_id, 'dashboards:read'));

create policy "dashboards_member_manage" on public.dashboards
  for all to authenticated
  using (public.can(organization_id, 'dashboards:create'))
  with check (public.can(organization_id, 'dashboards:create'));

create table if not exists public.dashboard_widgets (
  id                uuid primary key default gen_random_uuid(),
  dashboard_id      uuid not null references public.dashboards(id) on delete cascade,
  widget_id         uuid not null references public.analytics_widgets(id) on delete cascade,
  position          integer not null,
  size              text not null default 'MEDIUM' check (size in ('SMALL', 'MEDIUM', 'LARGE')),
  created_at        timestamptz not null default now()
);

alter table public.dashboard_widgets enable row level security;

create policy "dashboard_widgets_member_read" on public.dashboard_widgets
  for select to authenticated
  using (exists (
    select 1 from public.dashboards d
    where d.id = dashboard_id
      and public.has_permission(d.organization_id, 'dashboards:read')
  ));

create policy "dashboard_widgets_member_manage" on public.dashboard_widgets
  for all to authenticated
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

-- ============================================================
-- 14. Audit Logs & Triggers
-- ============================================================

create table if not exists public.audit_logs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid references public.organizations(id),
  actor_profile_id  uuid references public.profiles(id),
  action            text not null,
  entity_type       text not null,
  entity_id         uuid,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  ip_address        text,
  session_id        text
);

create index audit_logs_organization_id_idx on public.audit_logs(organization_id);
create index audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_authenticated_insert" on public.audit_logs
  for insert to authenticated
  with check (true);

create policy "audit_logs_platform_read" on public.audit_logs
  for select to authenticated
  using (public.is_platform_admin());

create or replace function public.log_action(
  p_action          text,
  p_entity_type     text,
  p_entity_id       uuid default null,
  p_organization_id uuid default null,
  p_metadata        jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_profile_id uuid := public.current_profile_id();
  v_id               uuid;
begin
  if v_actor_profile_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_organization_id is not null
     and not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
    raise exception 'You cannot write audit events for this organization';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    p_organization_id,
    v_actor_profile_id,
    upper(trim(p_action)),
    lower(trim(p_entity_type)),
    p_entity_id,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_action(text, text, uuid, uuid, jsonb) from public;
grant execute on function public.log_action(text, text, uuid, uuid, jsonb) to authenticated;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_profile_id uuid := public.current_profile_id();
  v_organization_id  uuid;
  v_entity_id        uuid;
  v_action           text := case TG_OP
                               when 'INSERT' then 'CREATE'
                               when 'UPDATE' then 'UPDATE'
                               when 'DELETE' then 'DELETE'
                             end;
  v_metadata         jsonb := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP
  );
begin
  if v_actor_profile_id is null then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if TG_OP = 'DELETE' then
    v_entity_id := old.id;
  else
    v_entity_id := new.id;
  end if;

  if TG_OP <> 'DELETE' then
    case TG_TABLE_NAME
      when 'organizations' then v_organization_id := new.id;
      when 'organization_memberships' then v_organization_id := new.organization_id;
      when 'organization_branding' then v_organization_id := new.organization_id;
      when 'teams' then v_organization_id := new.organization_id;
      when 'athletes' then v_organization_id := new.organization_id;
      when 'athlete_visibility' then v_organization_id := new.organization_id;
      when 'athlete_statistics' then v_organization_id := new.organization_id;
      when 'matches' then v_organization_id := new.organization_id;
      when 'match_events' then v_organization_id := new.organization_id;
      when 'website_pages' then v_organization_id := new.organization_id;
      when 'website_page_versions' then v_organization_id := new.organization_id;
      when 'news_items' then v_organization_id := new.organization_id;
      when 'club_page_sections' then v_organization_id := new.organization_id;
      when 'organization_subscriptions' then v_organization_id := new.organization_id;
      when 'feature_entitlements' then v_organization_id := new.organization_id;
      when 'dashboards' then v_organization_id := new.organization_id;
      when 'analytics_widgets' then v_organization_id := new.organization_id;
      else v_organization_id := null;
    end case;
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    v_organization_id,
    v_actor_profile_id,
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_metadata
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'sports',
    'organizations',
    'organization_memberships',
    'organization_branding',
    'teams',
    'athletes',
    'athlete_team_history',
    'athlete_visibility',
    'athlete_statistics',
    'matches',
    'match_events',
    'website_pages',
    'website_page_versions',
    'news_items',
    'club_page_sections',
    'organization_subscriptions',
    'feature_entitlements',
    'dashboards',
    'analytics_widgets'
  ] loop
    execute format('drop trigger if exists audit_%I_change on public.%I', v_table, v_table);
    execute format(
      'create trigger audit_%I_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      v_table,
      v_table
    );
  end loop;
end;
$$;

-- ============================================================
-- 15. Application Helper Functions (RPC)
-- ============================================================

create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text;
  v_clean text := lower(trim(p_identifier));
begin
  if v_clean is null or v_clean = '' then
    return null;
  end if;

  if position('@' in v_clean) > 0 then
    select email into v_email
    from public.profiles
    where lower(email) = v_clean
    limit 1;

    return coalesce(v_email, v_clean);
  end if;

  select email into v_email
  from public.profiles
  where lower(username) = v_clean
  limit 1;

  if v_email is null then
    select email into v_email
    from public.profiles
    where lower(split_part(email, '@', 1)) = v_clean
    limit 1;
  end if;

  if v_email is null then
    select email into v_email
    from auth.users
    where lower(email) = v_clean
       or lower(split_part(email, '@', 1)) = v_clean
       or lower(raw_user_meta_data->>'username') = v_clean
    limit 1;
  end if;

  return v_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.create_staff_user(
  p_organization_id uuid,
  p_role_name       text,
  p_email           text,
  p_password        text,
  p_first_name      text default null,
  p_last_name       text default null,
  p_username        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller       uuid := public.current_profile_id();
  v_role_id      uuid;
  v_role_scope   text;
  v_org_id       uuid := p_organization_id;
  v_user_id      uuid;
  v_profile_id   uuid;
  v_new_email    text := lower(trim(p_email));
  v_username     text := lower(trim(coalesce(p_username, split_part(v_new_email, '@', 1))));
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if v_new_email is null or v_new_email = '' then
    raise exception 'Email is required';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  select r.id, r.scope into v_role_id, v_role_scope
  from public.roles r
  where r.name = p_role_name;

  if v_role_id is null then
    raise exception 'Unknown role: %', p_role_name;
  end if;

  if v_role_scope = 'PLATFORM' then
    if not public.is_platform_admin() then
      raise exception 'Only platform administrators can assign platform roles';
    end if;
    v_org_id := null;
  else
    if v_org_id is null then
      raise exception 'An organization is required for organization roles';
    end if;
    if not (public.is_platform_admin() or public.has_permission(v_org_id, 'users:create')) then
      raise exception 'You do not have permission to create users in this organization';
    end if;
  end if;

  if exists (select 1 from public.profiles where lower(username) = v_username and lower(email) <> v_new_email) then
    raise exception 'Username "%" is already taken', v_username;
  end if;

  select id into v_user_id
  from auth.users
  where email = v_new_email
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_new_email,
      extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_username, 'full_name', trim(concat(coalesce(p_first_name, ''), ' ', coalesce(p_last_name, '')))),
      false,
      false,
      now(),
      now()
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_new_email, 'email_verified', true),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    )
    on conflict do nothing;
  else
    update auth.users
    set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_user_id;

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_new_email, 'email_verified', true),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    )
    on conflict do nothing;
  end if;

  insert into public.profiles (id, auth_user_id, email, username, first_name, last_name, status)
  values (v_user_id, v_user_id, v_new_email, v_username, p_first_name, p_last_name, 'ACTIVE')
  on conflict (auth_user_id) do update
    set first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name  = coalesce(excluded.last_name, public.profiles.last_name),
        username   = coalesce(excluded.username, public.profiles.username),
        email      = v_new_email
  returning id into v_profile_id;

  insert into public.organization_memberships (
    organization_id, profile_id, role_id, status, invited_by
  ) values (
    v_org_id, v_profile_id, v_role_id, 'ACTIVE', v_caller
  )
  on conflict (organization_id, profile_id, role_id) do update
    set status = 'ACTIVE', invited_by = v_caller;

  perform public.log_action(
    'CREATE',
    'profiles',
    v_profile_id,
    v_org_id,
    jsonb_build_object('email', v_new_email, 'username', v_username, 'role', p_role_name, 'created_by', v_caller::text)
  );

  return v_profile_id;
end;
$$;

revoke all on function public.create_staff_user(uuid, text, text, text, text, text, text) from public;
grant execute on function public.create_staff_user(uuid, text, text, text, text, text, text) to authenticated;

create or replace function public.get_my_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_result  jsonb;
begin
  if v_profile is null then
    return '[]'::jsonb;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'membership_id', m.id,
      'organization_id', m.organization_id,
      'organization_name', o.name,
      'organization_slug', o.slug,
      'organization_type', o.organization_type,
      'role', r.name,
      'role_scope', r.scope,
      'permissions', coalesce((
        select jsonb_agg(p.key order by p.key)
        from public.role_permissions rp
        join public.permissions p on p.id = rp.permission_id
        where rp.role_id = m.role_id
      ), '[]'::jsonb)
    ) order by r.scope, o.name
  )
  into v_result
  from public.organization_memberships m
  join public.roles r on r.id = m.role_id
  left join public.organizations o on o.id = m.organization_id
  where m.profile_id = v_profile
    and m.status = 'ACTIVE';

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_access() from public;
grant execute on function public.get_my_access() to authenticated;

-- ============================================================
-- 16. Default Catalogue Seeds & Default Admin Creation
-- ============================================================

-- Roles
insert into public.roles (id, name, scope, description, is_system_role) values
  ('00000000-0000-0000-0000-000000000101', 'PLATFORM_OWNER', 'PLATFORM', 'Highest platform-level authority; manages the entire platform.', true),
  ('00000000-0000-0000-0000-000000000102', 'SUPER_ADMIN',    'PLATFORM', 'Manages organizations, roles, and platform features.', true),
  ('00000000-0000-0000-0000-000000000201', 'CLUB_ADMIN',     'ORGANIZATION', 'Manages club content, team data, and portal operations.', true),
  ('00000000-0000-0000-0000-000000000202', 'COACH',          'ORGANIZATION', 'Manages squads, matches, and coaching data.', true),
  ('00000000-0000-0000-0000-000000000203', 'ANALYST',        'ORGANIZATION', 'Builds and views analytics dashboards.', true),
  ('00000000-0000-0000-0000-000000000204', 'MEDIA',          'ORGANIZATION', 'Manages the club website and news.', true),
  ('00000000-0000-0000-0000-000000000205', 'MEDICAL',        'ORGANIZATION', 'Manages athlete medical and performance data.', true),
  ('00000000-0000-0000-0000-000000000206', 'SCOUT',          'ORGANIZATION', 'Reads athlete and match data for scouting.', true),
  ('00000000-0000-0000-0000-000000000207', 'PLAYER',         'ORGANIZATION', 'Reads own club data (squad, fixtures, results).', true)
on conflict (name) do nothing;

-- Permissions
insert into public.permissions (id, key, description, module, action) values
  ('00000000-0000-0000-0000-000000010001', 'sports:create',       'Create sports', 'sports', 'create'),
  ('00000000-0000-0000-0000-000000010002', 'sports:update',       'Update sports', 'sports', 'update'),
  ('00000000-0000-0000-0000-000000010003', 'sports:delete',       'Delete sports', 'sports', 'delete'),
  ('00000000-0000-0000-0000-000000010101', 'organizations:create', 'Create organizations', 'organizations', 'create'),
  ('00000000-0000-0000-0000-000000010102', 'organizations:update', 'Update organizations', 'organizations', 'update'),
  ('00000000-0000-0000-0000-000000010103', 'organizations:delete', 'Delete organizations', 'organizations', 'delete'),
  ('00000000-0000-0000-0000-000000010104', 'organizations:suspend','Suspend organizations', 'organizations', 'update'),
  ('00000000-0000-0000-0000-000000020001', 'teams:create',        'Create teams', 'teams', 'create'),
  ('00000000-0000-0000-0000-000000020002', 'teams:read',          'Read teams', 'teams', 'read'),
  ('00000000-0000-0000-0000-000000020003', 'teams:update',        'Update teams', 'teams', 'update'),
  ('00000000-0000-0000-0000-000000020004', 'teams:delete',        'Delete teams', 'teams', 'delete'),
  ('00000000-0000-0000-0000-000000030001', 'athletes:create',     'Create athletes', 'athletes', 'create'),
  ('00000000-0000-0000-0000-000000030002', 'athletes:read',       'Read athletes', 'athletes', 'read'),
  ('00000000-0000-0000-0000-000000030003', 'athletes:update',     'Update athletes', 'athletes', 'update'),
  ('00000000-0000-0000-0000-000000030004', 'athletes:delete',     'Delete athletes', 'athletes', 'delete'),
  ('00000000-0000-0000-0000-000000030005', 'athletes:publish',    'Control public visibility of athletes', 'athletes', 'publish'),
  ('00000000-0000-0000-0000-000000040001', 'matches:create',      'Create matches', 'matches', 'create'),
  ('00000000-0000-0000-0000-000000040002', 'matches:read',        'Read matches', 'matches', 'read'),
  ('00000000-0000-0000-0000-000000040003', 'matches:update',      'Update matches', 'matches', 'update'),
  ('00000000-0000-0000-0000-000000040004', 'matches:delete',      'Delete matches', 'matches', 'delete'),
  ('00000000-0000-0000-0000-000000050001', 'website:create',      'Create website pages', 'website', 'create'),
  ('00000000-0000-0000-0000-000000050002', 'website:read',        'Read website content', 'website', 'read'),
  ('00000000-0000-0000-0000-000000050003', 'website:update',      'Update website pages', 'website', 'update'),
  ('00000000-0000-0000-0000-000000050004', 'website:delete',      'Delete website pages', 'website', 'delete'),
  ('00000000-0000-0000-0000-000000050005', 'website:publish',     'Publish website content', 'website', 'publish'),
  ('00000000-0000-0000-0000-000000050101', 'news:create',         'Create news', 'news', 'create'),
  ('00000000-0000-0000-0000-000000050102', 'news:update',         'Update news', 'news', 'update'),
  ('00000000-0000-0000-0000-000000050103', 'news:delete',         'Delete news', 'news', 'delete'),
  ('00000000-0000-0000-0000-000000050104', 'news:publish',        'Publish news', 'news', 'publish'),
  ('00000000-0000-0000-0000-000000060001', 'users:create',        'Create users', 'users', 'create'),
  ('00000000-0000-0000-0000-000000060002', 'users:read',          'Read users', 'users', 'read'),
  ('00000000-0000-0000-0000-000000060003', 'users:update',        'Update users', 'users', 'update'),
  ('00000000-0000-0000-0000-000000060004', 'users:delete',        'Remove users', 'users', 'delete'),
  ('00000000-0000-0000-0000-000000060005', 'users:assign_role',   'Assign roles to users', 'users', 'assign_role'),
  ('00000000-0000-0000-0000-000000070001', 'analytics:create',    'Create analytics', 'analytics', 'create'),
  ('00000000-0000-0000-0000-000000070002', 'analytics:read',      'Read analytics', 'analytics', 'read'),
  ('00000000-0000-0000-0000-000000070003', 'analytics:update',    'Update analytics', 'analytics', 'update'),
  ('00000000-0000-0000-0000-000000070004', 'analytics:delete',    'Delete analytics', 'analytics', 'delete'),
  ('00000000-0000-0000-0000-000000070005', 'analytics:publish',   'Publish analytics', 'analytics', 'publish'),
  ('00000000-0000-0000-0000-000000070101', 'dashboards:create',   'Create dashboards', 'dashboards', 'create'),
  ('00000000-0000-0000-0000-000000070102', 'dashboards:read',     'Read dashboards', 'dashboards', 'read'),
  ('00000000-0000-0000-0000-000000070103', 'dashboards:update',   'Update dashboards', 'dashboards', 'update'),
  ('00000000-0000-0000-0000-000000070104', 'dashboards:delete',   'Delete dashboards', 'dashboards', 'delete'),
  ('00000000-0000-0000-0000-000000080001', 'subscriptions:create','Create subscriptions', 'subscriptions', 'create'),
  ('00000000-0000-0000-0000-000000080002', 'subscriptions:read',  'Read subscriptions', 'subscriptions', 'read'),
  ('00000000-0000-0000-0000-000000080003', 'subscriptions:update','Update subscriptions', 'subscriptions', 'update'),
  ('00000000-0000-0000-0000-000000090001', 'settings:read',       'Read organization settings', 'settings', 'read'),
  ('00000000-0000-0000-0000-000000090002', 'settings:update',     'Update organization settings', 'settings', 'update'),
  ('00000000-0000-0000-0000-000000100001', 'audit:read',          'Read audit logs', 'audit', 'read')
on conflict (key) do nothing;

-- Role → Permission Mappings
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name in ('PLATFORM_OWNER', 'SUPER_ADMIN')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.name = 'CLUB_ADMIN' and p.module not in ('sports')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'COACH'
  and p.key in ('teams:read', 'athletes:read', 'athletes:update', 'athletes:publish',
                'matches:read', 'matches:update', 'analytics:read', 'dashboards:read',
                'settings:read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'ANALYST'
  and p.key in ('teams:read', 'athletes:read', 'matches:read',
                'analytics:read', 'analytics:create', 'analytics:update',
                'dashboards:read', 'dashboards:create', 'dashboards:update',
                'settings:read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'MEDIA'
  and p.key in ('teams:read', 'athletes:read', 'matches:read',
                'website:create', 'website:read', 'website:update', 'website:delete', 'website:publish',
                'news:create', 'news:update', 'news:delete', 'news:publish')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'MEDICAL'
  and p.key in ('teams:read', 'athletes:read', 'athletes:update', 'matches:read', 'settings:read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'SCOUT'
  and p.key in ('teams:read', 'athletes:read', 'matches:read', 'analytics:read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on true
where r.name = 'PLAYER'
  and p.key in ('teams:read', 'athletes:read', 'matches:read', 'dashboards:read')
on conflict do nothing;

-- Sports baseline
insert into public.sports (name, code, is_active)
values ('Football', 'FOOTBALL', true)
on conflict (code) do update set name = excluded.name, is_active = true;

-- Subscription plans baseline
insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
values
  ('Starter', 'STARTER', 'For clubs getting started', 1, 3, 10, 5, 20, true),
  ('Professional', 'PROFESSIONAL', 'For growing clubs', 3, 10, 50, 25, 200, true),
  ('Enterprise', 'ENTERPRISE', 'For leagues and large organisations', null, null, null, null, null, true)
on conflict (code) do nothing;

-- ============================================================
-- 17. Seed Default Admin User
-- ============================================================
-- Username: admin
-- Password: Test123!
-- Role:     PLATFORM_OWNER
-- ============================================================

do $$
declare
  v_user_id    uuid := gen_random_uuid();
  v_profile_id uuid;
  v_role_id    uuid;
begin
  select id into v_role_id
  from public.roles
  where name = 'PLATFORM_OWNER'
  limit 1;

  if v_role_id is null then
    raise exception 'PLATFORM_OWNER role not found';
  end if;

  -- Create auth user with username 'admin'
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'admin@ipsportsos.app',
    extensions.crypt('Test123!', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name": "Platform Admin", "username": "admin"}'::jsonb,
    false,
    false,
    now(),
    now()
  );

  -- Insert identity for email/password authentication
  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'admin@ipsportsos.app', 'email_verified', true),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  on conflict do nothing;

  -- Profile (username = 'admin')
  insert into public.profiles (id, auth_user_id, email, username, first_name, last_name, status)
  values (v_user_id, v_user_id, 'admin@ipsportsos.app', 'admin', 'Platform', 'Admin', 'ACTIVE')
  on conflict (auth_user_id) do update
    set username = 'admin', first_name = 'Platform', last_name = 'Admin', status = 'ACTIVE';

  select id into v_profile_id
  from public.profiles
  where auth_user_id = v_user_id;

  -- Platform membership
  insert into public.organization_memberships (organization_id, profile_id, role_id, status)
  values (null, v_profile_id, v_role_id, 'ACTIVE')
  on conflict (organization_id, profile_id, role_id) do update
    set status = 'ACTIVE';

end $$;
