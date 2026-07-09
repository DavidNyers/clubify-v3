-- 0. Ensure venue_zones table exists
CREATE TABLE IF NOT EXISTS public.venue_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ec4899', -- Pink default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(venue_id, name)
);

-- 1. Add zone_id column to venue_tables
ALTER TABLE public.venue_tables ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.venue_zones(id) ON DELETE SET NULL;

-- 2. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_venue_zones_venue ON public.venue_zones(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_tables_zone_id ON public.venue_tables(zone_id);

-- 3. Migration logic: Seed initial zones from existing text-based zones
-- First, ensure all unique venue/zone pairs exist in venue_zones
INSERT INTO public.venue_zones (venue_id, name)
SELECT DISTINCT venue_id, zone 
FROM public.venue_tables
WHERE zone IS NOT NULL
ON CONFLICT (venue_id, name) DO NOTHING;

-- Second, update venue_tables to link to the new IDs
UPDATE public.venue_tables
SET zone_id = vz.id
FROM public.venue_zones vz
WHERE public.venue_tables.venue_id = vz.venue_id 
  AND public.venue_tables.zone = vz.name
  AND public.venue_tables.zone_id IS NULL;

-- 4. Set RLS for zones
ALTER TABLE public.venue_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venue owners can manage their zones" ON public.venue_zones;
CREATE POLICY "Venue owners can manage their zones" ON public.venue_zones
    FOR ALL USING (true); -- Placeholder logic
