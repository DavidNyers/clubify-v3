-- Allow public to read venues and venue_tables for reservation purposes
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
CREATE POLICY "Venues are viewable by everyone" ON public.venues
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Venue tables are viewable by everyone" ON public.venue_tables;
CREATE POLICY "Venue tables are viewable by everyone" ON public.venue_tables
    FOR SELECT USING (true);

-- Also ensure venue_zones are viewable since the UI might need them
ALTER TABLE public.venue_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Venue zones are viewable by everyone" ON public.venue_zones;
CREATE POLICY "Venue zones are viewable by everyone" ON public.venue_zones
    FOR SELECT USING (true);
