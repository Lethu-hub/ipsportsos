# IP Sports OS

The digital operating system for sports organisations — clubs operate, fans connect, athletes are represented, and data drives better decisions.

**Tenant-testing status:** the platform is ready for real tenant testing. It does **not** create sample organisations automatically. Use the Admin portal to create each tenant deliberately.

## Stack

- **Next.js 14 (App Router)** + React 18 + TypeScript (strict)
- **Tailwind CSS** + shadcn-style components (CVA), design tokens from `visual.md`
- **Supabase** (PostgreSQL, Auth, RLS) — schema in `supabase/migrations/`
- **ECharts** for club analytics widgets
- **Deployed on Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required public environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-or-anon-key>
```

Add both to Vercel’s Production and Preview environments, then redeploy. Missing configuration displays `/setup` rather than querying Supabase.

## Database migrations

Migrations live in `supabase/migrations/` and enable RLS for all tenant data. Apply them in order:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### Important seed and credential notes

- `0015` seeds platform roles and permissions.
- `0016` and `0019` are historical bootstrap migrations. `0019` contains a legacy known Super Admin password and must **never** be re-run manually in a live environment. Rotate/reset that account before testing.
- Demo organisations are not part of the tenant-testing workflow. Do not run demo-seed SQL to create clubs.
- The approved safe removal process for the existing Matebele FC and Township Rollers demo tenants is in [`docs/tenant-testing-cleanup.md`](docs/tenant-testing-cleanup.md). It starts with a dependency inspection, uses an explicit transaction, preserves user accounts/shared records, and is not automatic.

## Tenant-test workflow

1. Reset the Super Admin through **Supabase Dashboard → Authentication → Users → Send password recovery**. Follow the admin-only procedure in the cleanup runbook; never put credentials in source or SQL.
2. Sign in at `/admin`, create a new organisation, and configure its plan/entitlements.
3. Create a user in **Admin → Users & Roles**, assign the organisation and `CLUB_ADMIN` role.
4. Sign out, open `/<organisation-slug>`, and sign in as the club administrator to test the tenant independently.
5. Verify club-scoped squad, match centre, website draft/review/publish, settings, analytics, and audit activity.

## Current product areas

- Super Admin: organizations, subscriptions, users/roles, analytics studio, platform statistics, and audit viewer
- Club portal: dashboard, squad management, match management, website workflow, settings, and role-scoped analytics
- Public: club directory, club pages, fixtures, results, and news

See [PROJECT_STATUS.md](PROJECT_STATUS.md), [NEXT-STEPS.md](NEXT-STEPS.md), [CHANGELOG.md](CHANGELOG.md), and the [tenant-testing cleanup runbook](docs/tenant-testing-cleanup.md).
