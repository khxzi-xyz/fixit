-- FixIt Now Escrow & Dual-Wallet System Database Schema
-- Optimized for P2P Escrow Hyper-Local Labor Network (Oman/GCC)

CREATE TYPE wallet_currency AS ENUM ('OMR', 'AED', 'SAR');
CREATE TYPE txn_kind AS ENUM (
  'TOPUP',
  'TOPUP_BONUS',
  'JOB_FUND_HOLD',
  'JOB_FUND_RELEASE',
  'VENDOR_PAYOUT_EARNED',
  'PAYOUT_WITHDRAWAL',
  'PARTS_FUND_HOLD',
  'PARTS_FUND_RELEASE',
  'REFUND',
  'PLATFORM_FEE'
);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL UNIQUE,
  balance        NUMERIC(12,3) NOT NULL DEFAULT 0.000 CHECK (balance >= 0),
  locked_balance NUMERIC(12,3) NOT NULL DEFAULT 0.000 CHECK (locked_balance >= 0),
  currency       wallet_currency NOT NULL DEFAULT 'OMR',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions Ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
  txn_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id      UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  kind           txn_kind NOT NULL,
  amount         NUMERIC(12,3) NOT NULL,
  balance_after  NUMERIC(12,3) NOT NULL,
  ref_id         UUID,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY wallet_owner_policy ON wallets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY transaction_owner_policy ON wallet_transactions
  FOR SELECT TO authenticated
  USING (wallet_id IN (SELECT wallet_id FROM wallets WHERE user_id = auth.uid()));

-- Trigger function to update wallet updated_at timestamp
CREATE OR REPLACE FUNCTION fn_update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallets_timestamp
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION fn_update_wallet_timestamp();
