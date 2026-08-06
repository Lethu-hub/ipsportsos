# Next Steps

## Immediate (to go live)

1. **Merge the current Sprint 1 branch/PR** into `main` so Vercel deploys the completed platform build.
2. **Apply all migrations** to Supabase project `ccqruhgsoxcilekpayhr`:
   ```bash
   npx supabase link --project-ref ccqruhgsoxcilekpayhr
   npx supabase db push
   ```
   (or paste each file in `supabase/migrations/` into the dashboard SQL editor, in order)
3. **Set Vercel env vars** (Project → Settings → Environment Variables) for both **Production** and **Preview**, then redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL=https://ccqruhgsoxcilekpayhr.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kwlL4zUWmDFm0GH9XeR8fw_zYeF2Rc6`

   If either variable is missing, the app now shows `/setup` with these instructions instead of the generic Vercel server error.
4. **Admin Sign-in Credentials** — Log in using username or email:
   - **Username:** `mpofu9898`
   - **Email:** `mpofu9898@gmail.com`
   - **Password:** `Test123!`

## Platform Administration flow

1. Log in with username `mpofu9898` and password `Test123!` at `/admin` (or `/login`).
2. Go to **Organizations** (`/admin/organizations`) to create clubs, leagues, or academies.
3. Go to **Subscriptions & access** (`/admin/subscriptions`) to assign plans and configure entitlements for clubs.
4. Go to **Users & Roles** (`/admin/users`) to create software users (with email, username, role, and club assignment).
4. Sign in as the staff user → Squad → create a team, add athletes, toggle **Publish**.
5. Open the public club page (`/clubs/<club-slug>`) and see the roster with player cards.
6. Return to **Audit log** and verify the organization, membership, team, and athlete changes.

## Sprint 2 (next)

- Match management (create fixtures, enter results, match events)
- Website manager (draft → review → publish pages/news, versions)
- Analytics engine (definitions → widgets → dashboards; ECharts)
- Organization settings UI (branding colours, subscription display)
- Player cards: statistics + photos (Supabase Storage buckets: logos, player-images, team-banners, news-images)

## Housekeeping

- Rotate the Supabase **database password** (it was shared in chat).
- Consider enabling email confirmation policies before opening auth to the public.
