-- ============================================================
-- IP Sports OS — 0018: public read of athlete visibility flags
-- ============================================================
-- The public club page must honour the club's per-field visibility
-- flags (show_age, show_nationality, …). Expose those flags only for
-- athletes the club has already published (is_public = true), so a
-- club's unpublished athletes never leak.

create policy "athlete_visibility_public_read" on public.athlete_visibility
  for select
  to anon, authenticated
  using (public.is_athlete_public(athlete_id));
