-- =============================================================================
-- Masked-relay calling (PRD §1.A friction-reduction; ideas.md "Masked Telephony").
-- A call session bridges consumer<->vendor through a proxy number so neither
-- sees the other's real number. Unlocks only AFTER escrow funding.
-- =============================================================================

CREATE TABLE IF NOT EXISTS call_sessions (
  call_session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  initiator_id     UUID NOT NULL REFERENCES users(user_id),
  consumer_id      UUID NOT NULL REFERENCES users(user_id),
  vendor_id        UUID NOT NULL REFERENCES users(user_id),
  -- external provider (Twilio Proxy) refs
  provider         VARCHAR(20) NOT NULL DEFAULT 'TWILIO_PROXY',
  provider_session_sid TEXT,
  proxy_number     VARCHAR(20),
  status           VARCHAR(20) NOT NULL DEFAULT 'INITIATED'
                     CHECK (status IN ('INITIATED','ACTIVE','COMPLETED','FAILED','SIMULATED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_call_sessions_job ON call_sessions (job_id, created_at DESC);

-- Realtime for the comms hub.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['call_sessions','chat_messages']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;

GRANT ALL ON call_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON call_sessions TO authenticated;
