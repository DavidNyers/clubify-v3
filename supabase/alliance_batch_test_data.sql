-- ============================================
-- CLUBIFY ALLIANCE — BULLETPROOF BATCH TEST DATA
-- ============================================

-- 1. CLEANUP (Start fresh)
DELETE FROM public.alliance_redemptions;
DELETE FROM public.alliance_monthly_settlements;

-- 2. UPDATE EXISTING USERS
DO $$
DECLARE
    u_record RECORD;
    i INT := 0;
    tiers TEXT[] := ARRAY['explorer', 'premium', 'elite'];
    current_tier TEXT;
BEGIN
    FOR u_record IN SELECT id FROM public.users LIMIT 20 LOOP
        current_tier := tiers[1 + (i % 3)];
        
        UPDATE public.users SET 
            alliance_tier = current_tier, 
            alliance_status = 'active', 
            alliance_expiration = NOW() + INTERVAL '30 days'
        WHERE id = u_record.id;

        -- Generate redemptions for each user
        FOR j IN 1..10 LOOP
            INSERT INTO public.alliance_redemptions (user_id, target_type, target_id, benefit_id, points_awarded, redeemed_at)
            SELECT 
                u_record.id,
                target_type,
                target_id,
                id,
                (CASE WHEN (j % 3 = 0) THEN 15 WHEN (j % 2 = 0) THEN 5 ELSE 10 END),
                -- Simple monthly split
                CASE 
                    WHEN j <= 3 THEN '2026-01-10'::DATE 
                    WHEN j <= 6 THEN '2026-02-15'::DATE 
                    ELSE '2026-03-20'::DATE 
                END + (j || ' hours')::INTERVAL
            FROM public.alliance_venue_benefits 
            ORDER BY RANDOM() LIMIT 1;
        END LOOP;
        
        i := i + 1;
    END LOOP;

    -- NEW: Ensure at least one EVENT is an alliance partner
    INSERT INTO public.alliance_venue_settings (target_type, target_id, is_alliance_active, custom_point_multiplier)
    SELECT 'event', id, true, 1.5 FROM public.events LIMIT 1
    ON CONFLICT (target_type, target_id) DO UPDATE SET is_alliance_active = true, custom_point_multiplier = 1.5;

    -- Add a benefit for that event
    INSERT INTO public.alliance_venue_benefits (target_type, target_id, benefit_type_id, required_tier)
    SELECT 'event', e.id, bt.id, 1 
    FROM public.events e, public.alliance_benefit_types bt 
    WHERE bt.name = 'Fast Lane'
    LIMIT 1
    ON CONFLICT DO NOTHING;

END $$;

-- 3. DYNAMICALLY CREATE SETTLEMENTS BASED ON REAL DATA
-- This ensures the sum ALWAYS matches the details
DO $$
DECLARE
    m DATE;
    total_pts INT;
    revenue DECIMAL(12,2);
    pool DECIMAL(12,2);
    share DECIMAL(12,2);
    price DECIMAL(12,6);
BEGIN
    FOR m IN SELECT DISTINCT date_trunc('month', redeemed_at)::DATE FROM public.alliance_redemptions LOOP
        -- Define revenue for this month (Simplified: 50€ per active user in that month)
        revenue := (SELECT COUNT(DISTINCT user_id) * 35.00 FROM public.alliance_redemptions WHERE date_trunc('month', redeemed_at)::DATE = m);
        pool := revenue * 0.8;
        share := revenue * 0.2;
        
        -- Get actual sum of points
        total_pts := (SELECT SUM(points_awarded) FROM public.alliance_redemptions WHERE date_trunc('month', redeemed_at)::DATE = m);
        
        -- Calculate price per point
        IF total_pts > 0 THEN
            price := pool / total_pts;
        ELSE
            price := 0;
        END IF;

        INSERT INTO public.alliance_monthly_settlements (month_start, total_revenue, alliance_pool, clubify_share, total_points_redeemed, price_per_point, status)
        VALUES (m, revenue, pool, share, total_pts, price, 'completed');
    END LOOP;
END $$;

-- Add one current month draft manually if not yet populated
INSERT INTO public.alliance_monthly_settlements (month_start, total_revenue, alliance_pool, clubify_share, total_points_redeemed, price_per_point, status)
VALUES ('2026-04-01', 484.85, 387.88, 96.97, 10, 38.788, 'calculated')
ON CONFLICT (month_start) DO NOTHING;
