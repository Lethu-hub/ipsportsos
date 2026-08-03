# IP Sports OS

The digital operating system for sports organisations — clubs operate, fans connect, athletes are represented, and data drives better decisions.

**Beta:** One Sport, One League, Three Clubs (Botswana Premier League: Matebele FC, Township Rollers, Gaborone United).

## Stack

- **Next.js 14 (App Router)** + React 18 + TypeScript (strict)
- **Tailwind CSS** + shadcn-style components (CVA), design tokens from `visual.md`
- **Supabase** (PostgreSQL, Auth, RLS) — schema in `supabase/migrations/`
- **Deployed on Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local   # or create .env.local (see below)
npm run dev
```

Required environment variables (public-by-design, safe in the browser bundle):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_... or anon key>
```

## Database migrations

Migrations live in `supabase/migrations/` (numbered, RLS enabled on every table).
Apply them to your Supabase project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

or run each file in order in the dashboard SQL editor.

Seeds (idempotent):

- `0015` — default roles (PLATFORM_OWNER, SUPER_ADMIN, CLUB_ADMIN, COACH, ANALYST, MEDIA, MEDICAL, SCOUT, PLAYER) + permission catalogue + role→permission mapping
- `0016` — platform owner (`owner@ipsportsos.app`) — **password is random**; reset it via Supabase → Authentication → Users → Reset password
- `0017` — demo platform: Football, Botswana Premier League, 2026 Season, three clubs with branding, subscription plans, club sections

## Sprint 1 (current)

- Public shell + portal shell (role-aware sidebar)
- Email/password auth; server-side role & permission checks
- Platform admin: sports, organizations, users & roles
- Squad manager: teams, athletes, visibility/publishing
- Public club pages with roster, fixtures, news

See `PROJECT_STATUS.md`, `CHANGELOG.md`, `NEXT-STEPS.md`.
