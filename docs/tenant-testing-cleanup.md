# Tenant-testing cleanup and access runbook

> **Status:** reviewed on 2026-08-06. This is a manual, deliberate runbook. It does **not** run during deployment and no application code deletes organisations automatically.

## Scope and data model

Tenant data is keyed by `public.organizations.id`:

| Domain | Tables |
| --- | --- |
| Core tenant | `organizations`, `organization_branding`, `organization_memberships` |
| Squad | `teams`, `athletes`, `athlete_team_history`, `athlete_visibility`, `athlete_statistics` |
| Matches | `matches`, `match_events`, `competition_participants` |
| Website | `website_pages`, `website_page_versions`, `news_items`, `club_page_sections` |
| Commercial | `organization_subscriptions`, `feature_entitlements` |
| Analytics | `analytics_widgets`, `dashboards`, `dashboard_widgets` |
| Audit | `audit_logs` |

`profiles` and `auth.users` are deliberately **not tenant-owned**. Deleting a membership must not delete a real person’s authentication account; an administrator can reuse the account for another tenant.

## Preflight — required before deletion

1. Take a Supabase database backup and export the two organisations if any data needs preserving.
2. In the Supabase SQL Editor, run the **inspection query** below. Confirm it returns exactly the intended slugs: `matebele-fc` and `township-rollers`. The current migration seed calls the first club **Matebele FC**; if the live name is “Matebele FC Gaborone”, the slug is still the authority.
3. Review the counts. Do not run cleanup if either slug belongs to a real tenant.
4. Run the transaction below as a project/database administrator in the SQL Editor. It uses explicit child-first deletion because most tenant foreign keys intentionally do not cascade.

```sql
with targets as (
  select id, name, slug from public.organizations
  where slug in ('matebele-fc', 'township-rollers')
)
select t.name, t.slug,
  (select count(*) from public.organization_memberships m where m.organization_id = t.id) as memberships,
  (select count(*) from public.teams x where x.organization_id = t.id) as teams,
  (select count(*) from public.athletes x where x.organization_id = t.id) as athletes,
  (select count(*) from public.matches x where x.organization_id = t.id) as matches,
  (select count(*) from public.website_pages x where x.organization_id = t.id) as pages,
  (select count(*) from public.dashboards x where x.organization_id = t.id) as dashboards;
```

## Approved cleanup transaction

The transaction preserves shared sports, roles, subscription plans, analytics definitions, other organisations, and user accounts. It also removes the target tenants’ audit entries so no foreign-key reference prevents the organisation deletion.

```sql
begin;

-- The normal audit triggers insert a new audit row for each DELETE. Disable
-- user triggers only for this controlled purge, otherwise those new rows keep
-- an FK reference to the tenant being removed. This requires SQL Editor/project
-- owner privileges; a failure here means stop and do not attempt a weaker purge.
alter table public.organizations disable trigger user;
alter table public.organization_memberships disable trigger user;
alter table public.organization_branding disable trigger user;
alter table public.teams disable trigger user;
alter table public.athletes disable trigger user;
alter table public.athlete_team_history disable trigger user;
alter table public.athlete_visibility disable trigger user;
alter table public.athlete_statistics disable trigger user;
alter table public.matches disable trigger user;
alter table public.match_events disable trigger user;
alter table public.website_pages disable trigger user;
alter table public.website_page_versions disable trigger user;
alter table public.news_items disable trigger user;
alter table public.club_page_sections disable trigger user;
alter table public.organization_subscriptions disable trigger user;
alter table public.feature_entitlements disable trigger user;
alter table public.dashboards disable trigger user;
alter table public.analytics_widgets disable trigger user;

create temporary table cleanup_orgs on commit drop as
select id from public.organizations
where slug in ('matebele-fc', 'township-rollers');

-- descendants whose parent is not directly organisation-scoped
-- (cascade exists for some of these; explicit delete makes the runbook auditable)
delete from public.dashboard_widgets dw
using public.dashboards d, cleanup_orgs o
where dw.dashboard_id = d.id and d.organization_id = o.id;
delete from public.dashboard_widgets dw
using public.analytics_widgets w, cleanup_orgs o
where dw.widget_id = w.id and w.organization_id = o.id;
delete from public.website_page_versions v
using cleanup_orgs o where v.organization_id = o.id;
delete from public.match_events e
using cleanup_orgs o where e.organization_id = o.id;
delete from public.athlete_team_history h
using public.teams t, cleanup_orgs o where h.team_id = t.id and t.organization_id = o.id;
delete from public.competition_participants p
using public.teams t, cleanup_orgs o where p.team_id = t.id and t.organization_id = o.id;

-- tenant-owned records
delete from public.dashboards d using cleanup_orgs o where d.organization_id = o.id;
delete from public.analytics_widgets w using cleanup_orgs o where w.organization_id = o.id;
delete from public.website_pages p using cleanup_orgs o where p.organization_id = o.id;
delete from public.news_items n using cleanup_orgs o where n.organization_id = o.id;
delete from public.club_page_sections s using cleanup_orgs o where s.organization_id = o.id;
delete from public.matches m using cleanup_orgs o where m.organization_id = o.id;
delete from public.athlete_statistics s using cleanup_orgs o where s.organization_id = o.id;
delete from public.athlete_visibility v using cleanup_orgs o where v.organization_id = o.id;
delete from public.athletes a using cleanup_orgs o where a.organization_id = o.id;
delete from public.teams t using cleanup_orgs o where t.organization_id = o.id;
delete from public.organization_subscriptions s using cleanup_orgs o where s.organization_id = o.id;
delete from public.feature_entitlements e using cleanup_orgs o where e.organization_id = o.id;
delete from public.organization_branding b using cleanup_orgs o where b.organization_id = o.id;
delete from public.organization_memberships m using cleanup_orgs o where m.organization_id = o.id;
delete from public.audit_logs a using cleanup_orgs o where a.organization_id = o.id;

-- This must be last. It will fail and roll back if an unreviewed dependency exists.
delete from public.organizations x using cleanup_orgs o where x.id = o.id;

-- Must return zero rows before committing.
select name, slug from public.organizations
where slug in ('matebele-fc', 'township-rollers');

alter table public.organizations enable trigger user;
alter table public.organization_memberships enable trigger user;
alter table public.organization_branding enable trigger user;
alter table public.teams enable trigger user;
alter table public.athletes enable trigger user;
alter table public.athlete_team_history enable trigger user;
alter table public.athlete_visibility enable trigger user;
alter table public.athlete_statistics enable trigger user;
alter table public.matches enable trigger user;
alter table public.match_events enable trigger user;
alter table public.website_pages enable trigger user;
alter table public.website_page_versions enable trigger user;
alter table public.news_items enable trigger user;
alter table public.club_page_sections enable trigger user;
alter table public.organization_subscriptions enable trigger user;
alter table public.feature_entitlements enable trigger user;
alter table public.dashboards enable trigger user;
alter table public.analytics_widgets enable trigger user;
commit;
```

If the final `DELETE` fails, issue `rollback;` and inspect the constraint named in the error. Do not use `CASCADE` blindly. Competitions and seasons are intentionally outside this transaction because they can be shared league records; only remove them after separately confirming that no non-target tenant uses them.

## Super Admin custody and password reset

Platform administration is represented by a `public.profiles` row plus an active `public.organization_memberships` row with `organization_id IS NULL` and a `PLATFORM_OWNER` or `SUPER_ADMIN` role. Authentication credentials live in Supabase Auth (`auth.users`), not in the app database.

Migration `20260803000019_seed_admin_superuser.sql` historically seeded `mpofu9898@gmail.com` with a known password. Treat that password as compromised: never re-run that migration in production and reset/rotate it before tenant testing.

**Approved admin-only reset procedure:**

1. Sign in to the Supabase project dashboard using an authorised project owner account.
2. Go to **Authentication → Users**, find the Super Admin by its verified email, then choose **Send password recovery** (or use the user action to generate a recovery link).
3. Deliver the recovery email/link only to the verified administrator. Set a unique password in the recovery screen; do not place it in SQL, source code, issues, or chat.
4. Confirm the account still has an active platform-scoped membership:
   ```sql
   select p.email, r.name as role, m.status
   from public.profiles p
   join public.organization_memberships m on m.profile_id = p.id
   join public.roles r on r.id = m.role_id
   where p.email = '<super-admin-email>' and m.organization_id is null;
   ```
5. Log in at `/admin`, then record the reset in the operational change log/audit process.

## Tenant-test acceptance checklist

1. As Super Admin, open **Admin → Organizations** and create a real test organisation. No sample organisation is created by the app.
2. Open **Admin → Users & Roles** and create a staff user with the new organisation and `CLUB_ADMIN` role. Use a temporary password delivered securely.
3. Sign out, visit `/<new-organisation-slug>`, and log in as that club administrator.
4. Confirm the club dashboard, squad, matches, website, settings, and permitted analytics are isolated to that organisation.
5. As Super Admin, verify the new organisation and user/membership audit events. Then repeat this runbook only for explicitly designated test tenants.
