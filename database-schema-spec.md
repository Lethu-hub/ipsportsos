# IP Sports OS Database Schema Specification

## 1. Design principles
- Multi-tenant first: every organization-owned record must include organization_id.
- Sport-agnostic core: use generic entities for organizations, teams, players, matches, competitions, seasons, and events.
- Role-based access enforced at database and application layers.
- Subscription and feature access are first-class platform concerns.
- Public content uses a draft → preview → publish workflow.
- Player visibility is controlled by club staff and enforced in the data layer.
- Audit logging is mandatory for sensitive and administrative actions.

## 2. Core entity model

### 2.1 sports
Purpose: supported sports in the platform.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | NOT NULL | e.g. Football, Basketball |
| code | text | UNIQUE, NOT NULL | short code |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 2.2 organizations
Purpose: tenant/customer root entity.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | NOT NULL | club, academy, league, association |
| slug | text | UNIQUE, NOT NULL | public URL identifier |
| organization_type | text | NOT NULL | CLUB, LEAGUE, ACADEMY, ASSOCIATION |
| sport_id | uuid | FK -> sports.id | primary sport |
| status | text | NOT NULL | ACTIVE, PAUSED, SUSPENDED |
| subscription_status | text | NOT NULL | ACTIVE, PENDING, EXPIRED |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| deleted_at | timestamptz | NULL | soft delete |

### 2.3 organization_branding
Purpose: club-controlled branding for public pages.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, UNIQUE | |
| primary_color | text | NULL | hex or token reference |
| secondary_color | text | NULL | |
| accent_color | text | NULL | |
| font_family | text | NULL | |
| logo_url | text | NULL | |
| banner_url | text | NULL | |
| cover_url | text | NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

## 3. Identity, roles, and permissions

### 3.1 profiles
Purpose: application user profile linked to Supabase Auth.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| auth_user_id | uuid | UNIQUE, NOT NULL | Supabase Auth user id |
| email | text | UNIQUE, NOT NULL | |
| first_name | text | NULL | |
| last_name | text | NULL | |
| avatar_url | text | NULL | |
| status | text | NOT NULL | ACTIVE, INVITED, DISABLED |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 3.2 roles
Purpose: platform and organization roles.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | NOT NULL | PLATFORM_OWNER, SUPER_ADMIN, CLUB_ADMIN, COACH, ANALYST, MEDIA, MEDICAL, SCOUT, PLAYER |
| scope | text | NOT NULL | PLATFORM or ORGANIZATION |
| description | text | NULL | |
| is_system_role | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### 3.3 permissions
Purpose: granular permissions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| key | text | UNIQUE, NOT NULL | e.g. players:create |
| description | text | NULL | |
| module | text | NOT NULL | users, players, matches, website, analytics |
| action | text | NOT NULL | create, read, update, delete, publish |

### 3.4 role_permissions
Purpose: many-to-many role to permission mapping.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| role_id | uuid | FK -> roles.id | |
| permission_id | uuid | FK -> permissions.id | |
| PRIMARY KEY | (role_id, permission_id) | | |

### 3.5 organization_memberships
Purpose: links profiles to organizations and assigns roles within each tenant.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id | |
| profile_id | uuid | FK -> profiles.id | |
| role_id | uuid | FK -> roles.id | |
| status | text | NOT NULL | ACTIVE, INVITED, REMOVED |
| invited_by | uuid | FK -> profiles.id, NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

## 4. Multi-tenant core entities

### 4.1 teams
Purpose: organization-owned sporting teams.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | tenant ownership |
| sport_id | uuid | FK -> sports.id, NOT NULL | |
| name | text | NOT NULL | |
| slug | text | NOT NULL | |
| gender | text | NULL | MEN, WOMEN, MIXED |
| category | text | NULL | SENIOR, U21, ACADEMY |
| logo_url | text | NULL | |
| banner_url | text | NULL | |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| deleted_at | timestamptz | NULL | soft delete |

### 4.2 competitions
Purpose: competitions or leagues. Ownership is modeled separately from participation.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| sport_id | uuid | FK -> sports.id, NOT NULL | |
| owner_organization_id | uuid | FK -> organizations.id, NULL | league or governing body owner |
| name | text | NOT NULL | |
| country | text | NULL | |
| slug | text | NOT NULL | |
| status | text | NOT NULL | UPCOMING, ACTIVE, COMPLETED |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 4.3 competition_participants
Purpose: links teams to competitions and seasons.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| competition_id | uuid | FK -> competitions.id, NOT NULL | |
| team_id | uuid | FK -> teams.id, NOT NULL | |
| season_id | uuid | FK -> seasons.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### 4.4 seasons
Purpose: seasons within competitions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| competition_id | uuid | FK -> competitions.id, NOT NULL | |
| name | text | NOT NULL | e.g. 2026 Season |
| start_date | date | NULL | |
| end_date | date | NULL | |
| is_active | boolean | DEFAULT false | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

## 5. Player and match domain

### 5.1 athletes
Purpose: canonical athlete/person records. The application may expose these as players in the UI, but the database model remains sport-agnostic and athlete-centric.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| first_name | text | NOT NULL | |
| last_name | text | NOT NULL | |
| date_of_birth | date | NULL | |
| nationality | text | NULL | |
| position | text | NULL | |
| shirt_number | integer | NULL | |
| height | numeric(5,2) | NULL | |
| weight | numeric(5,2) | NULL | |
| preferred_foot | text | NULL | LEFT, RIGHT, BOTH |
| photo_url | text | NULL | |
| biography | text | NULL | |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| deleted_at | timestamptz | NULL | soft delete |

### 5.2 athlete_team_history
Purpose: tracks each athlete's team membership over time for career history, transfers, scouting, and analytics.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| athlete_id | uuid | FK -> athletes.id, NOT NULL | |
| team_id | uuid | FK -> teams.id, NOT NULL | |
| start_date | date | NULL | |
| end_date | date | NULL | |
| is_current | boolean | DEFAULT false | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### 5.3 athlete_visibility
Purpose: controls what the club exposes publicly.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| athlete_id | uuid | FK -> athletes.id, UNIQUE | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| is_public | boolean | DEFAULT false | overall visibility |
| show_age | boolean | DEFAULT false | |
| show_height | boolean | DEFAULT false | |
| show_weight | boolean | DEFAULT false | |
| show_nationality | boolean | DEFAULT false | |
| show_statistics | boolean | DEFAULT false | |
| show_photo | boolean | DEFAULT false | |
| show_biography | boolean | DEFAULT false | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 5.4 athlete_statistics
Purpose: separate stats from core athlete profile.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| athlete_id | uuid | FK -> athletes.id, NOT NULL | |
| season_id | uuid | FK -> seasons.id, NULL | |
| appearances | integer | DEFAULT 0 | |
| minutes | integer | DEFAULT 0 | |
| goals | integer | DEFAULT 0 | |
| assists | integer | DEFAULT 0 | |
| rating | numeric(4,2) | NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 5.5 matches
Purpose: core match event record.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| competition_id | uuid | FK -> competitions.id, NULL | |
| season_id | uuid | FK -> seasons.id, NULL | |
| home_team_id | uuid | FK -> teams.id, NOT NULL | |
| away_team_id | uuid | FK -> teams.id, NOT NULL | |
| venue | text | NULL | |
| match_date | timestamptz | NOT NULL | |
| status | text | NOT NULL | UPCOMING, LIVE, FINISHED, POSTPONED |
| home_score | integer | NULL | |
| away_score | integer | NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 5.6 event_types
Purpose: scalable taxonomy of match events.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| sport_id | uuid | FK -> sports.id, NOT NULL | |
| name | text | NOT NULL | e.g. GOAL, ASSIST, CARD, SUBSTITUTION, INJURY |
| code | text | UNIQUE, NOT NULL | |
| category | text | NULL | e.g. GOAL, CARD, TACTICAL |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### 5.7 match_events
Purpose: match updates and events.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| match_id | uuid | FK -> matches.id, NOT NULL | |
| athlete_id | uuid | FK -> athletes.id, NULL | |
| event_type_id | uuid | FK -> event_types.id, NOT NULL | |
| minute | integer | NULL | |
| description | text | NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

## 6. Content publishing workflow

### 6.1 website_pages
Purpose: public club pages and content sections.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| team_id | uuid | FK -> teams.id, NULL | optional team-specific page |
| slug | text | NOT NULL | |
| section_key | text | NOT NULL | about, squad, fixtures, results, news, sponsors, history |
| title | text | NULL | |
| body | text | NULL | |
| status | text | NOT NULL | DRAFT, REVIEW, PUBLISHED, ARCHIVED |
| visibility | text | NOT NULL | PUBLIC, PRIVATE, MEMBERS_ONLY |
| published_version_id | uuid | NULL | current published version |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |
| published_at | timestamptz | NULL | |

### 6.2 website_page_versions
Purpose: revision history and publish workflow support.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| website_page_id | uuid | FK -> website_pages.id, NOT NULL | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| version_number | integer | NOT NULL | |
| title | text | NULL | |
| body | text | NULL | |
| status | text | NOT NULL | DRAFT, REVIEW, PUBLISHED |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| published_at | timestamptz | NULL | |

### 6.3 news_items
Purpose: news articles for public pages.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| team_id | uuid | FK -> teams.id, NULL | |
| title | text | NOT NULL | |
| summary | text | NULL | |
| body | text | NULL | |
| image_url | text | NULL | |
| status | text | NOT NULL | DRAFT, REVIEW, PUBLISHED, ARCHIVED |
| visibility | text | NOT NULL | PUBLIC, PRIVATE |
| published_at | timestamptz | NULL | |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 6.4 club_page_sections
Purpose: configurable sections shown on a club's public landing page.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| section_type | text | NOT NULL | history, squad, sponsors, news, stadium |
| enabled | boolean | DEFAULT true | |
| display_order | integer | NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

## 7. Subscription and feature access

### 7.1 subscription_plans
Purpose: platform subscription tiers.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | NOT NULL | e.g. STARTER, PROFESSIONAL, ENTERPRISE |
| code | text | UNIQUE, NOT NULL | |
| description | text | NULL | |
| max_organizations | integer | NULL | |
| max_teams | integer | NULL | |
| max_users | integer | NULL | |
| analytics_widget_limit | integer | NULL | |
| content_publish_limit | integer | NULL | |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

### 7.2 organization_subscriptions
Purpose: active subscription per organization.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, UNIQUE | |
| plan_id | uuid | FK -> subscription_plans.id, NOT NULL | |
| status | text | NOT NULL | ACTIVE, PENDING, EXPIRED, CANCELLED |
| started_at | timestamptz | NOT NULL DEFAULT now() | |
| ends_at | timestamptz | NULL | |
| auto_renew | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 7.3 feature_entitlements
Purpose: feature access for an organization.

| Column | Type | Constraints | Notes |
|---|---|---|---| 
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| feature_key | text | NOT NULL | e.g. analytics.widgets, website.publishing |
| enabled | boolean | DEFAULT true | |
| limit_value | integer | NULL | numeric limit |
| expires_at | timestamptz | NULL | |
| granted_by | uuid | FK -> profiles.id, NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

## 8. Analytics and dashboards

### 8.1 analytics_definitions
Purpose: reusable analytics definitions that describe a chart's data source and configuration.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | NOT NULL | |
| definition | jsonb | NOT NULL | query definition or data-source config |
| allowed_roles | jsonb | NULL | roles that may use the definition |
| sport_id | uuid | FK -> sports.id, NOT NULL | |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| status | text | NOT NULL | DRAFT, PUBLISHED |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 8.2 analytics_widgets
Purpose: reusable analytics widgets defined by platform admins.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NULL | null for platform-wide widgets |
| analytics_definition_id | uuid | FK -> analytics_definitions.id, NOT NULL | |
| name | text | NOT NULL | |
| category | text | NOT NULL | PERFORMANCE, PLAYER, FORM |
| widget_type | text | NOT NULL | line_chart, bar_chart, table |
| status | text | NOT NULL | DRAFT, PUBLISHED |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 8.3 dashboards
Purpose: dashboards created by clubs and assigned to roles.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NOT NULL | |
| team_id | uuid | FK -> teams.id, NULL | |
| name | text | NOT NULL | |
| role_scope | text | NULL | COACH, ANALYST, CLUB_ADMIN |
| created_by | uuid | FK -> profiles.id, NOT NULL | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

### 8.4 dashboard_widgets
Purpose: layout mapping of widgets to dashboards.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| dashboard_id | uuid | FK -> dashboards.id, NOT NULL | |
| widget_id | uuid | FK -> analytics_widgets.id, NOT NULL | |
| position | integer | NOT NULL | order |
| size | text | NOT NULL | SMALL, MEDIUM, LARGE |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

## 9. Audit and governance

### 9.1 audit_logs
Purpose: immutable-style audit trail for sensitive actions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | FK -> organizations.id, NULL | nullable for platform-wide events |
| actor_profile_id | uuid | FK -> profiles.id, NULL | |
| action | text | NOT NULL | CREATE, UPDATE, DELETE, PUBLISH, LOGIN, ASSIGN_ROLE |
| entity_type | text | NOT NULL | organizations, players, matches, website_pages, subscriptions |
| entity_id | uuid | NULL | |
| metadata | jsonb | NULL | before/after values or event payload |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| ip_address | text | NULL | |
| session_id | text | NULL | |

## 10. Recommended constraints and indexes
- Every tenant-owned table should have organization_id and an index on organization_id.
- Primary tenant-scoped lookup indexes should include status, visibility, and published state where relevant.
- Unique constraints should prevent duplicate role assignment and duplicate public content slugs within the same organization.
- Audit logs should be append-only and should not be updated by application users.

## 11. Relationship summary
- organizations -> teams, competitions, athletes, website_pages, subscriptions, branding, audit_logs
- teams -> athletes via team history, matches, dashboards, news_items, competition_participants
- competitions -> competition_participants, seasons, matches
- seasons -> athlete_statistics, matches
- athletes -> athlete_team_history, athlete_visibility, athlete_statistics, match_events
- profiles -> organization_memberships, audit_logs, created content
- roles -> role_permissions, organization_memberships
- permissions -> role_permissions
- organization_subscriptions -> subscription_plans
- feature_entitlements -> organizations
- website_pages -> website_page_versions
- dashboards -> dashboard_widgets -> analytics_widgets
- analytics_definitions -> analytics_widgets
- club_page_sections -> organizations
