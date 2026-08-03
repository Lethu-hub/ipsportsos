-- ============================================================
-- IP Sports OS — 0017: seed demo platform
-- ============================================================
-- One sport, one league, three clubs (Sprint 1 demo baseline).
-- Idempotent. Club staff add teams/athletes through the portal;
-- this seed provides the league structure + club identities +
-- subscription baseline so the public site has content.
--
--   Sport:          Football
--   League:         Botswana Premier League
--   Season:         2026 Season
--   Clubs:          Matebele FC, Township Rollers, Gaborone United

do $$
declare
  v_sport_id      uuid;
  v_league_id     uuid;
  v_competition_id uuid;
  v_season_id     uuid;
  v_starter_plan  uuid;
  v_pro_plan      uuid;
  v_club_id       uuid;
begin
  -- ----------------------------------------------------------
  -- Sport
  -- ----------------------------------------------------------
  insert into public.sports (name, code, is_active)
  values ('Football', 'FOOTBALL', true)
  on conflict (code) do update set name = excluded.name, is_active = true
  returning id into v_sport_id;

  -- ----------------------------------------------------------
  -- League organization (governing body for the competition)
  -- ----------------------------------------------------------
  insert into public.organizations (name, slug, organization_type, sport_id, status, subscription_status)
  values ('Botswana Premier League', 'botswana-premier-league', 'LEAGUE', v_sport_id, 'ACTIVE', 'ACTIVE')
  on conflict (slug) do nothing
  returning id into v_league_id;

  -- ----------------------------------------------------------
  -- Competition
  -- ----------------------------------------------------------
  insert into public.competitions (sport_id, owner_organization_id, name, country, slug, status)
  values (v_sport_id, v_league_id, 'Botswana Premier League', 'Botswana', 'botswana-premier-league', 'ACTIVE')
  on conflict (slug) do update set status = 'ACTIVE', name = excluded.name, country = excluded.country, sport_id = v_sport_id
  returning id into v_competition_id;

  -- ----------------------------------------------------------
  -- Season
  -- ----------------------------------------------------------
  insert into public.seasons (organization_id, competition_id, name, start_date, end_date, is_active)
  values (v_league_id, v_competition_id, '2026 Season', '2026-08-01', '2027-05-31', true)
  on conflict do nothing
  returning id into v_season_id;

  -- ----------------------------------------------------------
  -- Subscription plans
  -- ----------------------------------------------------------
  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Starter', 'STARTER', 'For clubs getting started', 1, 3, 10, 5, 20, true)
  on conflict (code) do nothing
  returning id into v_starter_plan;

  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Professional', 'PROFESSIONAL', 'For growing clubs', 3, 10, 50, 25, 200, true)
  on conflict (code) do nothing;

  insert into public.subscription_plans (name, code, description, max_organizations, max_teams, max_users, analytics_widget_limit, content_publish_limit, is_active)
  values ('Enterprise', 'ENTERPRISE', 'For leagues and large organisations', null, null, null, null, null, true)
  on conflict (code) do nothing;

  -- ----------------------------------------------------------
  -- Clubs
  -- ----------------------------------------------------------
  -- Matebele FC (blue / white / gold)
  insert into public.organizations (name, slug, organization_type, sport_id, status, subscription_status)
  values ('Matebele FC', 'matebele-fc', 'CLUB', v_sport_id, 'ACTIVE', 'ACTIVE')
  on conflict (slug) do nothing
  returning id into v_club_id;

  insert into public.organization_branding (organization_id, primary_color, secondary_color, accent_color, font_family)
  values (v_club_id, '#2563eb', '#ffffff', '#eab308', 'Inter')
  on conflict (organization_id) do nothing;

  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_club_id, v_starter_plan, 'ACTIVE')
  on conflict (organization_id) do nothing;

  insert into public.feature_entitlements (organization_id, feature_key, enabled, limit_value)
  values (v_club_id, 'website.publishing', true, 20), (v_club_id, 'analytics.widgets', true, 5)
  on conflict (organization_id, feature_key) do nothing;

  insert into public.club_page_sections (organization_id, section_type, enabled, display_order)
  values (v_club_id, 'history', true, 1), (v_club_id, 'squad', true, 2),
         (v_club_id, 'news', true, 3), (v_club_id, 'sponsors', true, 4), (v_club_id, 'stadium', true, 5)
  on conflict (organization_id, section_type) do nothing;

  -- Township Rollers (green / white / black)
  insert into public.organizations (name, slug, organization_type, sport_id, status, subscription_status)
  values ('Township Rollers', 'township-rollers', 'CLUB', v_sport_id, 'ACTIVE', 'ACTIVE')
  on conflict (slug) do nothing
  returning id into v_club_id;

  insert into public.organization_branding (organization_id, primary_color, secondary_color, accent_color, font_family)
  values (v_club_id, '#16a34a', '#ffffff', '#111827', 'Inter')
  on conflict (organization_id) do nothing;

  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_club_id, v_starter_plan, 'ACTIVE')
  on conflict (organization_id) do nothing;

  insert into public.feature_entitlements (organization_id, feature_key, enabled, limit_value)
  values (v_club_id, 'website.publishing', true, 20), (v_club_id, 'analytics.widgets', true, 5)
  on conflict (organization_id, feature_key) do nothing;

  insert into public.club_page_sections (organization_id, section_type, enabled, display_order)
  values (v_club_id, 'history', true, 1), (v_club_id, 'squad', true, 2),
         (v_club_id, 'news', true, 3), (v_club_id, 'sponsors', true, 4), (v_club_id, 'stadium', true, 5)
  on conflict (organization_id, section_type) do nothing;

  -- Gaborone United (yellow / blue / black)
  insert into public.organizations (name, slug, organization_type, sport_id, status, subscription_status)
  values ('Gaborone United', 'gaborone-united', 'CLUB', v_sport_id, 'ACTIVE', 'ACTIVE')
  on conflict (slug) do nothing
  returning id into v_club_id;

  insert into public.organization_branding (organization_id, primary_color, secondary_color, accent_color, font_family)
  values (v_club_id, '#eab308', '#1d4ed8', '#111827', 'Inter')
  on conflict (organization_id) do nothing;

  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_club_id, v_starter_plan, 'ACTIVE')
  on conflict (organization_id) do nothing;

  insert into public.feature_entitlements (organization_id, feature_key, enabled, limit_value)
  values (v_club_id, 'website.publishing', true, 20), (v_club_id, 'analytics.widgets', true, 5)
  on conflict (organization_id, feature_key) do nothing;

  insert into public.club_page_sections (organization_id, section_type, enabled, display_order)
  values (v_club_id, 'history', true, 1), (v_club_id, 'squad', true, 2),
         (v_club_id, 'news', true, 3), (v_club_id, 'sponsors', true, 4), (v_club_id, 'stadium', true, 5)
  on conflict (organization_id, section_type) do nothing;
end $$;
