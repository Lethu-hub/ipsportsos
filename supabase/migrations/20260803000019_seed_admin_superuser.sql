-- ============================================================
-- IP Sports OS — 0019: legacy Super Admin bootstrap retired
-- ============================================================
-- This migration formerly created a named Super Admin with a source-controlled
-- password. That is not acceptable for tenant testing or production. It is
-- intentionally a no-op for new environments.
--
-- Create the first administrator in Supabase Auth using a verified mailbox,
-- then provision the matching profile and platform-scoped membership according
-- to the admin-only procedure in docs/tenant-testing-cleanup.md. Existing
-- environments must reset the legacy account through Supabase Authentication
-- → Users → Send password recovery before tenant testing.

do $$
begin
  raise notice 'Legacy Super Admin seed retired; no administrator was created.';
end $$;
