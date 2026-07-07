-- FixIt Now - Final Polish Database Updates -- Run these commands in your Supabase SQL Editor

-- 1. IP Tracking / Trusted Devices CREATE TABLE IF NOT EXISTS trusted_devices ( device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, device_name TEXT NOT NULL, ip_address TEXT, last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- 2. Notifications Table (if not exists) CREATE TABLE IF NOT EXISTS notifications ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT NOT NULL, type TEXT DEFAULT 'GENERAL', is_read BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- 3. Job Drafts (Alternative to LocalStorage, Optional for full sync) CREATE TABLE IF NOT EXISTS job_drafts ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, category_id TEXT NOT NULL, urgency TEXT NOT NULL, description TEXT, lat NUMERIC, lng NUMERIC, media_urls TEXT[], updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- 4. Referral & Affiliates CREATE TABLE IF NOT EXISTS user_referrals ( user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, referral_code TEXT UNIQUE NOT NULL, referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, total_referred INT DEFAULT 0, pending_rewards NUMERIC DEFAULT 0, earned_rewards NUMERIC DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- Note: Ensure Row Level Security (RLS) is enabled and policies are created if clients access these directly via Supabase JS. -- (If accessed only via your NestJS backend, standard service_role privileges apply).