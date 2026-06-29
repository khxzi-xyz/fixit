-- Migration 0014: Enterprise Module Expansions
-- Modules: Disputes, Vouchers, High-Ticket Leads, Diagnostics, Junk Auctions

CREATE TABLE IF NOT EXISTS public.disputes (
    dispute_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES public.users(user_id),
    vendor_id UUID NOT NULL REFERENCES public.users(user_id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED_REFUND, RESOLVED_PAYOUT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.vouchers (
    voucher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_amount NUMERIC NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES public.users(user_id)
);

CREATE TABLE IF NOT EXISTS public.high_ticket_leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES public.users(user_id),
    item_category TEXT NOT NULL,
    estimated_value NUMERIC,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.diagnostics (
    diagnostic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(job_id),
    notes TEXT,
    fee NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.junk_auctions (
    auction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES public.users(user_id),
    description TEXT,
    starting_bid NUMERIC DEFAULT 0,
    highest_bid NUMERIC DEFAULT 0,
    highest_bidder UUID REFERENCES public.users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'ACTIVE'
);

-- Enable RLS (Placeholder definitions)
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.high_ticket_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.junk_auctions ENABLE ROW LEVEL SECURITY;

-- Note: RLS Policies should be restricted so Admin can read/write all, 
-- consumers/vendors can only see their own records.
