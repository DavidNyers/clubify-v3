-- Add is_waitlist flag to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS is_waitlist BOOLEAN DEFAULT false;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_reservations_is_waitlist ON public.reservations(is_waitlist);

COMMENT ON COLUMN public.reservations.is_waitlist IS 'True if the reservation is on the waitlist because the venue was full.';
