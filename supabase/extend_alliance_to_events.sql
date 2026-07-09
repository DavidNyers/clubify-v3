-- ============================================
-- EXTEND ALLIANCE TO EVENTS
-- ============================================

-- 1. Update alliance_venue_settings
ALTER TABLE public.alliance_venue_settings 
DROP CONSTRAINT IF EXISTS alliance_venue_settings_target_type_check;

ALTER TABLE public.alliance_venue_settings 
ADD CONSTRAINT alliance_venue_settings_target_type_check 
CHECK (target_type IN ('club', 'bar', 'event'));

-- 2. Update alliance_venue_benefits
ALTER TABLE public.alliance_venue_benefits 
DROP CONSTRAINT IF EXISTS alliance_venue_benefits_target_type_check;

ALTER TABLE public.alliance_venue_benefits 
ADD CONSTRAINT alliance_venue_benefits_target_type_check 
CHECK (target_type IN ('club', 'bar', 'event'));

-- 3. Update alliance_redemptions
ALTER TABLE public.alliance_redemptions 
DROP CONSTRAINT IF EXISTS alliance_redemptions_target_type_check;

ALTER TABLE public.alliance_redemptions 
ADD CONSTRAINT alliance_redemptions_target_type_check 
CHECK (target_type IN ('club', 'bar', 'event'));

-- 4. Update alliance_venue_payouts
ALTER TABLE public.alliance_venue_payouts 
DROP CONSTRAINT IF EXISTS alliance_venue_payouts_target_type_check;

ALTER TABLE public.alliance_venue_payouts 
ADD CONSTRAINT alliance_venue_payouts_target_type_check 
CHECK (target_type IN ('club', 'bar', 'event'));
