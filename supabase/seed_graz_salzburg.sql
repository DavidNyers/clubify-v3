-- ============================================
-- CLUBIFY V3 — Graz & Salzburg Seed Data
-- Run AFTER seed.sql + seed_more_venues.sql
-- ============================================


-- ============================================
-- GRAZ CLUBS
-- ============================================
INSERT INTO public.clubs (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, music_genres, status, featured) VALUES

  ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002',
   'Postgarage', 'postgarage-graz',
   'Graz'' bekanntester Club in einer ehemaligen Postgarage. Techno, House und Live-Konzerte.',
   'Dreihackengasse 42', 'Graz', 47.0617, 15.4453, 1200, 2,
   ARRAY['Techno', 'House', 'Indie', 'Rock'], 'published', true),

  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002',
   'Sub Club Graz', 'sub-club-graz',
   'Underground Club im Keller. Minimale Techno-Nächte mit internationalem Booking.',
   'Jakoministraße 22', 'Graz', 47.0683, 15.4394, 400, 2,
   ARRAY['Techno', 'Minimal', 'Dark Techno'], 'published', true),

  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002',
   'HDA Club Night', 'hda-club-night-graz',
   'Kulturelles Zentrum das regelmäßig zu Club Nights öffnet. Architektur trifft Musik.',
   'Mariahilferstraße 2', 'Graz', 47.0707, 15.4402, 350, 3,
   ARRAY['Electronic', 'Ambient', 'Experimental'], 'published', false),

  ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000002',
   'Explosiv Club', 'explosiv-club-graz',
   'Heavy Metal und Rock Venue in Graz. Hartes Lineup, treues Stammpublikum.',
   'Keplerstraße 45', 'Graz', 47.0648, 15.4512, 500, 2,
   ARRAY['Metal', 'Rock', 'Punk', 'Hardcore'], 'published', false),

  ('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000002',
   'Orpheum Graz', 'orpheum-graz',
   'Multikulturelles Veranstaltungszentrum mit Club-Nächten, Konzerten und Shows.',
   'Orpheumgasse 8', 'Graz', 47.0578, 15.4441, 1500, 3,
   ARRAY['Various', 'Electronic', 'Hip-Hop', 'R&B'], 'published', true),

  ('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000002',
   'P.P.C. Club', 'ppc-club-graz',
   'Kleiner aber feiner Underground Club in Graz mit Fokus auf lokale DJs.',
   'Annenstraße 17', 'Graz', 47.0669, 15.4388, 200, 1,
   ARRAY['House', 'Disco', 'Funk'], 'published', false)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- GRAZ BARS
-- ============================================
INSERT INTO public.bars (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, status, featured) VALUES

  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000003',
   'Tribeka Bar', 'tribeka-bar-graz',
   'Stylische Cocktailbar im Grazer Univiertel. Hipster-Vibe und handgemixte Drinks.',
   'Zinzendorfgasse 28', 'Graz', 47.0702, 15.4514, 90, 3, 'published', true),

  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000003',
   'Café Mitte', 'cafe-mitte-graz',
   'Beliebtestes Café im Grazer Zentrum. Tagsüber Frühstück, abends Bar.',
   'Paradeisgasse 1', 'Graz', 47.0716, 15.4381, 120, 2, 'published', true),

  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000003',
   'Aiola Upstairs', 'aiola-upstairs-graz',
   'Rooftop-Bar auf dem Schlossberg mit Panoramablick über Graz. Premium.',
   'Schlossberg 2', 'Graz', 47.0742, 15.4378, 200, 4, 'published', true),

  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000003',
   'Promenade Bar', 'promenade-bar-graz',
   'Gemütliche Bar an der Grazer Promenade. Weine aus der Steiermark im Fokus.',
   'Kaiser-Franz-Josef-Kai 26', 'Graz', 47.0665, 15.4381, 80, 3, 'published', false),

  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000003',
   'M1 Bar', 'm1-bar-graz',
   'Studentenbar mit günstigem Bier und lockerer Atmosphäre in Uni-Nähe.',
   'Heinrichstraße 36', 'Graz', 47.0758, 15.4509, 70, 1, 'published', false)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- GRAZ EVENTS
-- ============================================
INSERT INTO public.events (id, club_id, manager_id, name, slug, description, date, doors_open, max_guests, ticket_price, currency, lineup, genre, status, featured) VALUES

  ('30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000004',
   'Postgarage: Frühjahrsfest', 'postgarage-fruehjahrsfest-2026',
   'Das jährliche Frühlingsfest der Postgarage. 4 Floors, 1000 Leute, pure Energie.',
   '2026-09-12 22:00:00+02', '2026-09-12 21:00:00+02', 1000, 22.00, 'EUR',
   ARRAY['Roman Flügel', 'Dj Koze', 'Graz Local Soundsystem'], ARRAY['House', 'Disco', 'Electronic'],
   'published', true),

  ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000004',
   'Sub Club: Dark Matter', 'sub-club-dark-matter-graz',
   'Eine Nacht tief im Untergrund. Dunkle Sounds, dunklere Vibes.',
   '2026-10-03 00:00:00+02', '2026-10-02 23:00:00+02', 350, 15.00, 'EUR',
   ARRAY['Terence Fixmer', 'Varg', 'SPFDJ'], ARRAY['Dark Techno', 'EBM', 'Industrial'],
   'published', false),

  ('30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000004',
   'P.P.C. Disco Night', 'ppc-disco-night-graz',
   'Funky Disco & House Night im kleinsten aber feinsten Club in Graz.',
   '2026-08-29 22:00:00+02', '2026-08-29 21:30:00+02', 150, 8.00, 'EUR',
   ARRAY['DJ Seinfeld', 'Mall Grab', 'Local DJ'], ARRAY['Disco', 'Funk', 'House'],
   'published', true),

  ('30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000004',
   'Orpheum: Hip-Hop Jam Session', 'orpheum-hip-hop-jam-graz',
   'Live Rap-Battle, DJ Sets und Open Mic Nacht im Orpheum Graz.',
   '2026-09-19 20:00:00+02', '2026-09-19 19:30:00+02', 800, 12.00, 'EUR',
   ARRAY['Yung Hurn', 'Crack Ignaz', 'Local MCs'], ARRAY['Hip-Hop', 'Rap', 'R&B'],
   'published', true)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- SALZBURG CLUBS
-- ============================================
INSERT INTO public.clubs (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, music_genres, status, featured) VALUES

  ('10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002',
   'Rockhouse Salzburg', 'rockhouse-salzburg',
   'Das Zentrum der Salzburger Clubszene. Rock, Metal, Alternative und mehr seit 1993.',
   'Schallmooser Hauptstraße 46', 'Salzburg', 47.8027, 13.0532, 1000, 2,
   ARRAY['Rock', 'Metal', 'Alternative', 'Punk'], 'published', true),

  ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002',
   'Oval Club Salzburg', 'oval-club-salzburg',
   'Moderner Techno-Club in Salzburg mit ausgezeichnetem Soundsystem.',
   'Neutorstraße 4', 'Salzburg', 47.7998, 13.0421, 600, 3,
   ARRAY['Techno', 'House', 'Electronic'], 'published', true),

  ('10000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000002',
   'Mark Salzburg', 'mark-club-salzburg',
   'Junger Underground Club in der Salzburger Altstadt-Nähe. Fokus auf lokale Acts.',
   'Franz-Josef-Straße 8', 'Salzburg', 47.8021, 13.0448, 300, 2,
   ARRAY['Indie', 'Electronic', 'Alternative'], 'published', false),

  ('10000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000002',
   'Vis-à-Vis Club', 'vis-a-vis-club-salzburg',
   'Klassische Salzburger Club-Institution. House und R&B am Wochenende.',
   'Wolf-Dietrich-Straße 4', 'Salzburg', 47.8049, 13.0439, 500, 3,
   ARRAY['House', 'R&B', 'Pop'], 'published', true),

  ('10000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000002',
   'Kulturgelände Nonntal', 'kulturgelande-nonntal-salzburg',
   'Alternativer Veranstaltungsort im Süden der Stadt. Open-Air im Sommer.',
   'Nonnberggasse 2', 'Salzburg', 47.7944, 13.0482, 800, 2,
   ARRAY['Various', 'Indie', 'Electronic', 'World Music'], 'published', false)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- SALZBURG BARS
-- ============================================
INSERT INTO public.bars (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, status, featured) VALUES

  ('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000003',
   'Augustiner Bräustübl', 'augustiner-braustuebl-salzburg',
   'Legendäre Kloster-Brauerei mit Biergarten. Das Salzburger Original seit 1621.',
   'Lindhofstraße 7', 'Salzburg', 47.7997, 13.0365, 1400, 1, 'published', true),

  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003',
   'Humboldt Bar', 'humboldt-bar-salzburg',
   'Stylische Bar im Zentrum von Salzburg. Craft-Cocktails und gute Musik.',
   'Gstättengasse 4', 'Salzburg', 47.8012, 13.0416, 80, 3, 'published', true),

  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000003',
   'Unikum Sky Bar', 'unikum-sky-bar-salzburg',
   'Dachterrassenbar der Uni Salzburg mit Alpenblick. Studentenpreise.',
   'Kapitelgasse 4-6', 'Salzburg', 47.7982, 13.0457, 150, 2, 'published', true),

  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000003',
   'Café Bar Nachtschicht', 'nachtschicht-salzburg',
   'Die beliebteste Nachtbar der Studioszene. Gin Tonics und nachdenkliche Gespräche.',
   'Karolingerstraße 1', 'Salzburg', 47.8065, 13.0402, 100, 2, 'published', false),

  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000003',
   'Republic Café Bar', 'republic-cafe-bar-salzburg',
   'Multifunktionaler Treffpunkt direkt am Salzburger Hauptbahnhof. Immer geöffnet.',
   'Anton-Neumayr-Platz 2', 'Salzburg', 47.8016, 13.0408, 200, 2, 'published', true)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- SALZBURG EVENTS
-- ============================================
INSERT INTO public.events (id, club_id, manager_id, name, slug, description, date, doors_open, max_guests, ticket_price, currency, lineup, genre, status, featured) VALUES

  ('30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000004',
   'Rockhouse: Best of Metal Night', 'rockhouse-metal-night-2026',
   'Alles was zählt: der härteste Metalabend des Jahres im Rockhouse Salzburg.',
   '2026-09-05 20:00:00+02', '2026-09-05 19:30:00+02', 800, 18.00, 'EUR',
   ARRAY['Parkway Drive', 'Architects', 'Local Support'], ARRAY['Metal', 'Metalcore', 'Rock'],
   'published', true),

  ('30000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000004',
   'Oval Techno Night', 'oval-techno-night-salzburg-2026',
   'Internationales Techno-Booking trifft auf das beste Soundsystem der Stadt.',
   '2026-09-26 23:00:00+02', '2026-09-26 22:00:00+02', 500, 20.00, 'EUR',
   ARRAY['Drumcode Artists', 'Alan Fitzpatrick', 'Dense & Pika'], ARRAY['Techno', 'Techno'],
   'published', true),

  ('30000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000004',
   'Vis-à-Vis: Festival Pre-Party', 'vis-a-vis-festival-preparty-salzburg',
   'Die offizielle Vorparty zum Salzburger Festivals. R&B und House bis Sonnenaufgang.',
   '2026-08-01 23:00:00+02', '2026-08-01 22:00:00+02', 450, 15.00, 'EUR',
   ARRAY['Jayda G', 'DJ Koze'], ARRAY['House', 'Disco', 'R&B'],
   'published', false),

  ('30000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000004',
   'Kulturgelände Nonntal: Open Air Summer Finale', 'nonntal-open-air-finale-salzburg',
   'Das große Summer-Abschlussfest mit 3 Bühnen und lokalen Bands und DJs.',
   '2026-08-22 15:00:00+02', '2026-08-22 14:00:00+02', 700, 10.00, 'EUR',
   ARRAY['Local Artists Showcase', 'Graz DJ Collective', 'Experimental Acts'], ARRAY['Indie', 'Electronic', 'World Music'],
   'published', true),

  ('30000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000004',
   'Rockhouse: Indie & Alternative Night', 'rockhouse-indie-night-salzburg',
   'Indie- und Alternative-Rock-Night mit drei Live-Bands und anschließendem DJ-Set.',
   '2026-10-10 20:00:00+02', '2026-10-10 19:30:00+02', 600, 14.00, 'EUR',
   ARRAY['The Academic', 'Inhaler', 'Local Band'], ARRAY['Indie', 'Alternative', 'Rock'],
   'published', false)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- HAPPY HOURS for Graz & Salzburg bars
-- ============================================
INSERT INTO public.happy_hours (bar_id, day_of_week, start_time, end_time, discount_percent, description, active) VALUES
  ('20000000-0000-0000-0000-000000000020', ARRAY[1,2,3,4], '17:00', '19:00', 20, 'Cocktail Happy Hour', true),
  ('20000000-0000-0000-0000-000000000022', ARRAY[1,2,3,4,5], '12:00', '14:00', 30, 'Mittagsdrink um 30% günstiger', true),
  ('20000000-0000-0000-0000-000000000030', ARRAY[1,2,3,4,5,6,7], '11:00', '23:00', 10, 'Immer günstig – Kloster-Preis', true),
  ('20000000-0000-0000-0000-000000000031', ARRAY[3,4,5], '18:00', '20:00', 25, 'Cocktail Hour im Humboldt', true),
  ('20000000-0000-0000-0000-000000000032', ARRAY[1,2,3,4,5], '11:00', '15:00', 35, 'Studentenrabatt auf alles', true)
ON CONFLICT DO NOTHING;


-- ============================================
-- REVIEWS for Graz & Salzburg
-- ============================================
INSERT INTO public.reviews (user_id, club_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000020', 5, 'Postgarage ist einfach der beste Club außerhalb von Wien! Riesige Anlage, tolle Atmosphäre.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000030', 5, 'Rockhouse Salzburg – das Mekka für Rockfans! Cosy, laut, perfekt.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000031', 4, 'Oval hat ein brutales Soundsystem. Für Techno-Fans in Salzburg Pflichtprogramm.', 'visible')
ON CONFLICT DO NOTHING;

INSERT INTO public.reviews (user_id, bar_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000022', 5, 'Aiola Upstairs in Graz – der Ausblick ist unbeschreiblich. Perfekt für den Sundowner!', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000030', 5, 'Augustiner Bräustübl ist ein Muss für jeden Salzburg-Besucher. Günstig, lecker, historisch.', 'visible')
ON CONFLICT DO NOTHING;


-- ============================================
-- CLUBIFY V3 — AUTO GENERATED IMAGE UPDATES
-- ============================================
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000020';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000021';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000022';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000023';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000024';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000025';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1489641499593-b54144a3b01a?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000030';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000031';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000032';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000033';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000034';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000020';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000021';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000022';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000023';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1497644083578-611b798c60f3?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000024';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000030';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000031';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000032';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000033';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000034';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000020';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000021';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000022';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000023';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000030';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000031';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1489641499593-b54144a3b01a?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000032';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000033';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000034';
