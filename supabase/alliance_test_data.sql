-- ============================================
-- CLUBIFY ALLIANCE — Sample Test Data
-- ============================================

-- 1. Setup Test Users with different Tiers
DO $$
DECLARE
    u1_id UUID;
    u2_id UUID;
    u3_id UUID;
BEGIN
    -- We assume there are at least 3 users in the system. 
    -- If not, we'll use whatever is there.
    SELECT id INTO u1_id FROM public.users OFFSET 0 LIMIT 1;
    SELECT id INTO u2_id FROM public.users OFFSET 1 LIMIT 1;
    SELECT id INTO u3_id FROM public.users OFFSET 2 LIMIT 1;

    -- User 1: Explorer (9.99€)
    IF u1_id IS NOT NULL THEN
        UPDATE public.users SET 
            alliance_tier = 'explorer', 
            alliance_status = 'active', 
            alliance_expiration = NOW() + INTERVAL '30 days'
        WHERE id = u1_id;
    END IF;

    -- User 2: Premium (29.99€)
    IF u2_id IS NOT NULL THEN
        UPDATE public.users SET 
            alliance_tier = 'premium', 
            alliance_status = 'active', 
            alliance_expiration = NOW() + INTERVAL '30 days'
        WHERE id = u2_id;
    END IF;

    -- User 3: Elite (59.99€)
    IF u3_id IS NOT NULL THEN
        UPDATE public.users SET 
            alliance_tier = 'elite', 
            alliance_status = 'active', 
            alliance_expiration = NOW() + INTERVAL '30 days'
        WHERE id = u3_id;
    END IF;
END $$;

-- 2. Setup Alliance Partners (1 Club, 1 Bar)
INSERT INTO public.alliance_venue_settings (target_type, target_id, is_alliance_active)
SELECT 'club', id, true FROM public.clubs LIMIT 1
ON CONFLICT (target_type, target_id) DO UPDATE SET is_alliance_active = true;

INSERT INTO public.alliance_venue_settings (target_type, target_id, is_alliance_active)
SELECT 'bar', id, true FROM public.bars LIMIT 1
ON CONFLICT (target_type, target_id) DO UPDATE SET is_alliance_active = true;

-- 3. Link Benefits to these Partners
DO $$
DECLARE
    club_id UUID;
    bar_id UUID;
    entry_benefit UUID;
    drink_benefit UUID;
    shot_benefit UUID;
BEGIN
    SELECT id INTO club_id FROM public.clubs LIMIT 1;
    SELECT id INTO bar_id FROM public.bars LIMIT 1;
    
    SELECT id INTO entry_benefit FROM public.alliance_benefit_types WHERE category = 'entry' LIMIT 1;
    SELECT id INTO drink_benefit FROM public.alliance_benefit_types WHERE name = 'Gratis Longdrink' LIMIT 1;
    SELECT id INTO shot_benefit FROM public.alliance_benefit_types WHERE name = 'Gratis Shot' LIMIT 1;

    -- Club Benefits
    IF club_id IS NOT NULL THEN
        INSERT INTO public.alliance_venue_benefits (target_type, target_id, benefit_type_id, required_tier)
        VALUES 
            ('club', club_id, entry_benefit, 1), -- Explorer can enter
            ('club', club_id, shot_benefit, 2)    -- Premium gets a shot
        ON CONFLICT DO NOTHING;
    END IF;

    -- Bar Benefits
    IF bar_id IS NOT NULL THEN
        INSERT INTO public.alliance_venue_benefits (target_type, target_id, benefit_type_id, required_tier)
        VALUES 
            ('bar', bar_id, drink_benefit, 3),   -- Only Elite gets a Longdrink
            ('bar', bar_id, shot_benefit, 2)     -- Premium gets a shot
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 4. Generate Mock Redemptions for the current month
INSERT INTO public.alliance_redemptions (user_id, target_type, target_id, benefit_id, points_awarded)
SELECT 
    u.id, 
    b.target_type, 
    b.target_id, 
    b.id, 
    t.base_points
FROM public.users u
CROSS JOIN public.alliance_venue_benefits b
JOIN public.alliance_benefit_types t ON b.benefit_type_id = t.id
WHERE u.alliance_status = 'active'
LIMIT 10;

-- 5. Create realistic settlement samples
-- March (Last Month - Completed)
INSERT INTO public.alliance_monthly_settlements (month_start, total_revenue, alliance_pool, clubify_share, total_points_redeemed, price_per_point, status)
VALUES 
    ('2026-03-01', 99.97, 79.98, 19.99, 42, 1.9042, 'completed')
ON CONFLICT (month_start) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    alliance_pool = EXCLUDED.alliance_pool,
    clubify_share = EXCLUDED.clubify_share,
    status = EXCLUDED.status;

-- April (Current Month - Running Draft)
INSERT INTO public.alliance_monthly_settlements (month_start, total_revenue, alliance_pool, clubify_share, total_points_redeemed, price_per_point, status)
VALUES 
    ('2026-04-01', 99.97, 79.98, 19.99, 10, 7.9980, 'calculated')
ON CONFLICT (month_start) DO UPDATE SET
    status = EXCLUDED.status;
