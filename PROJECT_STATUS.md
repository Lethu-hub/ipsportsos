# Project Status

_Updated: 2026-08-06_

## Tenant-testing readiness — in progress

### ✅ Delivered

**Data model and tenancy**
- 20 Supabase migrations cover organisations/branding, teams, roles/permissions, profiles/memberships, competitions/seasons, athletes, matches, website content, subscriptions, analytics, and append-only audit logging.
- RLS is enabled across tenant tables with organization-scoped helper functions and platform-admin access checks.
- The tenant dependency map and safe cleanup transaction are documented in [`docs/tenant-testing-cleanup.md`](docs/tenant-testing-cleanup.md).
- Cleanup explicitly preserves shared sports, roles, plans, analytics definitions, other tenants, `profiles`, and `auth.users`.

**Club portal (Sprint 3)**
- Club-branded, role-aware navigation and dashboard.
- Squad management for teams and athletes.
- Match centre supports scheduling fixtures and recording results.
- Website manager supports draft → review → publish.
- Settings show organisation, branding, and subscription information.

**Analytics (Sprint 4)**
- ECharts MVP widgets: team performance, player contribution, and form tracker.
- Club analytics access is role/permission-scoped.
- Super Admin analytics studio shows definitions, widget, and dashboard statistics.

**Platform administration (Sprint 5)**
- Organization, subscription/entitlement, user/role, sport, analytics-studio, platform-statistics, and audit-log tooling.
- Staff users can be created from the Admin portal with a tenant-specific role.

### ⚠️ Required before real-tenant testing

1. **Do not delete demo records from the app UI or with `CASCADE`.** First use the inspection query and approved transaction in the [tenant-testing cleanup runbook](docs/tenant-testing-cleanup.md) for `matebele-fc` and `township-rollers`.
2. **Reset/rotate the Super Admin password.** The historical `0019` bootstrap migration includes a known credential and must not be manually re-run. Use the Supabase Dashboard recovery procedure in the runbook.
3. Apply/confirm all migrations and Vercel environment variables against the intended Supabase project.
4. Execute the tenant-test acceptance checklist: create a new organisation, create a `CLUB_ADMIN`, sign in at that organisation’s slug, and verify isolation.

## Non-automatic demo policy

No application feature creates sample organizations. Historical demo seed migrations are not part of the real-tenant test workflow. New tenants must be created explicitly by a Super Admin.
