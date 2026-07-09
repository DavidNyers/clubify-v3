-- ============================================
-- COMMENT LIKES & INTERACTIONS
-- ============================================

-- Add likes column to comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;

-- Create comment_likes join table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- RPC for incrementing
CREATE OR REPLACE FUNCTION public.increment_comment_likes(cid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.comments
  SET likes = likes + 1
  WHERE id = cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for decrementing
CREATE OR REPLACE FUNCTION public.decrement_comment_likes(cid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.comments
  SET likes = likes - 1
  WHERE id = cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_likes_user_own" ON public.comment_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "comment_likes_public_read" ON public.comment_likes
  FOR SELECT USING (true);
