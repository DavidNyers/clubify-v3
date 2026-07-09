-- ============================================
-- CLUBIFY ALLIANCE — SEED VENUE PAYOUTS
-- Translates Settlements + Redemptions into actual Payout records
-- ============================================

DO $$
DECLARE
    settlement_record RECORD;
    redemption_record RECORD;
BEGIN
    -- For each completed or calculated settlement
    FOR settlement_record IN 
        SELECT id, month_start, price_per_point FROM public.alliance_monthly_settlements 
    LOOP
        -- Group redemptions for this settlement's month by venue
        FOR redemption_record IN
            SELECT 
                target_type, 
                target_id, 
                SUM(points_awarded) as total_pts
            FROM public.alliance_redemptions
            WHERE date_trunc('month', redeemed_at)::DATE = settlement_record.month_start
            GROUP BY target_type, target_id
        LOOP
            -- Insert the payout record
            INSERT INTO public.alliance_venue_payouts (
                settlement_id,
                target_type,
                target_id,
                points_redeemed,
                amount_eur,
                payout_status,
                paid_at
            ) VALUES (
                settlement_record.id,
                redemption_record.target_type,
                redemption_record.target_id,
                redemption_record.total_pts,
                ROUND((redemption_record.total_pts * settlement_record.price_per_point)::NUMERIC, 2),
                'paid',
                settlement_record.month_start + INTERVAL '10 days' -- Simplified payout date
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
