
-- Add is_first_subscription flag to users
ALTER TABLE users ADD COLUMN is_first_subscription BOOLEAN DEFAULT true;

-- Add Weekly and Lifetime Plans to subscription_plans
INSERT INTO subscription_plans (plan_id, display_name, monthly_fee_omr, perks, is_active)
VALUES 
  ('WEEKLY', 'Weekly Pass', 1.000, '{"durationDays": 7, "benefits": ["Unlimited Image Uploads"]}', true),
  ('LIFETIME', 'Lifetime Premium', 99.000, '{"durationDays": 36500, "benefits": ["Unlimited AI usage", "Golden verified badge", "Priority++++ Support++++++++", "Waranty and Coverage From FixIt Now", "Unlimited Image Uploads"]}', true)
ON CONFLICT (plan_id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  monthly_fee_omr = EXCLUDED.monthly_fee_omr,
  perks = EXCLUDED.perks,
  is_active = EXCLUDED.is_active;
