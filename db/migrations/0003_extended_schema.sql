-- =============================================================================
-- FixIt Now Marketplace -extended schema (PRD §1, §2). Builds on 0001_init.sql.
-- Adds the surfaces the PRD describes beyond the 6 core entities: auth/OTP,
-- categories, milestones, Q&A, chat, notifications, subscriptions, reviews,
-- insurance, moderation violations, and devices.
-- =============================================================================

-- --- Shared trigger: maintain updated_at --------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at to core tables that mutate.
ALTER TABLE users           ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE jobs            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE bids            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_vendor_updated ON vendor_profiles;
CREATE TRIGGER trg_vendor_updated BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_jobs_updated ON jobs;
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_bids_updated ON bids;
CREATE TRIGGER trg_bids_updated BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --- Service taxonomy (PRD §2.A.1) -------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  category_id   VARCHAR(40) PRIMARY KEY,         -- 'AC','ELECTRICAL',...
  display_name  VARCHAR(80) NOT NULL,
  icon_key      VARCHAR(40),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sub_issues (
  sub_issue_id  VARCHAR(60) PRIMARY KEY,         -- 'not_cooling','leaking',...
  category_id   VARCHAR(40) NOT NULL REFERENCES categories(category_id),
  display_name  VARCHAR(120) NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sub_issues_cat ON sub_issues (category_id);

-- --- Auth: phone-OTP + sessions (PRD §1.A.1 / Q1 Auth) -----------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  otp_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  VARCHAR(20) NOT NULL,
  code_hash     TEXT NOT NULL,                    -- store a hash, never the raw code
  purpose       VARCHAR(20) NOT NULL DEFAULT 'LOGIN'
                  CHECK (purpose IN ('LOGIN','VERIFY_PHONE')),
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes (phone_number, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent        TEXT,
  ip_addr           INET,
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions (user_id, created_at DESC);

-- --- Push devices (PRD §2.A.2 FCM/APNs fan-out) ------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
  device_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  platform      VARCHAR(10) NOT NULL CHECK (platform IN ('IOS','ANDROID','WEB')),
  push_token    TEXT NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, push_token)
);

-- --- Milestones (PRD §1.A.1 step 6-7, §1.C.1) --------------------------------
CREATE TABLE IF NOT EXISTS job_milestones (
  milestone_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  bid_id          UUID NOT NULL REFERENCES bids(bid_id),
  milestone_index INTEGER NOT NULL,               -- 0-based, matches escrow_ledgers
  label           VARCHAR(80) NOT NULL,           -- 'Arrival/Diagnosis','Completion'
  pct             NUMERIC(5,2) NOT NULL CHECK (pct > 0 AND pct <= 100),
  amount          NUMERIC(10,3) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','IN_PROGRESS','VENDOR_MARKED_COMPLETE',
                                      'CONSUMER_APPROVED','AUTO_RELEASED','DISPUTED')),
  vendor_marked_at   TIMESTAMPTZ,
  consumer_approved_at TIMESTAMPTZ,
  proof_media_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, milestone_index)
);
CREATE INDEX IF NOT EXISTS idx_milestones_job ON job_milestones (job_id, milestone_index);

-- --- Public Q&A threads (PRD §2.A.3) -----------------------------------------
CREATE TABLE IF NOT EXISTS qa_threads (
  thread_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL UNIQUE REFERENCES jobs(job_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qa_entries (
  entry_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES qa_threads(thread_id) ON DELETE CASCADE,
  author_user_id  UUID NOT NULL REFERENCES users(user_id),
  author_role     VARCHAR(20) NOT NULL CHECK (author_role IN ('CONSUMER','VENDOR')),
  -- anonymized vendor label shown pre-selection, e.g. 'Vendor #3' (PRD §2.A.3.5)
  vendor_alias    VARCHAR(20),
  kind            VARCHAR(10) NOT NULL CHECK (kind IN ('QUESTION','ANSWER')),
  body            TEXT NOT NULL,                  -- post-moderation sanitized text
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
                    CHECK (status IN ('PENDING_REVIEW','OPEN','REJECTED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qa_entries_thread ON qa_entries (thread_id, created_at);

-- --- In-app chat, post-funding only (PRD §1.A.1 step 6, §2.A.4) --------------
CREATE TABLE IF NOT EXISTS chat_channels (
  channel_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL UNIQUE REFERENCES jobs(job_id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES users(user_id),
  vendor_id   UUID NOT NULL REFERENCES users(user_id),
  unlocked_at TIMESTAMPTZ,                        -- set when escrow reaches HOLDING
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    UUID NOT NULL REFERENCES chat_channels(channel_id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES users(user_id),
  body          TEXT NOT NULL,                    -- post-moderation sanitized text
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('PENDING_REVIEW','OPEN','REJECTED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages (channel_id, created_at);

-- --- Notifications feed (PRD §1.A, §2.A.2) -----------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind        VARCHAR(40) NOT NULL,               -- 'NEW_JOB','BID_RECEIVED','WON_BID',...
  title       VARCHAR(160) NOT NULL,
  body        TEXT,
  job_id      UUID REFERENCES jobs(job_id),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

-- --- Subscriptions / plans (PRD §1.B.3) --------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id        VARCHAR(40) PRIMARY KEY,         -- 'BOOTSTRAP','GROWTH','PREMIUM'
  display_name   VARCHAR(80) NOT NULL,
  monthly_fee_omr NUMERIC(10,3) NOT NULL DEFAULT 0,
  take_rate_pct  NUMERIC(5,2) NOT NULL,           -- e.g. 12.00
  priority_placement BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  plan_id       VARCHAR(40) NOT NULL REFERENCES subscription_plans(plan_id),
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('TRIAL','ACTIVE','LAPSED','CANCELLED')),
  free_bids_remaining INTEGER NOT NULL DEFAULT 3, -- Q1 capped free trial (PRD §1.B.3)
  current_period_end  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vsub_vendor ON vendor_subscriptions (vendor_id);

-- --- Reviews, gated behind payment release (PRD §1.A.1 step 8) ---------------
CREATE TABLE IF NOT EXISTS reviews (
  review_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL UNIQUE REFERENCES jobs(job_id),
  consumer_id UUID NOT NULL REFERENCES users(user_id),
  vendor_id   UUID NOT NULL REFERENCES vendor_profiles(vendor_id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews (vendor_id, created_at DESC);

-- --- Insurance: per-job micro-policies + claims (PRD §1.C.3) -----------------
-- NOTE: escrow NEVER pays property damage. Insurance is a SEPARATE money flow
-- that only shares the Job ID. (PRD §1.C.3 "Important structural point".)
CREATE TABLE IF NOT EXISTS insurance_policies (
  policy_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(job_id),
  external_policy_ref TEXT NOT NULL,              -- insurer API id, keyed by Job ID
  premium_omr      NUMERIC(10,3),
  certificate_url  TEXT,
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policies_job ON insurance_policies (job_id);

CREATE TABLE IF NOT EXISTS insurance_claims (
  claim_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(job_id),
  policy_id        UUID REFERENCES insurance_policies(policy_id),
  filed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  external_claim_ref TEXT,                        -- insurer claim id, keyed by Job ID
  description      TEXT NOT NULL,
  evidence_media   TEXT[],
  status           VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
                     CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','DENIED','PAID')),
  resolution_note  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_claims_job ON insurance_claims (job_id);

-- --- Moderation: rolling violation tracking (PRD §2.B.4) ---------------------
CREATE TABLE IF NOT EXISTS user_violations (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  audit_log_id UUID REFERENCES ai_audit_logs(log_id),
  severity     VARCHAR(20) NOT NULL DEFAULT 'CONTENT'
                 CHECK (severity IN ('CONTENT','ACCOUNT_REVIEW')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_violations_user ON user_violations (user_id, created_at DESC);

-- --- Disputes (PRD §1.A.3 Disputed Funds Resolution) -------------------------
CREATE TABLE IF NOT EXISTS disputes (
  dispute_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(job_id),
  milestone_index INTEGER NOT NULL,
  opened_by_user_id UUID NOT NULL REFERENCES users(user_id),
  reason        TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','RESOLVED','ESCALATED')),
  resolution_method VARCHAR(10) CHECK (resolution_method IN ('METHOD_1','METHOD_2')),
  resolution_refund_fraction NUMERIC(5,4),
  resolved_by_admin_id UUID REFERENCES users(user_id),
  sla_due_at    TIMESTAMPTZ,                      -- triage SLA countdown (PRD §1.A.3)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status, sla_due_at);

-- --- Seed reference data ------------------------------------------------------
INSERT INTO categories (category_id, display_name, icon_key, sort_order) VALUES
  ('AC','Air Conditioning','snowflake',1),
  ('ELECTRICAL','Electrical','bolt',2),
  ('PLUMBING','Plumbing','droplet',3),
  ('SECURITY','Security Installation','shield',4),
  ('HANDYMAN','General Handyman','wrench',5)
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO subscription_plans (plan_id, display_name, monthly_fee_omr, take_rate_pct, priority_placement) VALUES
  ('BOOTSTRAP','Bootstrap (verification only)',5.000,13.50,false),
  ('GROWTH','Growth (priority bidding)',25.000,11.00,true),
  ('PREMIUM','Premium (top-of-feed + analytics)',60.000,9.00,true)
ON CONFLICT (plan_id) DO NOTHING;
