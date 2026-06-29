-- =============================================================================
-- 0010: FULL SPEC BUILD-OUT
-- Implements every remaining module from master_specs_URGENTLY_ADD.MD (v1.0 +
-- v2.0 audit revision). Builds on 0001–0009. Additive only — no destructive
-- drops of existing tables. Run AFTER 0009.
--
-- Sections:
--   A. Dual-Wallet System (Module 04)            — wallets + ledger + payouts
--   B. Manual Payment Verification gate (Mod 04)
--   C. Live Map / Availability / Tracking (Mod 08/09)
--   D. Per-skill Vendor Tagging (Module 02)
--   E. Dynamic Service Catalog requests (Module 02)
--   F. Bounty Bargain + Busy lock + Bid-Back Tokens (Module 03)
--   G. Triple-Verify job photos (Module 06)
--   H. Voice notes on chat (Module 06)
--   I. Contact masking state (Module 08)
--   J. Module 18 — Workshop Diagnostics (rolling pass)
--   K. Module 19 — Open Marketplace (goods, fixed + auction)
--   L. Module 20 — High-Ticket Lead-Lock
--   M. Module 22 — Reverse Junk Auctions
--   N. Subscription tiers reconciliation (Plus/Pro 3 OMR, Elite 7 OMR)
--   O. Realtime publication + grants
-- =============================================================================

-- =============================================================================
-- A. DUAL-WALLET SYSTEM (Module 04)
-- One wallet per user. Consumers top up (with bonus scale); vendors accumulate
-- earnings. Every balance change is an append-only ledger row. The wallet
-- balance is the running sum, kept on the wallet row for fast reads and
-- reconciled against the ledger.
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  -- balance available to spend / cash out (OMR, 3dp)
  balance       NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  -- funds locked in active escrow / pending payout windows (not spendable)
  locked_balance NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
  currency      VARCHAR(3) NOT NULL DEFAULT 'OMR',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_wallets_updated ON wallets;
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append-only money movements. `direction` of +/- on `balance`.
CREATE TABLE IF NOT EXISTS wallet_transactions (
  txn_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(user_id),
  kind          VARCHAR(30) NOT NULL CHECK (kind IN (
                  'TOPUP','TOPUP_BONUS','JOB_FUND_HOLD','JOB_FUND_RELEASE',
                  'VENDOR_PAYOUT_EARNED','PAYOUT_WITHDRAWAL','PARTS_FUND_HOLD',
                  'PARTS_FUND_RELEASE','REFUND','VOUCHER_CREDIT','PLATFORM_FEE',
                  'GOODS_SALE','GOODS_PURCHASE','LEAD_LOCK_FEE','DIAGNOSTIC_PASS',
                  'ADJUSTMENT')),
  amount        NUMERIC(12,3) NOT NULL,          -- signed: + credit, - debit
  balance_after NUMERIC(12,3) NOT NULL,
  job_id        UUID REFERENCES jobs(job_id),
  ref_id        UUID,                            -- e.g. payout_request_id, listing_id
  external_ref  TEXT,                            -- PayPal id, bank txn ref
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON wallet_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_job ON wallet_transactions (job_id);

-- Consumer top-up bonus scale (Module 04). 10->+1, 20->+3, 30..50->+5 ceiling.
CREATE OR REPLACE FUNCTION fn_topup_bonus(p_amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF p_amount >= 30 THEN RETURN 5;
  ELSIF p_amount >= 20 THEN RETURN 3;
  ELSIF p_amount >= 10 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vendor cash-out requests, settled on fixed payout windows (Module 04).
CREATE TABLE IF NOT EXISTS payout_requests (
  payout_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  wallet_id     UUID NOT NULL REFERENCES wallets(wallet_id),
  amount        NUMERIC(12,3) NOT NULL CHECK (amount > 0),
  bank_account_name TEXT,
  bank_account_ref  TEXT,                        -- IBAN / account no (masked in UI)
  status        VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
                  CHECK (status IN ('REQUESTED','APPROVED','PAID','REJECTED')),
  admin_id      UUID REFERENCES users(user_id),
  admin_note    TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payout_vendor ON payout_requests (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_status ON payout_requests (status, requested_at);

-- =============================================================================
-- B. MANUAL PAYMENT VERIFICATION GATE (Module 04 / Loophole 5)
-- Bank transfers + certain gateway payments are held until an admin matches the
-- uploaded screenshot to the real ledger. Card/instant rails skip this.
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(user_id),
  wallet_id     UUID REFERENCES wallets(wallet_id),
  job_id        UUID REFERENCES jobs(job_id),
  amount        NUMERIC(12,3) NOT NULL CHECK (amount > 0),
  method        VARCHAR(20) NOT NULL DEFAULT 'BANK_TRANSFER'
                  CHECK (method IN ('BANK_TRANSFER','PAYPAL','CARD','OTHER')),
  receipt_url   TEXT,                            -- uploaded screenshot
  status        VARCHAR(20) NOT NULL DEFAULT 'AWAITING_VERIFICATION'
                  CHECK (status IN ('AWAITING_VERIFICATION','VERIFIED','REJECTED')),
  admin_id      UUID REFERENCES users(user_id),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payverif_status ON payment_verifications (status, created_at);

-- =============================================================================
-- C. LIVE MAP / AVAILABILITY / PRIVACY TRACKING (Module 08/09)
-- "Available Now" bat-signal + privacy-first per-job tracking that only runs
-- between "On My Way" and "Arrived".
-- =============================================================================

-- Live availability + last known location (only while toggled ON).
CREATE TABLE IF NOT EXISTS vendor_availability (
  vendor_id     UUID PRIMARY KEY REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  is_available  BOOLEAN NOT NULL DEFAULT false,
  live_geom     GEOGRAPHY(POINT, 4326),          -- current pin, only while available
  heading       NUMERIC(6,2),                    -- optional bearing
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_avail_geom ON vendor_availability USING GIST (live_geom);
CREATE INDEX IF NOT EXISTS idx_vendor_avail_flag ON vendor_availability (is_available);

-- Geo query: nearby available vendors for the consumer map (Module 09).
CREATE OR REPLACE FUNCTION fn_nearby_available_vendors(
  p_lat NUMERIC, p_lng NUMERIC, p_radius NUMERIC, p_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  vendor_id UUID, full_name VARCHAR, rating_avg NUMERIC, jobs_completed_count INTEGER,
  category_ids TEXT[], lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  distance_m DOUBLE PRECISION, heading NUMERIC
) AS $$
  SELECT
    va.vendor_id,
    u.full_name,
    vp.rating_avg,
    vp.jobs_completed_count,
    vp.category_ids,
    ST_Y(va.live_geom::geometry) AS lat,
    ST_X(va.live_geom::geometry) AS lng,
    ST_Distance(va.live_geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m,
    va.heading
  FROM vendor_availability va
  JOIN vendor_profiles vp ON vp.vendor_id = va.vendor_id
  JOIN users u ON u.user_id = va.vendor_id
  WHERE va.is_available = true
    AND va.live_geom IS NOT NULL
    AND (p_category IS NULL OR p_category = ANY (vp.category_ids))
    AND ST_DWithin(va.live_geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius)
  ORDER BY distance_m ASC
  LIMIT 50;
$$ LANGUAGE sql STABLE;

-- Per-job tracking sessions: open ONLY on "On My Way", close on "Arrived".
CREATE TABLE IF NOT EXISTS job_tracking_sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  status        VARCHAR(20) NOT NULL DEFAULT 'EN_ROUTE'
                  CHECK (status IN ('EN_ROUTE','ARRIVED','ENDED')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrived_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tracking_job ON job_tracking_sessions (job_id, status);

-- Breadcrumb pings for an active tracking session (ephemeral, purged on end).
CREATE TABLE IF NOT EXISTS job_tracking_pings (
  ping_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES job_tracking_sessions(session_id) ON DELETE CASCADE,
  geom          GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracking_pings_session ON job_tracking_pings (session_id, created_at);

-- Direct strike-bounties: consumer taps an available vendor on the map and
-- sends a fixed-price offer straight to them (Module 03 Path B / Module 09).
CREATE TABLE IF NOT EXISTS direct_bounties (
  bounty_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES jobs(job_id),
  consumer_id   UUID NOT NULL REFERENCES users(user_id),
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  category_id   VARCHAR(40),
  offered_price NUMERIC(10,3) NOT NULL CHECK (offered_price > 0),
  counter_price NUMERIC(10,3),
  note          TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'SENT'
                  CHECK (status IN ('SENT','COUNTERED','ACCEPTED','DECLINED','EXPIRED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_direct_bounty_vendor ON direct_bounties (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_direct_bounty_consumer ON direct_bounties (consumer_id, status);

-- =============================================================================
-- D. PER-SKILL VENDOR TAGGING (Module 02)
-- A vendor proves each skill with a photo/cert; admin approves per-skill. Job
-- visibility is filtered to APPROVED tags only.
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendor_skill_tags (
  tag_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  category_id   VARCHAR(40) NOT NULL REFERENCES categories(category_id),
  proof_url     TEXT,                            -- work photo or certificate
  proof_note    TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  admin_id      UUID REFERENCES users(user_id),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  UNIQUE (vendor_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_skill_tags_vendor ON vendor_skill_tags (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_skill_tags_status ON vendor_skill_tags (status);

-- =============================================================================
-- E. DYNAMIC SERVICE CATALOG REQUESTS (Module 02)
-- "Service Not Found. Tap to Request." Admin approves -> category created and a
-- network-wide notification fires.
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_requests (
  request_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_user_id UUID NOT NULL REFERENCES users(user_id),
  proposed_name VARCHAR(80) NOT NULL,
  description   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approved_category_id VARCHAR(40) REFERENCES categories(category_id),
  admin_id      UUID REFERENCES users(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests (status, created_at);

-- =============================================================================
-- F. BOUNTY BARGAIN + BUSY LOCK + BID-BACK TOKENS (Module 03)
-- =============================================================================

-- Bounty jobs: consumer names a fixed price, vendors accept or counter.
-- A "kind" flag on jobs distinguishes a standard blind-bid job from a bounty.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_kind VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
  CHECK (posting_kind IN ('STANDARD','BOUNTY'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bounty_price NUMERIC(10,3);

-- Structured counter-offers on a bounty job (never open chat). One row per move.
CREATE TABLE IF NOT EXISTS bounty_offers (
  offer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  price         NUMERIC(10,3) NOT NULL CHECK (price > 0),
  move          VARCHAR(20) NOT NULL CHECK (move IN ('ACCEPT','COUNTER')),
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bounty_offers_job ON bounty_offers (job_id, status);

-- Single-job "Busy" lock (Module 03 / 08). A vendor with an active accepted job
-- is blocked from bidding/viewing others unless their shop has multiple staff.
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS is_busy BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS busy_job_id UUID REFERENCES jobs(job_id);
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS staff_count INTEGER NOT NULL DEFAULT 1 CHECK (staff_count >= 1);

-- Bid-Back Tokens: free vendors get a daily allotment; a token is refunded if
-- the bid is fairly rejected, only consumed if the vendor wins or ghosts.
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS bid_tokens INTEGER NOT NULL DEFAULT 5;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS bid_tokens_reset_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS bid_token_ledger (
  entry_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  bid_id        UUID REFERENCES bids(bid_id),
  delta         INTEGER NOT NULL,                -- -1 consume, +1 refund, +N daily grant
  reason        VARCHAR(40) NOT NULL,            -- 'BID_PLACED','BID_REFUNDED','WON','GHOSTED','DAILY_GRANT'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bid_token_vendor ON bid_token_ledger (vendor_id, created_at DESC);

-- =============================================================================
-- G. TRIPLE-VERIFY JOB PHOTOS (Module 06)
-- Before / vendor-after / consumer-after, all via in-app camera. Completion
-- logic only unlocks once both "after" photos exist.
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_photos (
  photo_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(user_id),
  phase         VARCHAR(20) NOT NULL CHECK (phase IN ('BEFORE','VENDOR_AFTER','CONSUMER_AFTER')),
  url           TEXT NOT NULL,
  captured_in_app BOOLEAN NOT NULL DEFAULT true, -- discourage gallery reuse
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos (job_id, phase);

-- Completion confirmation state machine separate from escrow (Module 06).
CREATE TABLE IF NOT EXISTS job_completions (
  job_id        UUID PRIMARY KEY REFERENCES jobs(job_id) ON DELETE CASCADE,
  vendor_after_at   TIMESTAMPTZ,
  consumer_after_at TIMESTAMPTZ,
  consumer_confirmed VARCHAR(10) CHECK (consumer_confirmed IN ('YES','NO')),
  confirmed_at  TIMESTAMPTZ,
  dispute_id    UUID REFERENCES disputes(dispute_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_job_completions_updated ON job_completions;
CREATE TRIGGER trg_job_completions_updated BEFORE UPDATE ON job_completions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- H. VOICE NOTES ON CHAT (Module 06)
-- Raw voice notes, WhatsApp-style, deliberately NO translation layer.
-- =============================================================================
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT'
  CHECK (message_type IN ('TEXT','VOICE','IMAGE'));
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_duration_secs INTEGER;
-- voice/image messages have empty text body; relax the implicit NOT NULL usage
ALTER TABLE chat_messages ALTER COLUMN body DROP NOT NULL;

-- =============================================================================
-- I. CONTACT MASKING STATE (Module 08)
-- Contact details stay masked until the consumer's 100% payment is locked.
-- Enforced in app logic; this column records when masking lifts for a job.
-- =============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_unmasked_at TIMESTAMPTZ;

-- =============================================================================
-- J. MODULE 18 — WORKSHOP DIAGNOSTICS (rolling diagnostic pass)
-- User buys ONE 3 OMR pass; shops that can't diagnose release it untouched; the
-- shop that solves it gets 1 OMR now, 2 OMR rolls into the repair as discount.
-- =============================================================================
CREATE TABLE IF NOT EXISTS diagnostic_passes (
  pass_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id   UUID NOT NULL REFERENCES users(user_id),
  category_id   VARCHAR(40),
  description   TEXT,
  amount        NUMERIC(10,3) NOT NULL DEFAULT 3.000,
  resolved_amount NUMERIC(10,3) NOT NULL DEFAULT 1.000,  -- released to solving shop
  rollover_amount NUMERIC(10,3) NOT NULL DEFAULT 2.000,  -- discount into repair
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','DIAGNOSED','CONVERTED','EXPIRED','REFUNDED')),
  diagnosed_by_vendor_id UUID REFERENCES users(user_id),
  diagnosis_note TEXT,
  job_id        UUID REFERENCES jobs(job_id),     -- the repair job it converts into
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  diagnosed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_diag_pass_consumer ON diagnostic_passes (consumer_id, status);

-- Each shop visit attempt against a pass (so "cannot diagnose" is logged).
CREATE TABLE IF NOT EXISTS diagnostic_visits (
  visit_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id       UUID NOT NULL REFERENCES diagnostic_passes(pass_id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES users(user_id),
  outcome       VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (outcome IN ('PENDING','CANNOT_DIAGNOSE','DIAGNOSED')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diag_visits_pass ON diagnostic_visits (pass_id, created_at);

-- =============================================================================
-- K. MODULE 19 — OPEN MARKETPLACE (peer goods, fixed price or auction)
-- Flat 5% transaction fee. QR handoff releases escrowed funds.
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  listing_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES users(user_id),
  title         VARCHAR(160) NOT NULL,
  description   TEXT,
  photos        TEXT[],
  category_label VARCHAR(80),
  sale_kind     VARCHAR(20) NOT NULL CHECK (sale_kind IN ('FIXED','AUCTION')),
  price         NUMERIC(12,3),                   -- fixed price OR current/starting bid
  starting_bid  NUMERIC(12,3),
  auction_ends_at TIMESTAMPTZ,
  location_geom GEOGRAPHY(POINT, 4326),
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','PENDING_HANDOFF','SOLD','CANCELLED','EXPIRED')),
  buyer_id      UUID REFERENCES users(user_id),
  sold_price    NUMERIC(12,3),
  handoff_code  VARCHAR(20),                     -- QR handoff token
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_geom ON marketplace_listings USING GIST (location_geom);
DROP TRIGGER IF EXISTS trg_listings_updated ON marketplace_listings;
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS marketplace_bids (
  bid_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES marketplace_listings(listing_id) ON DELETE CASCADE,
  bidder_id     UUID NOT NULL REFERENCES users(user_id),
  amount        NUMERIC(12,3) NOT NULL CHECK (amount > 0),
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','OUTBID','WON','LOST')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mkt_bids_listing ON marketplace_bids (listing_id, amount DESC);

-- Flat goods fee (Module 19): 5%.
CREATE OR REPLACE FUNCTION fn_goods_fee(p_amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(p_amount * 0.05, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- L. MODULE 20 — HIGH-TICKET LEAD-LOCK
-- Bargain in-app, deal in person. Platform never holds the sale price — just a
-- flat lead fee + a small refundable Lead-Lock deposit that unlocks contact.
-- =============================================================================
CREATE TABLE IF NOT EXISTS high_ticket_listings (
  listing_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES users(user_id),
  title         VARCHAR(160) NOT NULL,
  description   TEXT,
  photos        TEXT[],
  item_class    VARCHAR(30) NOT NULL DEFAULT 'VEHICLE'
                  CHECK (item_class IN ('VEHICLE','ELECTRONICS','PROPERTY','OTHER')),
  asking_price  NUMERIC(14,3) NOT NULL,
  flat_lead_fee NUMERIC(10,3) NOT NULL,          -- e.g. 15 OMR vehicles, 3 electronics
  lead_lock_deposit NUMERIC(10,3) NOT NULL DEFAULT 5.000,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','NEGOTIATING','LOCKED','SOLD','CANCELLED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_highticket_updated ON high_ticket_listings;
CREATE TRIGGER trg_highticket_updated BEFORE UPDATE ON high_ticket_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS high_ticket_offers (
  offer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES high_ticket_listings(listing_id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(user_id),
  amount        NUMERIC(14,3) NOT NULL CHECK (amount > 0),
  party         VARCHAR(10) NOT NULL CHECK (party IN ('BUYER','SELLER')),
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','COUNTERED','AGREED','DECLINED')),
  -- contact stays masked until a Lead-Lock deposit is paid against this thread
  lead_locked   BOOLEAN NOT NULL DEFAULT false,
  deposit_txn_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_highticket_offers_listing ON high_ticket_offers (listing_id, created_at);

-- =============================================================================
-- M. MODULE 22 — REVERSE JUNK AUCTIONS
-- User posts junk; geofenced Pro/Elite buyers bid cash to buy it; highest wins;
-- QR pickup releases payment. Reuses a flat fee on confirmation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS junk_listings (
  junk_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES users(user_id),
  title         VARCHAR(160) NOT NULL,
  photo_url     TEXT,
  location_geom GEOGRAPHY(POINT, 4326),
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','ACCEPTED','PICKED_UP','CANCELLED','EXPIRED')),
  accepted_bid_id UUID,
  pickup_code   VARCHAR(20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_junk_status ON junk_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_junk_geom ON junk_listings USING GIST (location_geom);

CREATE TABLE IF NOT EXISTS junk_bids (
  bid_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  junk_id       UUID NOT NULL REFERENCES junk_listings(junk_id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(user_id),
  amount        NUMERIC(10,3) NOT NULL CHECK (amount > 0),
  pickup_eta    VARCHAR(80),                     -- "collect it in an hour"
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','WON','LOST')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_junk_bids_listing ON junk_bids (junk_id, amount DESC);

-- =============================================================================
-- N. SUBSCRIPTION TIERS RECONCILIATION (Module 09 / v2.0)
-- Add the v2.0 consumer-and-vendor tiers (Plus/Pro 3 OMR, Elite 7 OMR) without
-- destroying the original BOOTSTRAP/GROWTH/PREMIUM rows.
-- =============================================================================
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'VENDOR'
  CHECK (audience IN ('CONSUMER','VENDOR','BOTH'));
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS perks JSONB;

INSERT INTO subscription_plans (plan_id, display_name, monthly_fee_omr, take_rate_pct, priority_placement, audience, perks) VALUES
  ('PLUS','FixIt Plus',3.000,20.00,false,'CONSUMER',
    '{"media":"10img/5vid","ai_uses":"20/week","coupon_drops":true,"verified_badge":true}'),
  ('PRO','FixIt Pro',3.000,20.00,true,'VENDOR',
    '{"unlimited_bids":true,"featured_bids":true,"rich_profile":true,"blue_tick":true}'),
  ('ELITE','FixIt Elite',7.000,8.00,true,'VENDOR',
    '{"bulk_inventory":true,"reduced_high_ticket_fees":true,"top_of_feed":true}')
ON CONFLICT (plan_id) DO UPDATE
  SET monthly_fee_omr = EXCLUDED.monthly_fee_omr,
      display_name = EXCLUDED.display_name,
      audience = EXCLUDED.audience,
      perks = EXCLUDED.perks;

-- Consumer-side subscription state (vendors already have vendor_subscriptions).
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id VARCHAR(40) REFERENCES subscription_plans(plan_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) NOT NULL DEFAULT 'en';

-- =============================================================================
-- O. INTERNAL AI PRICE ESTIMATES (Module 01)
-- Admin/system-only fair-price range used for bid-floor protection. Never shown
-- to consumers.
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_price_estimates (
  job_id        UUID PRIMARY KEY REFERENCES jobs(job_id) ON DELETE CASCADE,
  est_min       NUMERIC(10,3) NOT NULL,
  est_max       NUMERIC(10,3) NOT NULL,
  floor_amount  NUMERIC(10,3) NOT NULL,          -- below this, bids get blocked/flagged
  model_version VARCHAR(40),
  rationale     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flag columns on bids for the price-floor guard (Module 01 / 03).
ALTER TABLE bids ADD COLUMN IF NOT EXISTS below_floor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- AI job-ticket rewrite audit (Module 01) — keep the original + rewritten text.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS original_description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_rewritten BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- O. REALTIME PUBLICATION + GRANTS
-- =============================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets','wallet_transactions','payout_requests','payment_verifications',
    'vendor_availability','job_tracking_sessions','job_tracking_pings','direct_bounties',
    'vendor_skill_tags','service_requests','bounty_offers','bid_token_ledger',
    'job_photos','job_completions','diagnostic_passes','diagnostic_visits',
    'marketplace_listings','marketplace_bids','high_ticket_listings','high_ticket_offers',
    'junk_listings','junk_bids','job_price_estimates'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  wallets, wallet_transactions, payout_requests, payment_verifications,
  vendor_availability, job_tracking_sessions, job_tracking_pings, direct_bounties,
  vendor_skill_tags, service_requests, bounty_offers, bid_token_ledger,
  job_photos, job_completions, diagnostic_passes, diagnostic_visits,
  marketplace_listings, marketplace_bids, high_ticket_listings, high_ticket_offers,
  junk_listings, junk_bids, job_price_estimates
  TO authenticated, service_role;
