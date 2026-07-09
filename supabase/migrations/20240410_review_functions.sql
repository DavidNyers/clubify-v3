-- ============================================
-- REVIEW LIKE COUNTER HELPERS
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_review_likes(rid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reviews
  SET likes = likes + 1
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_review_likes(rid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reviews
  SET likes = likes - 1
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
