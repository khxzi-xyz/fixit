-- 0014: attach consumer-uploaded photos to a job (additive, safe to re-run).
-- Run in the Supabase SQL editor.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.jobs.media_urls IS
  'Public URLs of photos the consumer attached when posting the job.';
