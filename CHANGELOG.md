# Changelog

## 2026-08-06 — Tenant-testing readiness

### Added
- Tenant-testing cleanup runbook with a dependency map, preflight count query, and explicit transactional removal procedure for Matebele FC and Township Rollers.
- Documented admin-only Supabase password-recovery procedure for the Super Admin account.
- Tenant-test acceptance checklist: create a fresh organisation, create a `CLUB_ADMIN`, sign in through the club slug, and verify tenant isolation.

### Changed
- README, project status, and next steps now prohibit automatic sample tenant creation and direct operators to the approved cleanup runbook.
- Legacy Super Admin bootstrap credentials are explicitly treated as compromised and must be rotated before testing.

## 2026-08-05 — Sprint 1 completion

### Added
- Platform admin subscription workspace for assigning plans and configuring feature entitlements.
- Read-only platform audit log page with actor, organization, entity, and metadata context.
- Migration `0020` hardens `log_action` and adds automatic append-only audit triggers for core platform and tenant mutations.
- Missing Supabase configuration now renders the actionable `/setup` page instead of a generic server exception.

### Changed
- Sprint 1 status and demo checklist now include subscriptions, entitlements, and audit verification.

## 2026-08-03 — Sprint 1 (core)

### Added
- **DB migrations 0001–0017**: full schema per `database-schema-spec.md` — sports, organizations,
  branding, teams, roles, permissions, role_permissions, profiles (+auth trigger), memberships,
  competitions, participants, seasons, athletes (+team history/visibility/statistics), matches,
  event types, match events, website pages/versions, news, club sections, subscription plans,
  org subscriptions, feature entitlements, analytics definitions/widgets, dashboards, audit logs.
  RLS on every table. App RPCs (`create_staff_user`, `get_my_access`, `log_action`).
  Seeds: roles/permissions, platform owner, demo league (3 clubs).
- **Migration 0018**: public read of athlete visibility flags for published athletes.
- **Design system**: UI primitives, tokens, public + portal shells (visual.md).
- **Auth**: email/password login, session gate, role-aware navigation, server-side permission checks.
- **Sprint 1 demo flow**: platform admin (sports/organizations/users), squad manager
  (teams/athletes/publish), public club pages with player cards, fixtures, results, news.

### Changed
- `@supabase/ssr` 0.5.2 → 0.12.4 (fixes broken generic type inference).
- Inter font self-hosted via `@fontsource/inter` (replaces `next/font/google`).
- Public routes moved into `(public)` route group with shared shell.
- `src/types/database.ts` fully rewritten with Relationships metadata (typed joins).

### Fixed
- `500 MIDDLEWARE_INVOCATION_FAILED` when Supabase env vars are unset.
- `.next` directory committed to git — removed; `.gitignore` added.
