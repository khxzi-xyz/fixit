-- Add Premium columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

-- Add parent_id to categories for nested lookups
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id VARCHAR(40) REFERENCES categories(category_id);
-- Add ai_price_floor for anti-sabotage validation
ALTER TABLE categories ADD COLUMN IF NOT EXISTS ai_price_floor NUMERIC(10,3);

-- Platform Billing Ledger
CREATE TABLE IF NOT EXISTS platform_billing_ledger (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    order_id VARCHAR(100),
    amount NUMERIC(10,3) NOT NULL,
    description TEXT,
    new_balance NUMERIC(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Procedure to purchase stackable subscription plan
CREATE OR REPLACE FUNCTION purchase_subscription_plan(p_user_id UUID, p_plan_days INTEGER, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_expires TIMESTAMPTZ;
    v_new_expires TIMESTAMPTZ;
    v_new_balance NUMERIC;
BEGIN
    -- Check current expiry
    SELECT pro_expires_at INTO v_current_expires
    FROM users WHERE user_id = p_user_id;

    IF v_current_expires IS NULL OR v_current_expires < now() THEN
        v_new_expires := now() + (p_plan_days || ' days')::interval;
    ELSE
        -- Stack it
        v_new_expires := v_current_expires + (p_plan_days || ' days')::interval;
    END IF;

    UPDATE users 
    SET pro_expires_at = v_new_expires 
    WHERE user_id = p_user_id;

    -- Add to ledger
    INSERT INTO platform_billing_ledger (user_id, order_id, amount, description, new_balance)
    VALUES (p_user_id, 'PLAN_' || p_plan_days || 'D', p_amount, 'Purchased ' || p_plan_days || ' days Pro Plan', 0);
END;
$$;
