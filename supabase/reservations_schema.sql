-- Reservations Schema for Bar & Club Owners

-- 1. Table Definitions
CREATE TABLE IF NOT EXISTS public.venue_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    venue_type TEXT NOT NULL CHECK (venue_type IN ('bar', 'club')),
    label TEXT NOT NULL, -- e.g. "Tisch 1", "VIP 5"
    capacity INTEGER NOT NULL DEFAULT 4,
    zone TEXT NOT NULL DEFAULT 'Main', -- e.g. "Bar", "Lounge", "Terrace"
    position_x INTEGER DEFAULT 0, -- Percentage-based position for visual mapping
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 60,
    height INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    venue_type TEXT NOT NULL CHECK (venue_type IN ('bar', 'club')),
    user_id UUID REFERENCES auth.users(id), -- Nullable for staff-added walk-ins
    table_id UUID REFERENCES public.venue_tables(id) ON DELETE SET NULL,
    reserved_date DATE NOT NULL,
    reserved_time TIME NOT NULL,
    guest_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'seated', 'completed', 'no_show', 'expired')),
    source TEXT DEFAULT 'app', -- 'app', 'google', 'walk-in'
    duration_minutes INTEGER DEFAULT 120, -- Default 2 hours
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_tables_venue ON public.venue_tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_reservations_venue_date ON public.reservations(venue_id, reserved_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- 4. RLS (Row Level Security)
ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Simple policies (assumes owners can see their own data)
-- Note: In a production environment, we'd join with bar/club owners tables
DROP POLICY IF EXISTS "Venue owners can manage their tables" ON public.venue_tables;
CREATE POLICY "Venue owners can manage their tables" ON public.venue_tables
    FOR ALL USING (true); -- Placeholder: Logic to check if user owns venue

DROP POLICY IF EXISTS "Venue owners can manage their reservations" ON public.reservations;
CREATE POLICY "Venue owners can manage their reservations" ON public.reservations
    FOR ALL USING (true); -- Placeholder: Logic to check if user owns venue
