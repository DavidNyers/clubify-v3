-- Update Demo Users with sample locations around Vienna for Live Map testing
-- Coordinates are centered around Vienna (approx. 48.2, 16.37)

-- 1. Admin User (Vienna City Center - Stephansplatz)
UPDATE public.users 
SET last_lat = 48.2085, last_lng = 16.3725, last_active_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Max Mustermann (Club Owner - Praterstern Area)
UPDATE public.users 
SET last_lat = 48.2185, last_lng = 16.3915, last_active_at = NOW() - INTERVAL '5 minutes'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- 3. Lisa Bar (Bar Owner - Donaukanal)
UPDATE public.users 
SET last_lat = 48.2125, last_lng = 16.3780, last_active_at = NOW() - INTERVAL '12 minutes'
WHERE id = '00000000-0000-0000-0000-000000000003';

-- 4. Tom Events (Event Manager - Spittelau)
UPDATE public.users 
SET last_lat = 48.2355, last_lng = 16.3585, last_active_at = NOW() - INTERVAL '45 minutes'
WHERE id = '00000000-0000-0000-0000-000000000004';

-- 5. Stefan Türsteher (Bouncer - Erdberg)
UPDATE public.users 
SET last_lat = 48.1925, last_lng = 16.4125, last_active_at = NOW() - INTERVAL '3 hours'
WHERE id = '00000000-0000-0000-0000-000000000005';

-- 6. Anna User (Customer - Museumsquartier)
UPDATE public.users 
SET last_lat = 48.2035, last_lng = 16.3615, last_active_at = NOW() - INTERVAL '2 minutes'
WHERE id = '00000000-0000-0000-0000-000000000006';

-- 7. Mo Derator (Moderator - Naschmarkt)
UPDATE public.users 
SET last_lat = 48.1985, last_lng = 16.3585, last_active_at = NOW() - INTERVAL '8 minutes'
WHERE id = '00000000-0000-0000-0000-000000000007';
