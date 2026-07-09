-- ============================================
-- CLUBIFY ALLIANCE — Subscription & Revenue Share
-- ============================================

-- 1. Alliance Status Enum
DO $$ BEGIN
    CREATE TYPE alliance_tier_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend Users for Alliance tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS alliance_tier TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS alliance_status alliance_tier_status DEFAULT 'canceled',
ADD COLUMN IF NOT EXISTS alliance_expiration TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS alliance_joined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_alliance_gifted BOOLEAN DEFAULT FALSE;

-- 3. Alliance Benefit Types (Standard Points)
CREATE TABLE IF NOT EXISTS public.alliance_benefit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, 
  description TEXT,
  base_points INT NOT NULL DEFAULT 10,
  category TEXT CHECK (category IN ('entry', 'drink', 'discount', 'other')),
  estimated_retail_value DECIMAL(10,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alliance_benefit_types ADD COLUMN IF NOT EXISTS estimated_retail_value DECIMAL(10,2) DEFAULT 5.00;

-- Ensure UNIQUE constraint exists even if table was created before
DO $$ BEGIN
    -- Clean up existing duplicates and non-month-start dates
    DELETE FROM public.alliance_monthly_settlements 
    WHERE id NOT IN (
        SELECT id FROM public.alliance_monthly_settlements 
        WHERE EXTRACT(DAY FROM month_start) = 1
    );

    ALTER TABLE public.alliance_benefit_types ADD CONSTRAINT alliance_benefit_types_name_key UNIQUE (name);
EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Seed Standard Values as requested
-- We use DO UPDATE to ensure existing ones aren't duplicated and points stay synced
INSERT INTO public.alliance_benefit_types (name, description, base_points, category, estimated_retail_value)
VALUES 
  ('Freier Eintritt', 'Gilt für den Standard-Eintritt ohne Sonderevents', 20, 'entry', 15.00),
  ('Gratis Shot', 'Ein Begrüßungs-Shot nach Wahl des Hauses', 5, 'drink', 4.00),
  ('Gratis Longdrink', 'Ein Standard-Longdrink (z.B. Gin Tonic)', 12, 'drink', 10.00),
  ('10% Rabatt', 'Rabatt auf die gesamte Rechnung an der Bar', 3, 'discount', 5.00),
  ('Fast Lane', 'Bevorzugter Einlass ohne langes Warten', 8, 'other', 5.00)
ON CONFLICT (name) 
DO UPDATE SET 
  description = EXCLUDED.description,
  base_points = EXCLUDED.base_points,
  category = EXCLUDED.category,
  estimated_retail_value = EXCLUDED.estimated_retail_value;

-- 4. Venue Alliance Settings
CREATE TABLE IF NOT EXISTS public.alliance_venue_settings (
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'bar', 'event')),
  target_id UUID NOT NULL,
  is_alliance_active BOOLEAN DEFAULT FALSE,
  custom_point_multiplier DECIMAL(3,2) DEFAULT 1.0, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (target_type, target_id)
);

-- 5. Active Benefits per Venue
CREATE TABLE IF NOT EXISTS public.alliance_venue_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'bar', 'event')),
  target_id UUID NOT NULL,
  benefit_type_id UUID REFERENCES public.alliance_benefit_types(id) ON DELETE CASCADE,
  required_tier INT NOT NULL DEFAULT 1, -- 1: Explorer, 2: Premium, 3: Elite
  is_active BOOLEAN DEFAULT TRUE,
  custom_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure required_tier exists if table was created before
ALTER TABLE public.alliance_venue_benefits ADD COLUMN IF NOT EXISTS required_tier INT NOT NULL DEFAULT 1;

-- 6. Alliance Redemptions (Scanner verified)
CREATE TABLE IF NOT EXISTS public.alliance_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'bar', 'event')),
  target_id UUID NOT NULL,
  benefit_id UUID REFERENCES public.alliance_venue_benefits(id) ON DELETE SET NULL,
  points_awarded INT NOT NULL, 
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Monthly Alliance Settlement (80/20 Logic)
CREATE TABLE IF NOT EXISTS public.alliance_monthly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_start DATE NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL CHECK (total_revenue >= 0), -- 100%
  alliance_pool DECIMAL(12,2) NOT NULL CHECK (alliance_pool >= 0), -- 80%
  clubify_share DECIMAL(12,2) NOT NULL CHECK (clubify_share >= 0), -- 20%
  total_points_redeemed INT NOT NULL CHECK (total_points_redeemed >= 0),
  price_per_point DECIMAL(12,6) NOT NULL CHECK (price_per_point >= 0),
  status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated', 'payout_ready', 'completed')), 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month_start)
);

-- 8. Venue Payout Logs
CREATE TABLE IF NOT EXISTS public.alliance_venue_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID REFERENCES public.alliance_monthly_settlements(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'bar', 'event')),
  target_id UUID NOT NULL,
  points_redeemed INT NOT NULL CHECK (points_redeemed >= 0),
  amount_eur DECIMAL(12,2) NOT NULL CHECK (amount_eur >= 0),
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ
);
