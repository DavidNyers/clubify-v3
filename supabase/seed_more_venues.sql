-- ============================================
-- CLUBIFY V3 — Extended Seed Data
-- More clubs, bars and events for Vienna
-- Run AFTER seed.sql
-- ============================================

-- ============================================
-- ADDITIONAL CLUBS
-- ============================================
INSERT INTO public.clubs (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, music_genres, status, featured) VALUES

  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002',
   'Flex', 'flex-club',
   'Kultclub direkt am Donaukanal. Elektronische Musik auf höchstem Niveau seit 1995.',
   'Augartenbrücke 1', 'Wien', 48.2230, 16.3640, 600, 2,
   ARRAY['Techno', 'House', 'Experimental'], 'published', true),

  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002',
   'WUK', 'wuk-club',
   'Alternatives Kulturzentrum mit Club, Konzerten und Kunstausstellungen.',
   'Währinger Straße 59', 'Wien', 48.2235, 16.3518, 900, 2,
   ARRAY['Alternative', 'Indie', 'Electronic'], 'published', false),

  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002',
   'Werk', 'werk-club',
   'Industrieller Club mit rohem Sound und unvergleichlichem Ambiente.',
   'Donaukanal, Spittelauer Lände 10', 'Wien', 48.2267, 16.3618, 400, 3,
   ARRAY['Techno', 'Industrial', 'Dark Techno'], 'published', true),

  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002',
   'Volksgarten Clubdisco', 'volksgarten-clubdisco',
   'Legendäre Location im Herzen der Wiener Innenstadt. R&B, Hip-Hop und mehr.',
   'Burgring 1', 'Wien', 48.2051, 16.3605, 1000, 3,
   ARRAY['R&B', 'Hip-Hop', 'Pop', 'House'], 'published', true),

  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002',
   'Fluc', 'fluc-club',
   'Underground Club am Praterstern für experimentelle Musik und alternative Szene.',
   'Praterstern 5', 'Wien', 48.2181, 16.3931, 300, 1,
   ARRAY['Experimental', 'Noise', 'Post-Punk'], 'published', false),

  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002',
   'Sass Club', 'sass-club',
   'Der eleganteste Club der Stadt – internationales Flair, exklusives Ambiente.',
   'Mahlerstraße 11', 'Wien', 48.2019, 16.3714, 700, 4,
   ARRAY['House', 'Deep House', 'R&B'], 'published', true),

  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002',
   'Fledermaus Club', 'fledermaus-club',
   'Historisches Gewölbe im Keller, entworfen von Josef Hoffmann. Minimale Techno-Nächte.',
   'Spiegelgasse 2', 'Wien', 48.2065, 16.3694, 250, 3,
   ARRAY['Techno', 'Minimal', 'Ambient'], 'published', false),

  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002',
   'Arena Wien', 'arena-wien',
   'Riesiger Komplex für Konzerte, Raves und Festivals. Open-Air im Sommer.',
   'Baumgasse 80', 'Wien', 48.1970, 16.4050, 5000, 2,
   ARRAY['Various', 'Techno', 'Metal', 'Punk', 'House'], 'published', true),

  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002',
   'B72', 'b72-club',
   'Cosy Club unter den U-Bahn-Bögen – Indie, Alternative und britischer Sound.',
   'Hernalser Gürtel 72', 'Wien', 48.2144, 16.3411, 250, 2,
   ARRAY['Indie', 'Alternative', 'Rock'], 'published', false),

  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002',
   'Chelsea Club', 'chelsea-club',
   'Beneath the U-Bahn – Live Musik, Club Nights und ein vertrautes Stammpublikum.',
   'Lerchenfelder Gürtel 29-31', 'Wien', 48.2101, 16.3428, 350, 2,
   ARRAY['Alternative', 'Punk', 'Electronic'], 'published', true)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- ADDITIONAL BARS
-- ============================================
INSERT INTO public.bars (id, owner_id, name, slug, description, address, city, lat, lng, capacity, price_range, status, featured) VALUES

  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   'Roxy Bar', 'roxy-bar',
   'Stylische Cocktailbar in der Nähe des Naschmarkts. DJ Sets am Wochenende.',
   'Faulmanngasse 4', 'Wien', 48.1978, 16.3610, 120, 3, 'published', true),

  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
   'Bar Italia', 'bar-italia',
   'Aperitivo-Kultur wie in Mailand. Die beste Negroni der Stadt seit 2009.',
   'Mariahilfer Straße 19', 'Wien', 48.2014, 16.3561, 80, 3, 'published', false),

  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003',
   'Vis-à-vis', 'vis-a-vis-bar',
   'Beliebte Studentenbar im 6. Bezirk. Günstige Drinks, gute Vibes.',
   'Windmühlgasse 20', 'Wien', 48.1965, 16.3577, 90, 1, 'published', true),

  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003',
   'Onyx Bar', 'onyx-bar',
   'Rooftop-Bar im Hotel Do & Co mit Blick auf den Stephansdom. Exklusiv.',
   'Stephansplatz 12', 'Wien', 48.2087, 16.3723, 200, 4, 'published', true),

  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003',
   'Würstelstand Leo', 'wurstelstand-leo',
   'Kultiger Würstelstand mit Bierbar. Das Wiener Original nach dem Clubbing.',
   'Naschmarkt Stand 74', 'Wien', 48.1988, 16.3635, 30, 1, 'published', false),

  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003',
   'Mango Bar', 'mango-bar',
   'LGBTQ+ freundliche Bar am Naschmarkt. Bunte Vibes, starke Drinks.',
   'Linke Wienzeile 100', 'Wien', 48.1974, 16.3612, 100, 2, 'published', true),

  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003',
   'Halbestadt', 'halbestadt-bar',
   'Gemütliche Stammkneipe in Ottakring. Bier vom Fass und Hausmannskost.',
   'Neulerchenfelder Straße 11', 'Wien', 48.2122, 16.3432, 70, 1, 'published', false),

  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003',
   'Café Schwarzenberg', 'cafe-schwarzenberg',
   'Eines der ältesten Kaffeehäuser Wiens – tagsüber Café, abends Bar.',
   'Kärntner Ring 17', 'Wien', 48.2024, 16.3742, 180, 4, 'published', true),

  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003',
   'Burgtheater Bar', 'burgtheater-bar',
   'Exklusive Bar direkt am Burgtheater. Hochprämierte Drinks nach Theaterstücken benannt.',
   'Dr.-Karl-Lueger-Ring 2', 'Wien', 48.2106, 16.3618, 60, 4, 'published', false),

  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003',
   'Espresso Bar', 'espresso-bar-wien',
   'Stylische Espresso-Bar im 7. Bezirk. Tagsüber Kaffee, abends Cocktails.',
   'Siebensterngasse 31', 'Wien', 48.2029, 16.3527, 55, 2, 'published', true)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- HAPPY HOURS for new bars
-- ============================================
INSERT INTO public.happy_hours (bar_id, day_of_week, start_time, end_time, discount_percent, description, active) VALUES
  ('20000000-0000-0000-0000-000000000003', ARRAY[4,5], '18:00', '20:00', 20, '20% auf alle Cocktails', true),
  ('20000000-0000-0000-0000-000000000005', ARRAY[1,2,3,4,5], '15:00', '18:00', 40, 'Bier für €1,90', true),
  ('20000000-0000-0000-0000-000000000008', ARRAY[5,6], '17:00', '19:00', 30, 'Cocktail-Duo – 2 für 1', true),
  ('20000000-0000-0000-0000-000000000012', ARRAY[1,2,3], '16:00', '18:00', 25, 'Espresso Martini um €6', true)
ON CONFLICT DO NOTHING;


-- ============================================
-- ADDITIONAL EVENTS
-- ============================================
INSERT INTO public.events (id, club_id, manager_id, name, slug, description, date, doors_open, max_guests, ticket_price, currency, lineup, genre, status, featured) VALUES

  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'Flex Opening Night', 'flex-opening-night-2026',
   'Das Saisonopening von Flex – die legendärste Partynacht am Donaukanal kehrt zurück.',
   '2026-09-19 23:00:00+02', '2026-09-19 22:00:00+02', 500, 18.00, 'EUR',
   ARRAY['Surgeon', 'Paula Temple', 'Rrose'], ARRAY['Techno', 'Industrial'],
   'published', true),

  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004',
   'Volksgarten Summer Closing', 'volksgarten-summer-closing-2026',
   'Die große Summer Closing Party im Volksgarten. Hip-Hop & R&B bis in die Morgenstunden.',
   '2026-09-26 22:00:00+02', '2026-09-26 21:00:00+02', 800, 22.00, 'EUR',
   ARRAY['DJ Snake', 'Kaytranada', 'Local Support'], ARRAY['Hip-Hop', 'R&B', 'Afrobeats'],
   'published', true),

  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004',
   'Werk: Void Series 01', 'werk-void-series-01',
   'Die neue Serie von Werk beginnt. Volle Dunkelheit, maximaler Sound.',
   '2026-10-03 00:00:00+02', '2026-10-02 23:00:00+02', 350, 28.00, 'EUR',
   ARRAY['Shackleton', 'Demdike Stare', 'Andy Stott'], ARRAY['Dark Techno', 'Dub Techno', 'Ambient'],
   'published', false),

  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004',
   'Sass Gold Night', 'sass-gold-night-2026',
   'Exklusive VIP-Nacht im Sass. Dresscode gilt. Champagner-Empfang inklusive.',
   '2026-10-10 22:00:00+02', '2026-10-10 21:00:00+02', 500, 45.00, 'EUR',
   ARRAY['Carl Cox', 'Luciano'], ARRAY['House', 'Deep House'],
   'published', true),

  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004',
   'Arena Open Air: September Rave', 'arena-open-air-september-rave',
   'Das größte Open-Air-Event des Herbstes. 3 Stages, 20 DJs, 5000 Leute.',
   '2026-09-27 16:00:00+02', '2026-09-27 15:00:00+02', 5000, 35.00, 'EUR',
   ARRAY['Charlotte de Witte', 'Amelie Lens', 'SPFDJ', 'Alignment'], ARRAY['Techno', 'Hard Techno'],
   'published', true),

  ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
   'Pratersauna: Rave am See', 'pratersauna-rave-am-see',
   'Techno am Pool der Pratersauna. Das Kultformat kehrt zurück für eine letzte Sommernacht.',
   '2026-08-30 18:00:00+02', '2026-08-30 17:00:00+02', 700, 20.00, 'EUR',
   ARRAY['Objekt', 'Scuba', 'Joy Orbison'], ARRAY['Techno', 'House'],
   'published', true),

  ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004',
   'Chelsea: Punk Is Not Dead', 'chelsea-punk-is-not-dead',
   'Ein Abend für Punk, Post-Punk und Alternative Rock-Fans aller Generationen.',
   '2026-08-22 21:00:00+02', '2026-08-22 20:00:00+02', 300, 12.00, 'EUR',
   ARRAY['The Decline', 'Teenage Bottlerocket', 'Local Bands'], ARRAY['Punk', 'Alternative'],
   'published', false),

  ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004',
   'Grelle Forelle: Deep Waters', 'grelle-forelle-deep-waters',
   'Deep House und Minimal Techno trifft auf Donaukanal-Feeling.',
   '2026-08-15 23:00:00+02', '2026-08-15 22:00:00+02', 600, 16.00, 'EUR',
   ARRAY['Roman Flügel', 'Nik Void', 'Recondite (Live)'], ARRAY['Minimal', 'Deep House', 'Techno'],
   'published', true),

  ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004',
   'WUK: Indie Night Vol. 8', 'wuk-indie-night-vol-8',
   'Alternative Nacht mit Live-Konzert und anschließendem DJ-Set.',
   '2026-08-08 20:00:00+02', '2026-08-08 19:30:00+02', 700, 14.00, 'EUR',
   ARRAY['Cigarettes After Sex', 'Local Support'], ARRAY['Indie', 'Alternative', 'Dream Pop'],
   'published', false),

  ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
   'Members Night Vol. 4', 'members-night-vol-4',
   'Fortsetzung der exklusiven Members-Reihe. Nur für registrierte Mitglieder.',
   '2026-10-17 00:00:00+02', '2026-10-16 23:00:00+02', 200, 40.00, 'EUR',
   ARRAY['Blawan', 'Developer', 'Paula Temple'], ARRAY['Industrial Techno', 'Dark Techno'],
   'published', true),

  ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004',
   'Fluc: NOISE//ERROR Exhibition Night', 'fluc-noise-error-2026',
   'Kunst-Performance trifft auf Noise und Industrial. Installation ab 18:00 Uhr.',
   '2026-09-05 18:00:00+02', '2026-09-05 17:00:00+02', 200, 8.00, 'EUR',
   ARRAY['Merzbow', 'Pharmakon', 'Local Artists'], ARRAY['Experimental', 'Noise', 'Industrial'],
   'published', false),

  ('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'Flex x Boiler Room: Live From Vienna', 'flex-boiler-room-wien-2026',
   'Exklusives Boiler Room Event live aus dem Flex. Weltweit gestreamt.',
   '2026-11-07 22:00:00+02', '2026-11-07 21:00:00+02', 400, 0.00, 'EUR',
   ARRAY['Floating Points', 'Four Tet', 'Actress'], ARRAY['Electronic', 'House', 'Ambient'],
   'published', true)

ON CONFLICT (id) DO NOTHING;


-- ============================================
-- MORE REVIEWS
-- ============================================
INSERT INTO public.reviews (user_id, club_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 5, 'Das Flex ist einfach unschlagbar. Der Sound ist der beste der Stadt.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', 4, 'Toller Club, perfekte Lage. Etwas teuer aber das Ambiente ist es wert.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000009', 5, 'Sass ist einfach die Referenz für Clubbing in Wien. Unbedingt empfehlenswert!', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000011', 5, 'Arena Open Air ist das Event des Jahres. Drei Stages, perfekte Organisation.', 'visible')
ON CONFLICT DO NOTHING;

INSERT INTO public.reviews (user_id, bar_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 5, 'Roxy hat die besten Cocktails im 5. Bezirk. DJ am Wochenende macht die Stimmung perfekt.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 4, 'Onyx Bar – der Blick auf den Stephansdom ist atemberaubend. Preise entsprechend.', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000010', 5, 'Café Schwarzenberg abends als Bar – ein echtes Wiener Erlebnis.', 'visible')
ON CONFLICT DO NOTHING;

INSERT INTO public.reviews (user_id, event_id, rating, text, status) VALUES
  ('00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 5, 'Flex Opening Night war unfassbar. Surgeon live war das Highlight des Jahres!', 'visible'),
  ('00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000008', 5, 'Arena Open Air – Charlotte de Witte war göttlich. 5 Stunden nonstop Tanzen.', 'visible')
ON CONFLICT DO NOTHING;


-- ============================================
-- CLUBIFY V3 — AUTO GENERATED IMAGE UPDATES
-- ============================================
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000004';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000005';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000006';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000007';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000008';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000009';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1489641499593-b54144a3b01a?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000010';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000011';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000012';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000013';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE public.clubs SET images = ARRAY['https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800'] WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000003';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000004';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000005';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000006';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1497644083578-611b798c60f3?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000007';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000008';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000009';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000010';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000011';
UPDATE public.bars SET images = ARRAY['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'] WHERE id = '20000000-0000-0000-0000-000000000012';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000004';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000005';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000006';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000007';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000008';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000009';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1489641499593-b54144a3b01a?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000010';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000011';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000012';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000013';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000014';
UPDATE public.events SET images = ARRAY['https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800'] WHERE id = '30000000-0000-0000-0000-000000000015';
