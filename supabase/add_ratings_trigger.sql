-- ============================================
-- SQL to run in Supabase SQL Editor
-- Creates the ratings sync trigger and updates all existing records
-- ============================================

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION public.update_venue_rating_cache()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_bar_id UUID;
  v_event_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_club_id := OLD.club_id;
    v_bar_id := OLD.bar_id;
    v_event_id := OLD.event_id;
  ELSE
    v_club_id := NEW.club_id;
    v_bar_id := NEW.bar_id;
    v_event_id := NEW.event_id;
  END IF;

  IF v_club_id IS NOT NULL THEN
    UPDATE public.clubs
    SET 
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE club_id = v_club_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE club_id = v_club_id AND status = 'visible'), 0)
    WHERE id = v_club_id;
  END IF;

  IF v_bar_id IS NOT NULL THEN
    UPDATE public.bars
    SET 
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE bar_id = v_bar_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE bar_id = v_bar_id AND status = 'visible'), 0)
    WHERE id = v_bar_id;
  END IF;

  IF v_event_id IS NOT NULL THEN
    UPDATE public.events
    SET 
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE event_id = v_event_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE event_id = v_event_id AND status = 'visible'), 0)
    WHERE id = v_event_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists and create it
DROP TRIGGER IF EXISTS trg_reviews_rating_cache ON public.reviews;

CREATE TRIGGER trg_reviews_rating_cache
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating_cache();

-- 3. Update existing records in clubs, bars and events
UPDATE public.clubs c
SET 
  avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE club_id = c.id AND status = 'visible'), 0),
  review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE club_id = c.id AND status = 'visible'), 0);

UPDATE public.bars b
SET 
  avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE bar_id = b.id AND status = 'visible'), 0),
  review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE bar_id = b.id AND status = 'visible'), 0);

UPDATE public.events e
SET 
  avg_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE event_id = e.id AND status = 'visible'), 0),
  review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE event_id = e.id AND status = 'visible'), 0);
