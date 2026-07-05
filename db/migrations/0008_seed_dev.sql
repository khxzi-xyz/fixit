-- =============================================================================
-- DEV SEED -fake personas + sample data so the three apps are testable.
-- Idempotent (ON CONFLICT). Safe to re-run. DO NOT run in production.
-- Login via POST /api/auth/dev-login { role } or the "Login as…" buttons.
-- =============================================================================

-- Fixed UUIDs for determinism.
-- Consumer  : 11111111-1111-1111-1111-111111111111  (+96890000001)
-- Vendor    : 22222222-2222-2222-2222-222222222222  (+96890000002)
-- Vendor 2  : 33333333-3333-3333-3333-333333333333  (+96890000004)
-- Admin     : 44444444-4444-4444-4444-444444444444  (+96890000003)

INSERT INTO users (user_id, phone_number, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111','+96890000001','Aisha Al Lawati','CONSUMER'),
  ('22222222-2222-2222-2222-222222222222','+96890000002','Khalid Al Balushi','VENDOR'),
  ('33333333-3333-3333-3333-333333333333','+96890000004','Salim Electric Co.','VENDOR'),
  ('44444444-4444-4444-4444-444444444444','+96890000003','Ops Admin','ADMIN')
ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Verified vendors covering AC/Electrical/Plumbing, Muscat service area.
INSERT INTO vendor_profiles (vendor_id, category_ids, verification_status, subscription_status,
                             radius_meters, rating_avg, jobs_completed_count, insurance_expiry)
VALUES
  ('22222222-2222-2222-2222-222222222222', ARRAY['AC','ELECTRICAL','PLUMBING'],
   'VERIFIED','ACTIVE', 25000, 4.80, 37, current_date + INTERVAL '120 days'),
  ('33333333-3333-3333-3333-333333333333', ARRAY['ELECTRICAL','SECURITY'],
   'VERIFIED','TRIAL', 20000, 4.55, 12, current_date + INTERVAL '20 days')
ON CONFLICT (vendor_id) DO UPDATE
  SET verification_status = EXCLUDED.verification_status,
      category_ids = EXCLUDED.category_ids;

-- Sample job cards owned by the consumer (Muscat coords ~58.38,23.59).
INSERT INTO jobs (job_id, consumer_id, category_id, sub_issue_tags, urgency, description,
                  location_geom, budget_range_min, budget_range_max, status, notified_vendor_count)
VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'AC', ARRAY['not_cooling'],'EMERGENCY','AC stopped cooling in the living room, blowing warm air.',
   'SRID=4326;POINT(58.3829 23.5880)', 20.000, 60.000, 'OPEN', 2),
  ('aaaaaaa1-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
   'PLUMBING', ARRAY['leaking'],'THIS_WEEK','Kitchen sink pipe leaking under the cabinet.',
   'SRID=4326;POINT(58.4050 23.6100)', 15.000, 40.000, 'OPEN', 1),
  ('aaaaaaa1-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
   'ELECTRICAL', ARRAY['not_turning_on'],'FLEXIBLE','Two power sockets in the bedroom are dead.',
   'SRID=4326;POINT(58.3700 23.5700)', 10.000, 30.000, 'OPEN', 2)
ON CONFLICT (job_id) DO NOTHING;

-- Public Q&A threads for those jobs.
INSERT INTO qa_threads (job_id)
SELECT job_id FROM jobs WHERE consumer_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (job_id) DO NOTHING;

-- A couple of bids on the AC job so the consumer's bid-comparison view is populated.
INSERT INTO bids (bid_id, job_id, vendor_id, bid_amount, proposed_milestones, status)
VALUES
  ('bbbbbbb1-0000-0000-0000-000000000001','aaaaaaa1-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 45.000,
   '[{"label":"Arrival/Diagnosis","pct":50},{"label":"Completion","pct":50}]', 'SUBMITTED'),
  ('bbbbbbb1-0000-0000-0000-000000000002','aaaaaaa1-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 52.000,
   '[{"label":"Arrival","pct":40},{"label":"Completion","pct":60}]', 'SUBMITTED')
ON CONFLICT (job_id, vendor_id) DO NOTHING;
