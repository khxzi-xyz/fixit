-- =============================================================================
-- Row-Level Security — baseline policies.
-- The backend uses the service_role key (bypasses RLS) for trusted operations,
-- but RLS is enabled as defense-in-depth so the anon/authenticated keys can
-- never leak cross-tenant data (e.g. the category-isolation rule, PRD §2.A.2).
--
-- NOTE: these assume Supabase Auth sets auth.uid() = users.user_id. Adjust the
-- predicates to your auth model before relying on them.
-- =============================================================================

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids             ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_ledgers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs    ENABLE ROW LEVEL SECURITY;

-- Users can read/update only their own identity row.
CREATE POLICY users_self_select ON users
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_self_update ON users
  FOR UPDATE USING (auth.uid() = user_id);

-- A consumer sees only their own jobs; OPEN jobs are exposed to vendors via a
-- backend-controlled, category-filtered query (service_role), never anon SELECT.
CREATE POLICY jobs_owner_select ON jobs
  FOR SELECT USING (auth.uid() = consumer_id);

-- A vendor sees only their own bids; a consumer sees bids on their own jobs.
CREATE POLICY bids_vendor_select ON bids
  FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY bids_consumer_select ON bids
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs j WHERE j.job_id = bids.job_id AND j.consumer_id = auth.uid())
  );

-- Escrow + audit logs: no direct client access. Backend (service_role) only.
-- (No permissive policies => default-deny for anon/authenticated roles.)
