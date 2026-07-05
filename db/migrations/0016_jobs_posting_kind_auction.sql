-- 0016: allow AUCTION posting kind on jobs.
-- The CreateJobDto has accepted 'AUCTION' since the auction/bounty split, but the
-- inline CHECK from 0010_full_spec_buildout.sql predates it, so inserts 400 with
-- "jobs_posting_kind_check" violations.
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_posting_kind_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_posting_kind_check
  CHECK (posting_kind IN ('STANDARD','BOUNTY','AUCTION'));
