-- ============================================================
-- IP Sports OS — 0017: reference catalogue bootstrap
-- ============================================================
-- Historical note: this migration previously created a Botswana league and
-- three demonstration clubs. Real tenant testing must never create tenants
-- implicitly, so it now seeds only shared reference data. Organisations,
-- teams, athletes, memberships and tenant content are created explicitly by
-- a Super Admin through the application.
--
-- Existing projects that ran the former migration retain their records until
-- they are removed through docs/tenant-testing-cleanup.md. Do not re-run an
-- old copy of this migration to restore demo organisations.

do $$
begin
  insert into public.sports (name, code, is_active)
  values ('Football', 'FOOTBALL', true)
  on conflict (code) do update set name = excluded.name, is_active = true;

  insert into public.subscription_plans
    (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values
    ('Starter', 'STARTER', 'For clubs getting started', 1, 3, 10, 5, 20, true),
    ('Professional', 'PROFESSIONAL', 'For growing clubs', 3, 10, 50, 25, 200, true),
    ('Enterprise', 'ENTERPRISE', 'For leagues and large organisations', null, null, null, null, null, true)
  on conflict (code) do nothing;
end $$;
