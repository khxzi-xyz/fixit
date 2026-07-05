-- ══════════════════════════════════════════════════════════════════
-- FixIt Now -Full Schema Migration v2
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── App Settings (AI provider, cashback rate, etc.) ───────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value, description) VALUES
  ('ai_provider', 'groq', 'Active AI provider: gemini | groq'),
  ('cashback_rate', '2', 'Cashback percentage on completed jobs (e.g. 2 = 2%)'),
  ('referral_reward_omr', '1', 'OMR reward for referrer when referred user buys monthly plan'),
  ('whatsapp_support_number', '96895956361', 'Support WhatsApp number'),
  ('app_version', '1.0.0', 'Current app version')
ON CONFLICT (key) DO NOTHING;

-- ── Rewards ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  reward_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,3) NOT NULL DEFAULT 0,
  lifetime_earned NUMERIC(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS reward_transactions (
  txn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,3) NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('CASHBACK','REFERRAL','COUPON_USED','REDEEMED','WITHDRAWN','BONUS')),
  note TEXT,
  job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Referrals ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVATED','REWARDED')),
  reward_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

-- ── Coupons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'FLAT' CHECK (discount_type IN ('FLAT','PERCENT')),
  discount_value NUMERIC(10,3) NOT NULL,
  max_uses INT,
  used_count INT DEFAULT 0,
  min_order_omr NUMERIC(10,3),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(coupon_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_applied NUMERIC(10,3),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- Seed some default coupons
INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at) VALUES
  ('WELCOME10', 'PERCENT', 10, 1000, NOW() + INTERVAL '1 year'),
  ('FIXIT2026', 'FLAT', 2, 500, NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;

-- ── Ads System ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  ad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#1B6EF3',
  cta_label TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  ad_type TEXT DEFAULT 'BANNER' CHECK (ad_type IN ('BANNER','CARD','POPUP','CATEGORY')),
  target_screen TEXT, -- e.g. 'HOME', 'POST_JOB', 'WALLET'
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  budget_omr NUMERIC(10,3),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a sample ad
INSERT INTO ads (title, subtitle, cta_label, cta_url, ad_type, background_color) VALUES
  ('FixIt Plus -Save 20%', 'Unlimited service requests, zero fees', 'Upgrade Now', '/upgrade', 'BANNER', '#1B6EF3')
ON CONFLICT DO NOTHING;

-- ── Advertise Leads ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertise_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  ad_type TEXT CHECK (ad_type IN ('PRODUCT','SERVICE','SHOP','OTHER')),
  description TEXT,
  budget_omr NUMERIC(10,3),
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW','CONTACTED','CLOSED','REJECTED')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Push Subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  sub_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ── Affiliate Referral Cooldowns ───────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_rewarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id)
);

-- ══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertise_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Rewards: users see their own
CREATE POLICY "own_rewards" ON rewards FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_reward_txns" ON reward_transactions FOR ALL USING (user_id = auth.uid());

-- Referrals: users see ones where they're referrer or referred
CREATE POLICY "own_referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "insert_referral" ON referrals FOR INSERT WITH CHECK (referred_id = auth.uid());

-- Coupons: everyone can read active ones
CREATE POLICY "public_coupons" ON coupons FOR SELECT USING (is_active = TRUE);

-- Coupon redemptions: own
CREATE POLICY "own_redemptions" ON coupon_redemptions FOR ALL USING (user_id = auth.uid());

-- Ads: public read active ads
CREATE POLICY "public_active_ads" ON ads FOR SELECT USING (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()));

-- Advertise leads: own insert/read
CREATE POLICY "own_leads" ON advertise_leads FOR ALL USING (user_id = auth.uid());

-- Push subs: own
CREATE POLICY "own_push" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- App settings: public read
CREATE POLICY "public_app_settings" ON app_settings FOR SELECT USING (TRUE);

-- ══════════════════════════════════════════════════════════════════
-- Functions
-- ══════════════════════════════════════════════════════════════════

-- Auto-create rewards row when user first appears
CREATE OR REPLACE FUNCTION create_user_rewards()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO rewards (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_rewards ON auth.users;
CREATE TRIGGER on_auth_user_created_rewards
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_rewards();

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  code TEXT;
BEGIN
  code := UPPER(SUBSTRING(REPLACE(user_id::TEXT, '-', ''), 1, 8));
  RETURN code;
END;
$$;
