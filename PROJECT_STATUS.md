# Project Status

_Updated: 2026-08-03_

## Sprint 1 — complete

### ✅ Done

**Database (Prompt 2)**
- 20 migrations in `supabase/migrations/` in dependency order:
  sports → organizations (+branding) → teams → roles/permissions → profiles → memberships → competitions/seasons → athletes (+history/visibility/statistics) → matches/events → website system → subscriptions → analytics → audit logs
- RLS enabled on every table with tenant-scoped policies (helper functions:
  `current_profile_id`, `is_platform_admin`, `is_org_member`, `has_permission`, `can`, `is_athlete_public`)
- App RPC functions: `create_staff_user` (secure user creation without service-role keys), `get_my_access`, `log_action`
- Seeds: roles + permissions + role→permission mapping; platform owner; demo league + 3 clubs
- All migrations verified against PostgreSQL's real parser (libpg_query 17.7.4)

**Auth + roles + design system (Prompt 3)**
- Email/password login (`/login`) with Supabase Auth; middleware env-guard (no more 500s)
- Server-side access helpers (`lib/auth.ts`): `requireUser`, `requirePlatformAdmin`, `hasPermission`, `getSessionUser`
- Role-aware portal shell (sidebar shows Platform Admin section only to platform roles)
- Design system from `visual.md`: tokens (colors/radius/shadows/motion), UI primitives
  (Button, Card, Input, Select, Badge, Avatar, Skeleton, Switch, Table, EmptyState, PageHeader, StatCard…),
  public shell (responsive nav) + portal shell (collapsible sidebar)
- Self-hosted Inter font (no build-time Google Fonts fetch — faster, reliable builds)

**Sprint 1 demo flow (Prompt 4)**
- Platform admin: create sports, organizations (clubs/leagues), staff users (with roles)
- Platform admin: assign subscription plans, configure feature entitlements, and review the audit log
- Squad manager: create teams, add athletes, publish athletes via visibility toggles
- Public: home (featured clubs/fixtures), club directory, club page (branding banner, teams,
  squad roster with player cards, fixtures & results, news), fixtures, results, news pages
- Automatic append-only audit events for core platform and tenant mutations
- Seeded league: Botswana Premier League — Matebele FC, Township Rollers, Gaborone United

### 🔧 Reliability and governance shipped

- `500 MIDDLEWARE_INVOCATION_FAILED` — middleware no longer crashes when Supabase env vars are missing
- Missing or invalid Supabase configuration now renders an actionable `/setup` page instead of a generic Vercel 500
- `.next` build artifacts removed from git; `.gitignore` added
- Audit writes are restricted to authenticated users and automatic audit triggers cover core mutations

## Operational prerequisites

These are deployment tasks rather than code blockers:

- **Apply all migrations to the live Supabase project** (`npx supabase link` + `db push`, or SQL editor)
- **Set env vars in Vercel** for Production and Preview (see README), then redeploy
- **Default admin login** (`mpofu9898@gmail.com` / `mpofu9898`, password: `Test123!`) created via migration `0021`
- **Username or email sign-in** enabled across Admin Portal, Staff Portal, and Club login forms
- Demo platform teams and users cleaned up for a fresh system state

## Next

Sprint 2 can start with match management, website publishing, and analytics widgets. The Sprint 1 platform foundation and acceptance flow are complete.
