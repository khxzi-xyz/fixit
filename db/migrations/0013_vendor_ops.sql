-- =============================================================================
-- 0013: Vendor operations -multi-staff team, ad campaigns, campaign metrics.
-- (Analytics derives from wallet_transactions, no new table needed.)
-- =============================================================================

-- Page 50 -multi-staff / fleet
CREATE TABLE IF NOT EXISTS vendor_staff (
  staff_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(20),
  vehicle_plate VARCHAR(20),
  role        VARCHAR(40) NOT NULL DEFAULT 'OPERATOR',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_staff_vendor ON vendor_staff (vendor_id);

-- Pages 57/91 -ad campaigns (homepage banners)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
  banner_url  TEXT,
  headline    VARCHAR(120),
  target_url  TEXT,
  status      VARCHAR(24) NOT NULL DEFAULT 'AWAITING_REVIEW'
                CHECK (status IN ('AWAITING_REVIEW','ACTIVE','REJECTED','ENDED')),
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_vendor ON ad_campaigns (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_staff, ad_campaigns TO authenticated, service_role;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vendor_staff','ad_campaigns'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
