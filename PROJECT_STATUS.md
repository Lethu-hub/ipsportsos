# Project Status

_Updated: 2026-08-03_

## Sprint 1 — In progress (core complete)

### ✅ Done

**Database (Prompt 2)**
- 18 migrations in `supabase/migrations/` in dependency order:
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
- Squad manager: create teams, add athletes, publish athletes via visibility toggles
- Public: home (featured clubs/fixtures), club directory, club page (branding banner, teams,
  squad roster with player cards, fixtures & results, news), fixtures, results, news pages
- Seeded league: Botswana Premier League — Matebele FC, Township Rollers, Gaborone United

### 🔧 Fixes shipped earlier

- `500 MIDDLEWARE_INVOCATION_FAILED` — middleware no longer crashes when Supabase env vars are missing
- `.next` build artifacts removed from git; `.gitignore` added

## Blocked / needs action

- **Apply migrations to the live Supabase project** (`npx supabase link` + `db push`, or SQL editor)
- **Set env vars in Vercel** (see README)
- **Reset the platform owner password** (`owner@ipsportsos.app`) via Supabase dashboard

## Next

- Merge PR #1 (middleware fix + .gitignore) into `main` to deploy
- Apply migrations + env vars; run the Sprint 1 demo flow end-to-end
- Sprint 2: match management, website manager (draft→publish), analytics engine
