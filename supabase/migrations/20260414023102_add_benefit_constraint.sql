-- Add Unique Constraint to alliance_venue_benefits to enable proper upsert
-- This ensures one benefit type per venue (Idempotent upsert)
ALTER TABLE public.alliance_venue_benefits 
ADD CONSTRAINT venue_benefit_unique UNIQUE (target_type, target_id, benefit_type_id);
