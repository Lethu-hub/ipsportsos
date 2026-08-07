-- ============================================================
-- IP Sports OS — 0010: website system (pages, versions, news,
--                      club page sections)
-- ============================================================

-- ------------------------------------------------------------
-- website_pages (draft → review → publish workflow)
-- ------------------------------------------------------------
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

-- Public users see only published, public pages of active organizations.
create policy "website_pages_public_read" on public.website_pages
  for select
  to anon, authenticated
  using (
    status = 'PUBLISHED'
    and visibility = 'PUBLIC'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

-- Organization members read all pages of their organization.
create policy "website_pages_member_read" on public.website_pages
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "website_pages_member_insert" on public.website_pages
  for insert
  to authenticated
  with check (public.can(organization_id, 'website:create'));

create policy "website_pages_member_update" on public.website_pages
  for update
  to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "website_pages_member_delete" on public.website_pages
  for delete
  to authenticated
  using (public.can(organization_id, 'website:delete'));

-- ------------------------------------------------------------
-- website_page_versions (revision history)
-- ------------------------------------------------------------
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

-- Versions are internal (drafts included) — members only.
create policy "website_page_versions_member_read" on public.website_page_versions
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "website_page_versions_member_insert" on public.website_page_versions
  for insert
  to authenticated
  with check (public.can(organization_id, 'website:create'));

create policy "website_page_versions_member_update" on public.website_page_versions
  for update
  to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));

create policy "website_page_versions_member_delete" on public.website_page_versions
  for delete
  to authenticated
  using (public.can(organization_id, 'website:delete'));

-- ------------------------------------------------------------
-- news_items
-- ------------------------------------------------------------
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

-- Published public news of active organizations is public.
create policy "news_items_public_read" on public.news_items
  for select
  to anon, authenticated
  using (
    status = 'PUBLISHED'
    and visibility = 'PUBLIC'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
    )
  );

-- Organization members read all news of their organization.
create policy "news_items_member_read" on public.news_items
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "news_items_member_insert" on public.news_items
  for insert
  to authenticated
  with check (public.can(organization_id, 'news:create'));

create policy "news_items_member_update" on public.news_items
  for update
  to authenticated
  using (public.can(organization_id, 'news:update'))
  with check (public.can(organization_id, 'news:update'));

create policy "news_items_member_delete" on public.news_items
  for delete
  to authenticated
  using (public.can(organization_id, 'news:delete'));

-- ------------------------------------------------------------
-- club_page_sections (configurable sections on club landing page)
-- ------------------------------------------------------------
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

-- Section configuration of active organizations is public.
create policy "club_page_sections_public_read" on public.club_page_sections
  for select
  to anon, authenticated
  using (exists (
    select 1 from public.organizations o
    where o.id = organization_id and o.status = 'ACTIVE' and o.deleted_at is null
  ));

create policy "club_page_sections_member_manage" on public.club_page_sections
  for all
  to authenticated
  using (public.can(organization_id, 'website:update'))
  with check (public.can(organization_id, 'website:update'));
