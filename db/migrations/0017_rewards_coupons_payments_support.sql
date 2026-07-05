-- =============================================================================
-- 0017: Rewards ledger, admin coupons, referrals, saved payment methods,
--       and the AI support chat. Apply via Supabase SQL editor (DATABASE_URL
--       in .env is not valid for scripts/migrate.mjs).
-- =============================================================================

-- ── Rewards ledger (was mock-only in rewards.service) ────────────────────────
CREATE TABLE IF NOT EXISTS user_rewards (
  reward_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  balance         NUMERIC(12,3) NOT NULL DEFAULT 0,
  lifetime_earned NUMERIC(12,3) NOT NULL DEFAULT 0,
  points          INTEGER NOT NULL DEFAULT 0,
  referral_code   VARCHAR(24) UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_transactions (
  txn_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind       VARCHAR(20) NOT NULL CHECK (kind IN ('CASHBACK','REFERRAL','BONUS','REDEEMED','COUPON')),
  amount     NUMERIC(12,3) NOT NULL,          -- signed: + earn, - redeem
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reward_txns_user ON reward_transactions (user_id, created_at DESC);

-- ── Referrals (affiliate) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  code        VARCHAR(24) NOT NULL,
  status      VARCHAR(12) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','REWARDED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id, created_at DESC);

-- ── Admin coupons: wallet credit OR gifted plan days ─────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(40) NOT NULL UNIQUE,
  kind        VARCHAR(12) NOT NULL CHECK (kind IN ('CREDIT','PLAN_DAYS')),
  amount_omr  NUMERIC(12,3),                  -- kind=CREDIT
  plan_id     VARCHAR(30),                    -- kind=PLAN_DAYS (e.g. PLUS, PRO_MONTHLY)
  days        INTEGER,                        -- kind=PLAN_DAYS
  max_uses    INTEGER,                        -- NULL = unlimited
  use_count   INTEGER NOT NULL DEFAULT 0,
  audience    VARCHAR(10) NOT NULL DEFAULT 'ALL' CHECK (audience IN ('ALL','CONSUMER','VENDOR')),
  is_public   BOOLEAN NOT NULL DEFAULT false, -- shown in the Rewards page list
  is_active   BOOLEAN NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,                    -- NULL = never expires
  note        TEXT,
  created_by  UUID REFERENCES users(user_id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id     UUID NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

-- ── Saved payment methods (card metadata only — never the PAN/CVV) ───────────
CREATE TABLE IF NOT EXISTS payment_methods (
  pm_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  brand       VARCHAR(20) NOT NULL,
  last4       VARCHAR(4) NOT NULL,
  exp_month   INTEGER NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
  exp_year    INTEGER NOT NULL,
  holder_name VARCHAR(120),
  token       TEXT,                           -- gateway token (sandbox placeholder)
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods (user_id);

-- ── AI support chat messages (permanent support thread per user) ─────────────
CREATE TABLE IF NOT EXISTS support_messages (
  msg_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  sender     VARCHAR(10) NOT NULL CHECK (sender IN ('USER','AI','AGENT')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_msgs_user ON support_messages (user_id, created_at ASC);

-- ── Grants (see 0006_grants.sql: PostgREST roles get nothing by default) ─────
GRANT ALL ON user_rewards, reward_transactions, referrals, coupons,
             coupon_redemptions, payment_methods, support_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_rewards, reward_transactions, referrals,
             coupons, coupon_redemptions, payment_methods, support_messages TO authenticated;
GRANT SELECT ON coupons TO anon;
