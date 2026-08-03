# Next Steps

## Immediate (to go live)

1. **Merge PR #1** (`arena/019fc990-ipsportsos` → `main`) so Vercel deploys the fixes + Sprint 1 build.
2. **Apply migrations** to Supabase project `ccqruhgsoxcilekpayhr`:
   ```bash
   npx supabase link --project-ref ccqruhgsoxcilekpayhr
   npx supabase db push
   ```
   (or paste each file in `supabase/migrations/` into the dashboard SQL editor, in order)
3. **Set Vercel env vars** (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL=https://ccqruhgsoxcilekpayhr.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kwlL4zUWmDFm0GH9XeR8fw_zYeF2Rc6`
4. **Reset platform owner password** — Supabase → Authentication → Users → `owner@ipsportsos.app` → Reset password.

## Sprint 1 demo script

1. Log in as `owner@ipsportsos.app` → Platform Admin → create a sport/league/club (seeded data already exists).
2. Create a staff user (e.g. coach@club.com, role COACH, org = a club) — password chosen at creation.
3. Sign in as the staff user → Squad → create a team, add athletes, toggle **Publish**.
4. Open the public club page (`/clubs/<club-slug>`) and see the roster with player cards.

## Sprint 2 (next)

- Match management (create fixtures, enter results, match events)
- Website manager (draft → review → publish pages/news, versions)
- Analytics engine (definitions → widgets → dashboards; ECharts)
- Organization settings UI (branding colours, subscription display)
- Player cards: statistics + photos (Supabase Storage buckets: logos, player-images, team-banners, news-images)

## Housekeeping

- Rotate the Supabase **database password** (it was shared in chat).
- Consider enabling email confirmation policies before opening auth to the public.
