-- Table Packages (Bottle Service & VIP Offers)
CREATE TABLE public.table_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  min_guests INT DEFAULT 1,
  max_guests INT,
  items TEXT[] DEFAULT '{}', -- e.g. ['1.5L Belvedere', 'Premium Mixers']
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expansion of Bookings to support Table Reservations
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.table_packages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reservation_time TEXT, -- e.g. "23:30"
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'ticket' CHECK (booking_type IN ('ticket', 'table', 'vip'));

-- Trigger for updated_at on table_packages
CREATE TRIGGER trg_table_packages_updated 
BEFORE UPDATE ON public.table_packages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for table_packages
ALTER TABLE public.table_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vip packages are viewable by everyone" 
ON public.table_packages FOR SELECT USING (status = 'active');

CREATE POLICY "Club owners can manage their own packages" 
ON public.table_packages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.clubs 
    WHERE id = table_packages.club_id AND owner_id = auth.uid()
  )
);

COMMENT ON TABLE public.table_packages IS 'Stores bottle service and table packages offered by specific clubs.';
