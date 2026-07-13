-- ============================================
-- CLUBIFY V3 — Supabase Database Schema
-- Run in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'admin', 'moderator', 'club_owner', 'bar_owner',
  'event_manager', 'bouncer', 'user'
);

CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'expired', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE venue_status AS ENUM ('draft', 'published', 'suspended');
CREATE TYPE content_status AS ENUM ('visible', 'hidden', 'flagged');
CREATE TYPE report_status AS ENUM ('open', 'resolved', 'dismissed');

-- ============================================
-- USERS (extends auth.users)
-- ============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  gender TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'de',
  theme TEXT DEFAULT 'dark',
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  last_ip TEXT,
  last_location TEXT,
  last_os TEXT,
  last_browser TEXT,
  last_device TEXT,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLUBS
-- ============================================

CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'AT',
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  capacity INT,
  images TEXT[] DEFAULT '{}',
  opening_hours JSONB DEFAULT '{}',
  price_range INT CHECK (price_range BETWEEN 1 AND 4),
  music_genres TEXT[] DEFAULT '{}',
  dress_code TEXT,
  website TEXT,
  instagram TEXT,
  phone TEXT,
  status venue_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BARS
-- ============================================

CREATE TABLE public.bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'AT',
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  capacity INT,
  images TEXT[] DEFAULT '{}',
  opening_hours JSONB DEFAULT '{}',
  price_range INT CHECK (price_range BETWEEN 1 AND 4),
  drink_types TEXT[] DEFAULT '{}',
  website TEXT,
  instagram TEXT,
  phone TEXT,
  status venue_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HAPPY HOURS
-- ============================================

CREATE TABLE public.happy_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE,
  day_of_week INT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  discount_percent INT CHECK (discount_percent BETWEEN 1 AND 100),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  bar_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  doors_open TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_guests INT,
  tickets_sold INT DEFAULT 0,
  ticket_price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  images TEXT[] DEFAULT '{}',
  lineup TEXT[] DEFAULT '{}',
  genre TEXT[] DEFAULT '{}',
  age_restriction INT DEFAULT 18,
  dress_code TEXT,
  status venue_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  google_calendar_event_id TEXT,
  view_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOUNCER ASSIGNMENTS
-- ============================================

CREATE TABLE public.bouncer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bouncer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bouncer_id, event_id)
);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  bar_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  guests INT DEFAULT 1 CHECK (guests > 0),
  status booking_status DEFAULT 'pending',
  notes TEXT,
  reservation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TICKETS
-- ============================================

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  qr_payload TEXT NOT NULL,
  status ticket_status DEFAULT 'valid',
  seat_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ
);

-- ============================================
-- CHECK-INS
-- ============================================

CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  bouncer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT,
  ip_address TEXT,
  note TEXT
);

-- ============================================
-- FAVORITES
-- ============================================

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_target CHECK (
    (club_id IS NOT NULL)::INT +
    (bar_id IS NOT NULL)::INT +
    (event_id IS NOT NULL)::INT = 1
  ),
  UNIQUE NULLS NOT DISTINCT (user_id, club_id, bar_id, event_id)
);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  likes INT DEFAULT 0,
  status content_status DEFAULT 'visible',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_subject CHECK (
    (club_id IS NOT NULL)::INT +
    (bar_id IS NOT NULL)::INT +
    (event_id IS NOT NULL)::INT = 1
  )
);

-- ============================================
-- COMMENTS
-- ============================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status content_status DEFAULT 'visible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEW LIKES
-- ============================================

CREATE TABLE public.review_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, review_id)
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status payment_status DEFAULT 'pending',
  refunded BOOLEAN DEFAULT FALSE,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WAITLIST
-- ============================================

CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  position INT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('review','comment','club','bar','event','user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status report_status DEFAULT 'open',
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FRAUD LOGS
-- ============================================

CREATE TABLE public.fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  attempted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT,
  ip_address TEXT,
  reason TEXT NOT NULL
);

-- ============================================
-- PAGE VIEWS (Analytics)
-- ============================================

CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('club','bar','event')),
  target_id UUID NOT NULL,
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_clubs_city ON public.clubs(city);
CREATE INDEX idx_clubs_status ON public.clubs(status);
CREATE INDEX idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX idx_clubs_slug ON public.clubs(slug);

CREATE INDEX idx_bars_city ON public.bars(city);
CREATE INDEX idx_bars_status ON public.bars(status);
CREATE INDEX idx_bars_owner ON public.bars(owner_id);
CREATE INDEX idx_bars_slug ON public.bars(slug);

CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_club ON public.events(club_id);
CREATE INDEX idx_events_slug ON public.events(slug);

CREATE INDEX idx_tickets_uuid ON public.tickets(ticket_uuid);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);

CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX idx_page_views_target ON public.page_views(target_type, target_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clubs_updated BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bars_updated BEFORE UPDATE ON public.bars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: new auth.user → insert into public.users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTION: is_admin()
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role::TEXT FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: auto-calculate average ratings & review counts on reviews CRUD
-- ============================================

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
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.reviews WHERE club_id = v_club_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE club_id = v_club_id AND status = 'visible'), 0)
    WHERE id = v_club_id;
  END IF;

  IF v_bar_id IS NOT NULL THEN
    UPDATE public.bars
    SET 
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.reviews WHERE bar_id = v_bar_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE bar_id = v_bar_id AND status = 'visible'), 0)
    WHERE id = v_bar_id;
  END IF;

  IF v_event_id IS NOT NULL THEN
    UPDATE public.events
    SET 
      avg_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.reviews WHERE event_id = v_event_id AND status = 'visible'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE event_id = v_event_id AND status = 'visible'), 0)
    WHERE id = v_event_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reviews_rating_cache
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating_cache();

