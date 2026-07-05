-- =============================================================================
-- Supabase role grants. Tables created via a direct Postgres connection (e.g.
-- scripts/migrate.mjs) are NOT auto-granted to the PostgREST roles, so the
-- backend's service_role key hits "permission denied for table ...".
--
-- service_role:   full access (backend only; bypasses RLS).
-- anon/authenticated: usage + table privileges, still gated by RLS policies
--                 (see 0002_rls.sql). RLS is the real guard, not GRANTs.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Backend (service_role) -full access to current + future tables/sequences.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Client roles -privileges granted, but RLS policies decide row visibility.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Future tables get the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
