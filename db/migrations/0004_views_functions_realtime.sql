-- =============================================================================
-- FixIt Marketplace — views, functions, triggers, and Realtime publication.
-- Implements: ledger immutability guard, refund math (§1.C.2), rating
-- recompute, current-escrow-state view, and the KPI views (§3.C.2).
-- =============================================================================

-- --- Enforce append-only ledger (PRD §1.C.1 / §3.A.2) ------------------------
CREATE OR REPLACE FUNCTION block_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'escrow_ledgers is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_no_update ON escrow_ledgers;
CREATE TRIGGER trg_ledger_no_update BEFORE UPDATE OR DELETE ON escrow_ledgers
  FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

-- --- Current escrow state per (job, milestone) = latest row ------------------
CREATE OR REPLACE VIEW v_escrow_current AS
SELECT DISTINCT ON (job_id, milestone_index)
  job_id, milestone_index, bid_id, state, amount,
  platform_cut_amount, vendor_payout_amount, external_payment_ref, created_at
FROM escrow_ledgers
ORDER BY job_id, milestone_index, created_at DESC;

-- --- Refund math (PRD §1.C.2), money in minor units (integer baisa/cents) ----
-- Returns (consumer_refund, platform_cut, vendor_payout). System-calculated,
-- never operator math. Mirrors apps/backend/.../refund-math.ts exactly.
CREATE OR REPLACE FUNCTION compute_refund(
  p_total_minor   BIGINT,
  p_commission_rate NUMERIC,   -- 0..1
  p_refund_fraction NUMERIC,   -- 0..1
  p_method        TEXT         -- 'METHOD_1' | 'METHOD_2'
) RETURNS TABLE (consumer_refund BIGINT, platform_cut BIGINT, vendor_payout BIGINT) AS $$
DECLARE
  v_refund    BIGINT;
  v_remainder BIGINT;
  v_cut       BIGINT;
BEGIN
  IF p_total_minor < 0 THEN RAISE EXCEPTION 'total must be >= 0'; END IF;
  IF p_commission_rate < 0 OR p_commission_rate > 1 THEN RAISE EXCEPTION 'commission out of range'; END IF;
  IF p_refund_fraction < 0 OR p_refund_fraction > 1 THEN RAISE EXCEPTION 'refund out of range'; END IF;

  v_refund    := round(p_total_minor * p_refund_fraction);
  v_remainder := p_total_minor - v_refund;

  IF p_method = 'METHOD_1' THEN
    v_cut := least(round(p_total_minor * p_commission_rate), v_remainder);
  ELSIF p_method = 'METHOD_2' THEN
    v_cut := round(v_remainder * p_commission_rate);
  ELSE
    RAISE EXCEPTION 'unknown method %', p_method;
  END IF;

  consumer_refund := v_refund;
  platform_cut    := v_cut;
  vendor_payout   := v_remainder - v_cut;

  IF consumer_refund + platform_cut + vendor_payout <> p_total_minor THEN
    RAISE EXCEPTION 'reconciliation failed';
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- --- Recompute vendor rating_avg + jobs_completed_count on new review --------
CREATE OR REPLACE FUNCTION recompute_vendor_rating() RETURNS trigger AS $$
BEGIN
  UPDATE vendor_profiles vp SET
    rating_avg = sub.avg_rating,
    jobs_completed_count = sub.cnt
  FROM (
    SELECT vendor_id, round(avg(rating)::numeric, 2) AS avg_rating, count(*) AS cnt
    FROM reviews WHERE vendor_id = NEW.vendor_id GROUP BY vendor_id
  ) sub
  WHERE vp.vendor_id = sub.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_rating ON reviews;
CREATE TRIGGER trg_review_rating AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION recompute_vendor_rating();

-- --- Admin triage queue: unified, SLA-sorted (PRD §1.A.3 step 1) -------------
CREATE OR REPLACE VIEW v_admin_triage_queue AS
  SELECT 'MODERATION'::text AS case_type, a.log_id AS case_id,
         a.submitting_user_id AS subject_user_id, a.created_at,
         NULL::timestamptz AS sla_due_at, a.tier2_label AS detail
  FROM ai_audit_logs a
  WHERE a.resolution = 'PENDING_REVIEW'
  UNION ALL
  SELECT 'DISPUTE', d.dispute_id, d.opened_by_user_id, d.created_at,
         d.sla_due_at, d.reason
  FROM disputes d
  WHERE d.status = 'OPEN'
  UNION ALL
  SELECT 'COMPLIANCE', vp.vendor_id, vp.vendor_id, vp.updated_at,
         (vp.insurance_expiry::timestamptz), 'insurance_expiring'
  FROM vendor_profiles vp
  WHERE vp.insurance_expiry IS NOT NULL
    AND vp.insurance_expiry <= (current_date + INTERVAL '30 days');

-- =============================================================================
-- KPI VIEWS (PRD §3.C.2)
-- =============================================================================

-- Platform Liquidity Ratio: jobs with >=1 bid / total jobs (overall + per cat).
CREATE OR REPLACE VIEW v_kpi_liquidity AS
SELECT
  j.category_id,
  count(*) FILTER (WHERE b.cnt > 0)::numeric
    / NULLIF(count(*), 0) AS liquidity_ratio,
  count(*) AS jobs_posted,
  count(*) FILTER (WHERE b.cnt > 0) AS jobs_with_bids
FROM jobs j
LEFT JOIN LATERAL (
  SELECT count(*) AS cnt FROM bids WHERE bids.job_id = j.job_id
) b ON true
GROUP BY ROLLUP (j.category_id);

-- Average Escrow Release Latency: vendor-marked-complete -> RELEASED ledger.
CREATE OR REPLACE VIEW v_kpi_escrow_latency AS
SELECT
  avg(EXTRACT(EPOCH FROM (rel.created_at - m.vendor_marked_at))) AS avg_release_latency_seconds,
  count(*) AS released_milestones
FROM escrow_ledgers rel
JOIN job_milestones m
  ON m.job_id = rel.job_id AND m.milestone_index = rel.milestone_index
WHERE rel.state = 'RELEASED' AND m.vendor_marked_at IS NOT NULL;

-- Vendor Acquisition: verified vendors who completed >=1 job (denominator).
CREATE OR REPLACE VIEW v_kpi_active_vendors AS
SELECT count(DISTINCT vp.vendor_id) AS verified_active_vendors
FROM vendor_profiles vp
WHERE vp.verification_status = 'VERIFIED'
  AND vp.jobs_completed_count >= 1;

-- Disintermediation attempt rate: flagged content over total scanned.
CREATE OR REPLACE VIEW v_kpi_disintermediation AS
SELECT
  count(*) FILTER (WHERE resolution = 'PENDING_REVIEW' OR tier1_match)::numeric
    / NULLIF(count(*), 0) AS attempt_rate,
  count(*) AS total_scanned,
  count(*) FILTER (WHERE tier1_match) AS tier1_hits
FROM ai_audit_logs;

-- =============================================================================
-- REALTIME (Supabase). Publish the tables the Command Center subscribes to.
-- After running this, enable Realtime for these tables in the Supabase UI too
-- (Database → Replication) if not auto-detected.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Idempotent: only add tables not already in the publication.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ai_audit_logs','disputes','escrow_ledgers','notifications','bids','chat_messages']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;

-- Full row images on update/delete so realtime payloads carry old + new.
ALTER TABLE ai_audit_logs REPLICA IDENTITY FULL;
ALTER TABLE disputes      REPLICA IDENTITY FULL;
ALTER TABLE bids          REPLICA IDENTITY FULL;
