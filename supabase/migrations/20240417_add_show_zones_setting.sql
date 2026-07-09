-- Add show_zones setting to venues
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS show_zones BOOLEAN DEFAULT TRUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS show_zones BOOLEAN DEFAULT TRUE;

-- Update existing records just in case
UPDATE public.bars SET show_zones = TRUE WHERE show_zones IS NULL;
UPDATE public.clubs SET show_zones = TRUE WHERE show_zones IS NULL;
