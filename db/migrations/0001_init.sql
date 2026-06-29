-- =============================================================================
-- FixIt Marketplace — initial schema (PRD §3.A.2)
-- Postgres 16+ with PostGIS. Run against your Supabase project.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- Base identity ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('CONSUMER','VENDOR','ADMIN')),
  email         VARCHAR(160),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active     BOOLEAN NOT NULL DEFAULT true
);

-- Vendor profiles (extends users for role = VENDOR) ---------------------------
CREATE TABLE IF NOT EXISTS vendor_profiles (
  vendor_id           UUID PRIMARY KEY REFERENCES users(user_id),
  category_ids        TEXT[] NOT NULL,                       -- e.g. ['AC','ELECTRICAL']
  service_area_geom   GEOGRAPHY(POLYGON, 4326),
  radius_meters       INTEGER NOT NULL DEFAULT 15000,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (verification_status IN ('PENDING','VERIFIED','SUSPENDED')),
  license_doc_url     TEXT,
  insurance_doc_url   TEXT,
  insurance_expiry    DATE,
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
                        CHECK (subscription_status IN ('TRIAL','ACTIVE','LAPSED')),
  rating_avg          NUMERIC(3,2) DEFAULT 0.00,
  jobs_completed_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vendor_geom ON vendor_profiles USING GIST (service_area_geom);

-- Job cards -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id     UUID NOT NULL REFERENCES users(user_id),
  category_id     VARCHAR(40) NOT NULL,
  sub_issue_tags  TEXT[],
  urgency         VARCHAR(20) NOT NULL CHECK (urgency IN ('EMERGENCY','THIS_WEEK','FLEXIBLE')),
  description     TEXT,                                       -- post-moderation sanitized text only
  location_geom   GEOGRAPHY(POINT, 4326) NOT NULL,
  budget_range_min NUMERIC(10,3),
  budget_range_max NUMERIC(10,3),
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
                    CHECK (status IN ('PENDING_REVIEW','OPEN','BID_SELECTED',
                                      'IN_PROGRESS','COMPLETED','CANCELLED')),
  notified_vendor_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_geom ON jobs USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_jobs_category_status ON jobs (category_id, status);

-- Bids ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
  bid_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL REFERENCES jobs(job_id),
  vendor_id           UUID NOT NULL REFERENCES vendor_profiles(vendor_id),
  bid_amount          NUMERIC(10,3) NOT NULL,
  proposed_milestones JSONB NOT NULL,                         -- [{"label":"Arrival","pct":50}, ...]
  estimated_start_at  TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
                        CHECK (status IN ('SUBMITTED','SELECTED','REJECTED','WITHDRAWN')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, vendor_id)
);

-- Escrow ledger (immutable, append-only by convention) ------------------------
CREATE TABLE IF NOT EXISTS escrow_ledgers (
  ledger_entry_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL REFERENCES jobs(job_id),
  bid_id              UUID NOT NULL REFERENCES bids(bid_id),
  milestone_index     INTEGER NOT NULL,
  state               VARCHAR(30) NOT NULL
                        CHECK (state IN ('PENDING_FUNDING','HOLDING','AUTO_RELEASE_PENDING',
                                         'RELEASED','DISPUTED','REFUNDED',
                                         'ESCALATED_INSURANCE_CLAIM')),
  amount              NUMERIC(10,3) NOT NULL,
  platform_cut_amount NUMERIC(10,3),
  vendor_payout_amount NUMERIC(10,3),
  actor_user_id       UUID REFERENCES users(user_id),
  insurance_claim_ref TEXT,
  -- external payment-partner reference (PayPal order / capture id)
  external_payment_ref TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escrow_job
  ON escrow_ledgers (job_id, milestone_index, created_at DESC);

-- AI moderation audit log -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type        VARCHAR(30) NOT NULL CHECK (content_type IN ('JOB_DESC','QA_THREAD','CHAT_MSG')),
  content_ref_id      UUID NOT NULL,
  submitting_user_id  UUID NOT NULL REFERENCES users(user_id),
  tier1_match         BOOLEAN NOT NULL DEFAULT false,
  tier2_confidence    NUMERIC(5,4),
  tier2_label         VARCHAR(40),
  flagged_span        TEXT,
  sanitized_alt_text  TEXT,
  resolution          VARCHAR(30)
                        CHECK (resolution IN ('AUTO_PASSED','PENDING_REVIEW','ADMIN_APPROVED_SANITIZED',
                                              'ADMIN_REJECTED','ADMIN_MANUAL_EDIT')),
  resolved_by_admin_id UUID REFERENCES users(user_id),
  model_version       VARCHAR(40),
  insurance_claim_reference TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user
  ON ai_audit_logs (submitting_user_id, created_at DESC);
