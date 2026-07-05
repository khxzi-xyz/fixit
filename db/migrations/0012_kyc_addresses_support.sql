-- =============================================================================
-- 0012: KYC documents, saved addresses, support tickets, services framework.
-- Adds the launch-gate + enterprise pieces from the 100-page matrix.
-- =============================================================================

-- Zone 1 -Vendor KYC documents (Module 08/09)
CREATE TABLE IF NOT EXISTS vendor_documents (
  document_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  document_type VARCHAR(40) NOT NULL CHECK (document_type IN
                  ('NATIONAL_ID','PASSPORT','COMMERCIAL_REGISTRATION','TRADE_LICENSE','INSURANCE','OTHER')),
  storage_url   TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'UNDER_REVIEW'
                  CHECK (status IN ('UNDER_REVIEW','APPROVED','REJECTED')),
  rejection_reason TEXT,
  admin_id      UUID REFERENCES users(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vendor_docs_vendor ON vendor_documents (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_docs_status ON vendor_documents (status, created_at);

-- Zone 4 -Saved address book (Page 40)
CREATE TABLE IF NOT EXISTS user_addresses (
  address_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  label       VARCHAR(60) NOT NULL,
  geom        GEOGRAPHY(POINT, 4326),
  details     TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses (user_id);

-- Zone 8 -Support tickets (Pages 71/72)
CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subject     VARCHAR(160) NOT NULL,
  body        TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','PENDING','RESOLVED','CLOSED')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets (status);
DROP TRIGGER IF EXISTS trg_support_updated ON support_tickets;
CREATE TRIGGER trg_support_updated BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Zone 3 -Dynamic framework + per-category custom fields (Pages 21/24)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS framework_type VARCHAR(20) NOT NULL DEFAULT 'A_REPAIR'
  CHECK (framework_type IN ('A_REPAIR','B_TRANSIT','C_INSTANT'));
ALTER TABLE categories ADD COLUMN IF NOT EXISTS custom_fields JSONB;

GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_documents, user_addresses, support_tickets
  TO authenticated, service_role;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vendor_documents','user_addresses','support_tickets'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
