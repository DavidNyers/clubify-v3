-- ============================================
-- VENUE APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.venue_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    venue_name TEXT NOT NULL,
    venue_type TEXT NOT NULL CHECK (venue_type IN ('club', 'bar', 'organizer')),
    website_url TEXT,
    social_media_url TEXT,
    location_address TEXT,
    location_city TEXT,
    capacity_info TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.venue_applications ENABLE ROW LEVEL SECURITY;

-- Users can see their own applications
CREATE POLICY "Users can view own applications" ON public.venue_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can create own applications" ON public.venue_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins have full access to applications" ON public.venue_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venue_applications_updated_at
BEFORE UPDATE ON public.venue_applications
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
