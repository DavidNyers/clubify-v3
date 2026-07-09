-- Add edit_history column to reviews table to store previous versions
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]';

-- Optional: Add a comment explaining the structure
COMMENT ON COLUMN public.reviews.edit_history IS 'Stores an array of previous versions: {rating, text, edited_at}';
