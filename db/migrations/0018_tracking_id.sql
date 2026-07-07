-- =============================================================================
-- 0018: Add tracking_id to jobs
-- =============================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(12) UNIQUE;

-- Create a function to auto-generate tracking ID if missing
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id VARCHAR(12);
    done BOOL;
BEGIN
    IF NEW.tracking_id IS NULL THEN
        done := false;
        WHILE NOT done LOOP
            -- Generates something like #FX-A1B2C3
            new_id := '#FX-' || upper(substr(md5(random()::text), 1, 6));
            
            BEGIN
                NEW.tracking_id := new_id;
                done := true;
            EXCEPTION WHEN unique_violation THEN
                -- try again
            END;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_tracking_id ON jobs;
CREATE TRIGGER trigger_generate_tracking_id
    BEFORE INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION generate_tracking_id();

-- Backfill existing jobs
UPDATE jobs SET tracking_id = '#FX-' || upper(substr(md5(random()::text), 1, 6)) WHERE tracking_id IS NULL;
