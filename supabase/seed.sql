-- ============================================
-- CLUBIFY V3 — Seed Data (Demo)
-- Run AFTER schema.sql + rls.sql
-- ============================================

-- NOTE: Create these users in Supabase Auth first,
-- then run this seed. UUIDs below are placeholders.

-- Demo Users (update with real auth UUIDs after creation)
INSERT INTO public.users (id, email, role, full_name, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@clubify.app', 'admin', 'Admin User', NULL),
  ('00000000-0000-0000-0000-000000000002', 'owner@clubify.app', 'club_owner', 'Max Mustermann', NULL),
  ('00000000-0000-0000-0000-000000000003', 'barowner@clubify.app', 'bar_owner', 'Lisa Bar', NULL),
  ('00000000-0000-0000-0000-000000000004', 'manager@clubify.app', 'event_manager', 'Tom Events', NULL),
  ('00000000-0000-0000-0000-000000000005', 'bouncer@clubify.app', 'bouncer', 'Stefan Türsteher', NULL),
  ('00000000-0000-0000-0000-000000000006', 'user@clubify.app', 'user', 'Anna User', NULL),
  ('00000000-0000-0000-0000-000000000007', 'mod@clubify.app', 'moderator', 'Mo Derator', NULL)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- Demo Clubs
INSERT INTO public.clubs (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, music_genres, status, featured) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'Pratersauna', 'pratersauna',
   'Wiens bekanntester Club im Herzen des Praters. Techno & House auf 3 Floors.',
   'Waldsteingartenstraße 135', 'Wien', 48.2167, 16.3900, 1200, 3,
   ARRAY['Techno', 'House', 'Minimal'], 'published', true),

  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Grelle Forelle', 'grelle-forelle',
   'Underground Club direkt am Donaukanal – elektronische Musik pur.',
   'Spittelauer Lände 12', 'Wien', 48.2258, 16.3614, 800, 2,
   ARRAY['Techno', 'Industrial', 'EBM'], 'published', false),

  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
   'Berghain Vienna', 'berghain-vienna',
   'Das härteste Line-up der Stadt. Members only am Wochenende.',
   'Erdbergstraße 55', 'Wien', 48.2003, 16.3906, 500, 4,
   ARRAY['Techno', 'Dark Techno'], 'published', true)
ON CONFLICT (id) DO NOTHING;

-- Demo Bars
INSERT INTO public.bars (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, status, featured) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
   'Loos American Bar', 'loos-american-bar',
   'Ikone des Wiener Nachtlebens seit 1908. Cocktails nach Adolf Loos Design.',
   'Kärntner Durchgang 10', 'Wien', 48.2036, 16.3705, 50, 4, 'published', true),

  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003',
   'Titanic Bar', 'titanic-bar',
   'Gemütliche Bar mit riesiger Bierauswahl und Live-Musik.',
   'Theobaldgasse 11', 'Wien', 48.2012, 16.3601, 150, 2, 'published', false)
ON CONFLICT (id) DO NOTHING;

-- Happy Hours für Loos Bar
INSERT INTO public.happy_hours (bar_id, day_of_week, start_time, end_time, discount_percent, description, active) VALUES
  ('20000000-0000-0000-0000-000000000001', ARRAY[1,2,3,4], '17:00', '19:00', 30, '2 für 1 Cocktails', true),
  ('20000000-0000-0000-0000-000000000002', ARRAY[1,2,3,4,5], '16:00', '18:00', 25, 'Bier für €2,50', true)
ON CONFLICT DO NOTHING;

-- Demo Events
INSERT INTO public.events (id, club_id, manager_id, name, slug, description, date, doors_open, max_guests, ticket_price, currency, lineup, genre, status, featured) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
   'Techno Friday', 'techno-friday-2026',
   'Die härteste Techno-Nacht des Jahres! 6 DJs, 2 Floors, 8 Stunden pure Energie.',
   '2026-09-05 23:00:00+02', '2026-09-05 22:00:00+02', 500, 25.00, 'EUR',
   ARRAY['DJ Strobos', 'NNRec', 'Phase Fatale'], ARRAY['Techno', 'Dark Techno'],
   'published', true),

  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004',
   'House Nation', 'house-nation-2026',
   'House Music von Donnerstag auf Freitag – all night long.',
   '2026-09-12 23:00:00+02', '2026-09-12 22:00:00+02', 300, 15.00, 'EUR',
   ARRAY['Bicep (Live)', 'Mall Grab'], ARRAY['House', 'Deep House'],
   'published', false),

  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
   'Members Night Vol. 3', 'members-night-vol-3',
   'Exklusives Event für Members only. Anmeldung erforderlich.',
   '2025-09-20 00:00:00+02', '2025-09-19 23:00:00+02', 200, 35.00, 'EUR',
   ARRAY['Blawan', 'Surgeon'], ARRAY['Industrial Techno'],
   'published', true);

-- Bouncer Assignment
INSERT INTO public.bouncer_assignments (bouncer_id, event_id, assigned_by) VALUES
  ('00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004');

-- Demo Reviews
INSERT INTO public.reviews (user_id, club_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 5, 'Absolut legendär! Sound, Vibes, Crowd – perfekt. Werde definitiv wiederkommen.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 4, 'Toller Underground-Vibe, etwas beengt aber atmosph! risch toll.', 'visible');

INSERT INTO public.reviews (user_id, bar_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 5, 'Der schönste Raum Wiens. Cocktails sind teuer aber jeden Cent wert.', 'visible');

INSERT INTO public.reviews (user_id, event_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 5, 'Bestes Event das ich je erlebt habe. Phase Fatale war unglaublich!', 'visible');
