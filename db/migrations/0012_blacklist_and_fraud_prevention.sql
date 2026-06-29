-- =============================================================================
-- 0012: Blacklist & Fraud Prevention (Module 10 / Loophole Mitigations).
-- Implements permanent ban lists for phone numbers, device IDs, and business
-- registration document numbers to enforce anti-poaching and platform trust.
-- =============================================================================

CREATE TABLE IF NOT EXISTS banned_users (
  ban_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  VARCHAR(20) UNIQUE NOT NULL,
  reason        TEXT NOT NULL,
  banned_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banned_devices (
  ban_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_token  TEXT UNIQUE NOT NULL,            -- FCM token, APNs token, or hardware ID
  reason        TEXT NOT NULL,
  banned_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banned_documents (
  ban_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number    VARCHAR(100) UNIQUE NOT NULL,    -- Business license or ID card number
  reason        TEXT NOT NULL,
  banned_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function to block insertions or logins from blacklisted numbers
CREATE OR REPLACE FUNCTION fn_prevent_banned_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM banned_users WHERE phone_number = NEW.phone_number) THEN
    RAISE EXCEPTION 'This phone number has been permanently banned from the FixIt network.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_banned_user ON users;
CREATE TRIGGER trg_check_banned_user BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_banned_user();

GRANT SELECT, INSERT, UPDATE, DELETE ON banned_users, banned_devices, banned_documents TO authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'banned_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE banned_users;
  END IF;
END $$;
