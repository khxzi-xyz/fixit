-- 5. Short Human-Readable IDs (Orders)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS short_id VARCHAR(10) UNIQUE;

CREATE OR REPLACE FUNCTION generate_job_short_id() RETURNS trigger AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := upper(substr(md5(random()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_job_short_id ON jobs;
CREATE TRIGGER trigger_job_short_id
BEFORE INSERT ON jobs FOR EACH ROW EXECUTE FUNCTION generate_job_short_id();

-- Update existing rows
UPDATE jobs SET short_id = upper(substr(md5(random()::text), 1, 8)) WHERE short_id IS NULL;
