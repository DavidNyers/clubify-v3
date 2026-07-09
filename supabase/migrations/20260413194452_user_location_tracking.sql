-- Add location and activity tracking to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS last_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Index for spatial queries if needed later
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users (last_lat, last_lng);
