-- Ensure public can read necessary reservation tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view venues" ON public.venues;
CREATE POLICY "Public can view venues" ON public.venues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view tables" ON public.venue_tables;
CREATE POLICY "Public can view tables" ON public.venue_tables
  FOR SELECT USING (true);
