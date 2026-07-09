-- Add edit_history column to comments table to store previous versions
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]';

-- Add updated_at if not present (sometimes missing in basic tables)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for auto-updating updated_at
CREATE TRIGGER trg_comments_updated 
BEFORE UPDATE ON public.comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON COLUMN public.comments.edit_history IS 'Stores an array of previous versions: {text, edited_at}';
