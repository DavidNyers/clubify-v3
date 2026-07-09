-- ============================================
-- VENUE VERIFICATION STATUS FÜR EVENTS
-- ============================================

CREATE TYPE public.event_venue_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.events 
ADD COLUMN venue_verification_status event_venue_status DEFAULT 'pending';

-- Wenn das Event keinem expliziten Club/Bar zugewiesen ist, ist der status irrelevant
COMMENT ON COLUMN public.events.venue_verification_status IS 'Tracks whether the club/bar owner has approved hosting this event. Defaults to pending.';
