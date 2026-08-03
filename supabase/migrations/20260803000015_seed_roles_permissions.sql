-- ============================================================
-- IP Sports OS — 0015: seed default roles & permissions
-- ============================================================
-- Idempotent: safe to re-run. Uses fixed UUIDs so the role →
-- permission mapping below is deterministic.

-- ------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------
insert into public.permissions (id, key, description, module, action) values
  -- sports (platform)
  ('00000000-0000-0000-0000-000000010001', 'sports:create',       'Create sports', 'sports', 'create'),
  ('00000000-0000-0000-0000-000000010002', 'sports:update',       'Update sports', 'sports', 'update'),
  ('00000000-0000-0000-0000-000000010003', 'sports:delete',       'Delete sports', 'sports', 'delete'),
  -- organizations (platform)
  ('00000000-0000-0000-0000-000000010101', 'organizations:create', 'Create organizations', 'organizations', 'create'),
  ('00000000-0000-0000-0000-000000010102', 'organizations:update', 'Update organizations', 'organizations', 'update'),
  ('00000000-0000-0000-0000-000000010103', 'organizations:delete', 'Delete organizations', 'organizations', 'delete'),
  ('00000000-0000-0000-0000-000000010104', 'organizations:suspend','Suspend organizations', 'organizations', 'update'),
  -- teams
  ('00000000-0000-0000-0000-000000020001', 'teams:create',        'Create teams', 'teams', 'create'),
  ('00000000-0000-0000-0000-000000020002', 'teams:read',          'Read teams', 'teams', 'read'),
  ('00000000-0000-0000-0000-000000020003', 'teams:update',        'Update teams', 'teams', 'update'),
  ('00000000-0000-0000-0000-000000020004', 'teams:delete',        'Delete teams', 'teams', 'delete'),
  -- athletes
  ('00000000-0000-0000-0000-000000030001', 'athletes:create',     'Create athletes', 'athletes', 'create'),
  ('00000000-0000-0000-0000-000000030002', 'athletes:read',       'Read athletes', 'athletes', 'read'),
  ('00000000-0000-0000-0000-000000030003', 'athletes:update',     'Update athletes', 'athletes', 'update'),
  ('00000000-0000-0000-0000-000000030004', 'athletes:delete',     'Delete athletes', 'athletes', 'delete'),
  ('00000000-0000-0000-0000-000000030005', 'athletes:publish',    'Control public visibility of athletes', 'athletes', 'publish'),
  -- matches
  ('00000000-0000-0000-0000-000000040001', 'matches:create',      'Create matches', 'matches', 'create'),
  ('00000000-0000-0000-0000-000000040002', 'matches:read',        'Read matches', 'matches', 'read'),
  ('00000000-0000-0000-0000-000000040003', 'matches:update',      'Update matches', 'matches', 'update'),
  ('00000000-0000-0000-0000-000000040004', 'matches:delete',      'Delete matches', 'matches', 'delete'),
  -- website
  ('00000000-0000-0000-0000-000000050001', 'website:create',      'Create website pages', 'website', 'create'),
  ('00000000-0000-0000-0000-000000050002', 'website:read',        'Read website content', 'website', 'read'),
  ('00000000-0000-0000-0000-000000050003', 'website:update',      'Update website pages', 'website', 'update'),
  ('00000000-0000-0000-0000-000000050004', 'website:delete',      'Delete website pages', 'website', 'delete'),
  ('00000000-0000-0000-0000-000000050005', 'website:publish',     'Publish website content', 'website', 'publish'),
  -- news
  ('00000000-0000-0000-0000-000000050101', 'news:create',         'Create news', 'news', 'create'),
  ('00000000-0000-0000-0000-000000050102', 'news:update',         'Update news', 'news', 'update'),
  ('00000000-0000-0000-0000-000000050103', 'news:delete',         'Delete news', 'news', 'delete'),
  ('00000000-0000-0000-0000-000000050104', 'news:publish',        'Publish news', 'news', 'publish'),
  -- users
  ('00000000-0000-0000-0000-000000060001', 'users:create',        'Create users', 'users', 'create'),
  ('00000000-0000-0000-0000-000000060002', 'users:read',          'Read users', 'users', 'read'),
  ('00000000-0000-0000-0000-000000060003', 'users:update',        'Update users', 'users', 'update'),
  ('00000000-0000-0000-0000-000000060004', 'users:delete',        'Remove users', 'users', 'delete'),
  ('00000000-0000-0000-0000-000000060005', 'users:assign_role',   'Assign roles to users', 'users', 'assign_role'),
  -- analytics
  ('00000000-0000-0000-0000-000000070001', 'analytics:create',    'Create analytics', 'analytics', 'create'),
  ('00000000-0000-0000-0000-000000070002', 'analytics:read',      'Read analytics', 'analytics', 'read'),
  ('00000000-0000-0000-0000-000000070003', 'analytics:update',    'Update analytics', 'analytics', 'update'),
  ('00000000-0000-0000-0000-000000070004', 'analytics:delete',    'Delete analytics', 'analytics', 'delete'),
  ('00000000-0000-0000-0000-000000070005', 'analytics:publish',   'Publish analytics', 'analytics', 'publish'),
  -- dashboards
  ('00000000-0000-0000-0000-000000070101', 'dashboards:create',   'Create dashboards', 'dashboards', 'create'),
  ('00000000-0000-0000-0000-000000070102', 'dashboards:read',     'Read dashboards', 'dashboards', 'read'),
  ('00000000-0000-0000-0000-000000070103', 'dashboards:update',   'Update dashboards', 'dashboards', 'update'),
  ('00000000-0000-0000-0000-000000070104', 'dashboards:delete',   'Delete dashboards', 'dashboards', 'delete'),
  -- subscriptions
  ('00000000-0000-0000-0000-000000080001', 'subscriptions:create','Create subscriptions', 'subscriptions', 'create'),
  ('00000000-0000-0000-0000-000000080002', 'subscriptions:read',  'Read subscriptions', 'subscriptions', 'read'),
  ('00000000-0000-0000-0000-000000080003', 'subscriptions:update','Update subscriptions', 'subscriptions', 'update'),
  -- settings
  ('00000000-0000-0000-0000-000000090001', 'settings:read',       'Read organization settings', 'settings', 'read'),
  ('00000000-0000-0000-0000-000000090002', 'settings:update',     'Update organization settings', 'settings', 'update'),
  -- audit
  ('00000000-0000-0000-0000-000000100001', 'audit:read',          'Read audit logs', 'audit', 'read')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Role → permission mapping
-- ------------------------------------------------------------
-- Platform roles get every permission.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('PLATFORM_OWNER', 'SUPER_ADMIN')
on conflict do nothing;

-- CLUB_ADMIN: everything organization-scoped.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'CLUB_ADMIN'
  and p.module not in ('sports')
on conflict do nothing;

-- COACH
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'COACH'
  and p.key in ('teams:read', 'athletes:read', 'athletes:update', 'athletes:publish',
                'matches:read', 'matches:update', 'analytics:read', 'dashboards:read',
                'settings:read')
on conflict do nothing;

-- ANALYST
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'ANALYST'
  and p.key in ('teams:read', 'athletes:read', 'matches:read',
                'analytics:read', 'analytics:create', 'analytics:update',
                'dashboards:read', 'dashboards:create', 'dashboards:update',
                'settings:read')
on conflict do nothing;

-- MEDIA
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'MEDIA'
  and p.key in ('teams:read', 'athletes:read', 'matches:read',
                'website:create', 'website:read', 'website:update', 'website:delete', 'website:publish',
                'news:create', 'news:update', 'news:delete', 'news:publish')
on conflict do nothing;

-- MEDICAL
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'MEDICAL'
  and p.key in ('teams:read', 'athletes:read', 'athletes:update', 'matches:read', 'settings:read')
on conflict do nothing;

-- SCOUT
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'SCOUT'
  and p.key in ('teams:read', 'athletes:read', 'matches:read', 'analytics:read')
on conflict do nothing;

-- PLAYER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'PLAYER'
  and p.key in ('teams:read', 'athletes:read', 'matches:read', 'dashboards:read')
on conflict do nothing;
