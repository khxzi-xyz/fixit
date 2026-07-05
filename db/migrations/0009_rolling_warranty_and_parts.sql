-- 0009: Rolling Warranty Payout + In-App Parts Funding + Voucher Economy
-- Resolves master_specs_URGENTLY_ADD.MD Loophole 1, 2, 4.
-- Decision: full 100% lock vs instant milestones were contradictory promises.
-- This migration is the single real schedule: 60% on verify, 10% at warranty
-- halfway, 10% + platform 20% at warranty clearance. No code path may release
-- funds outside this table.

-- 1. Warranty terms, negotiated per job -----------------------------------
CREATE TABLE IF NOT EXISTS warranty_terms (
  warranty_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL REFERENCES jobs(job_id) UNIQUE,
  proposed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  proposed_days       INTEGER NOT NULL CHECK (proposed_days >= 0),
  countered_days       INTEGER CHECK (countered_days >= 0),
  agreed_days          INTEGER CHECK (agreed_days >= 0),
  status               VARCHAR(20) NOT NULL DEFAULT 'PROPOSED'
                         CHECK (status IN ('PROPOSED','COUNTERED','AGREED')),
  starts_at            TIMESTAMPTZ,
  halfway_at           TIMESTAMPTZ,
  ends_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warranty_job ON warranty_terms (job_id);

-- 2. Rolling payout schedule per closed job -------------------------------
-- One row per job, replacing the old "80%/20% at clearance only" mental model.
CREATE TABLE IF NOT EXISTS warranty_payout_schedules (
  schedule_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                 UUID NOT NULL REFERENCES jobs(job_id) UNIQUE,
  bid_id                 UUID NOT NULL REFERENCES bids(bid_id),
  vendor_id              UUID NOT NULL REFERENCES users(user_id),
  total_amount           NUMERIC(10,3) NOT NULL,
  platform_cut_amount    NUMERIC(10,3) NOT NULL,
  vendor_immediate_amount NUMERIC(10,3) NOT NULL,
  vendor_halfway_amount   NUMERIC(10,3) NOT NULL,
  vendor_final_amount     NUMERIC(10,3) NOT NULL,
  immediate_released_at  TIMESTAMPTZ,
  halfway_released_at    TIMESTAMPTZ,
  final_released_at      TIMESTAMPTZ,
  forfeited_at           TIMESTAMPTZ,
  forfeit_reason         TEXT,
  status                 VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE','CLEARED','FORFEITED')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_sched_vendor ON warranty_payout_schedules (vendor_id, status);

-- Helper: compute the 60/10/10/20 split for a given total (NUMERIC(10,3))
CREATE OR REPLACE FUNCTION fn_rolling_split(p_total NUMERIC)
RETURNS TABLE(platform_cut NUMERIC, vendor_immediate NUMERIC, vendor_halfway NUMERIC, vendor_final NUMERIC) AS $$
BEGIN
  RETURN QUERY SELECT
    ROUND(p_total * 0.20, 3),
    ROUND(p_total * 0.60, 3),
    ROUND(p_total * 0.10, 3),
    p_total - ROUND(p_total * 0.20, 3) - ROUND(p_total * 0.60, 3) - ROUND(p_total * 0.10, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Strike system for ghosted warranty claims ----------------------------
CREATE TABLE IF NOT EXISTS vendor_strikes (
  strike_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    UUID NOT NULL REFERENCES users(user_id),
  job_id       UUID REFERENCES jobs(job_id),
  reason       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_strikes_vendor ON vendor_strikes (vendor_id, created_at DESC);

-- 4. In-App Parts Funding (replaces Multi-Receipt Log + Escort Mode) ------
CREATE TABLE IF NOT EXISTS parts_funding_requests (
  request_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(job_id),
  vendor_id        UUID NOT NULL REFERENCES users(user_id),
  description      TEXT NOT NULL,
  amount           NUMERIC(10,3) NOT NULL CHECK (amount > 0),
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','APPROVED','DECLINED','INSTALLED')),
  installed_photo_url TEXT,
  installed_serial    TEXT,
  approved_at      TIMESTAMPTZ,
  declined_at      TIMESTAMPTZ,
  installed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parts_job ON parts_funding_requests (job_id, status);

-- 5. Voucher economy (Module 21) ------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  voucher_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(20) NOT NULL UNIQUE,
  kind           VARCHAR(20) NOT NULL CHECK (kind IN ('WALLET_CREDIT','PLAN_UNLOCK','FEE_DISCOUNT')),
  amount         NUMERIC(10,3),
  plan_code      VARCHAR(20),
  plan_days      INTEGER,
  fee_discount_pct NUMERIC(5,2),
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  created_by_admin_id UUID REFERENCES users(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  redemption_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id     UUID NOT NULL REFERENCES vouchers(voucher_id),
  user_id        UUID NOT NULL REFERENCES users(user_id),
  redeemed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voucher_id, user_id)
);

-- 6. Dynamic fee-drop scale: helper to compute FixIt Now's cut by job size ----
CREATE OR REPLACE FUNCTION fn_platform_fee_pct(p_amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF p_amount < 15 THEN RETURN 0.20;
  ELSIF p_amount <= 50 THEN RETURN 0.12;
  ELSE RETURN 0.08;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Realtime publication for new tables -------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'warranty_payout_schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE warranty_payout_schedules;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'parts_funding_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE parts_funding_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'warranty_terms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE warranty_terms;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON warranty_terms, warranty_payout_schedules,
  vendor_strikes, parts_funding_requests, vouchers, voucher_redemptions
  TO authenticated;
