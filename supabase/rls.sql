-- ============================================
-- CLUBIFY V3 — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.happy_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouncer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================

CREATE POLICY "users_public_read" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_own_update" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admin_full_users" ON public.users
  FOR ALL USING (public.is_admin());

-- ============================================
-- CLUBS
-- ============================================

CREATE POLICY "clubs_public_read" ON public.clubs
  FOR SELECT USING (status = 'published' OR auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "clubs_owner_insert" ON public.clubs
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('club_owner', 'admin')
  );

CREATE POLICY "clubs_owner_update" ON public.clubs
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "clubs_owner_delete" ON public.clubs
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- ============================================
-- BARS
-- ============================================

CREATE POLICY "bars_public_read" ON public.bars
  FOR SELECT USING (status = 'published' OR auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "bars_owner_insert" ON public.bars
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('bar_owner', 'admin')
  );

CREATE POLICY "bars_owner_update" ON public.bars
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "bars_owner_delete" ON public.bars
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- ============================================
-- HAPPY HOURS
-- ============================================

CREATE POLICY "happy_hours_public_read" ON public.happy_hours
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bars WHERE id = bar_id AND status = 'published'
  ) OR public.is_admin());

CREATE POLICY "happy_hours_owner_all" ON public.happy_hours
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.bars WHERE id = bar_id AND owner_id = auth.uid()
  ) OR public.is_admin());

-- ============================================
-- EVENTS
-- ============================================

CREATE POLICY "events_public_read" ON public.events
  FOR SELECT USING (status = 'published' OR auth.uid() = manager_id OR public.is_admin());

CREATE POLICY "events_manager_insert" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = manager_id AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('event_manager', 'club_owner', 'bar_owner', 'admin')
  );

CREATE POLICY "events_manager_update" ON public.events
  FOR UPDATE USING (auth.uid() = manager_id OR public.is_admin());

CREATE POLICY "events_manager_delete" ON public.events
  FOR DELETE USING (auth.uid() = manager_id OR public.is_admin());

-- ============================================
-- BOUNCER ASSIGNMENTS
-- ============================================

CREATE POLICY "bouncer_assignments_read" ON public.bouncer_assignments
  FOR SELECT USING (
    auth.uid() = bouncer_id OR
    auth.uid() = assigned_by OR
    public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'event_manager'
  );

CREATE POLICY "bouncer_assignments_manager_all" ON public.bouncer_assignments
  FOR ALL USING (
    auth.uid() = assigned_by OR
    public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('event_manager', 'club_owner')
  );

-- ============================================
-- BOOKINGS
-- ============================================

CREATE POLICY "bookings_user_own" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "bookings_user_insert" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_user_cancel" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "bookings_owner_read" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.bars WHERE id = bar_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND manager_id = auth.uid())
  );

-- ============================================
-- TICKETS
-- ============================================

CREATE POLICY "tickets_user_own" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "tickets_bouncer_read" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bouncer_assignments ba
      WHERE ba.bouncer_id = auth.uid() AND ba.event_id = tickets.event_id
    )
  );

CREATE POLICY "tickets_system_insert" ON public.tickets
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "tickets_system_update" ON public.tickets
  FOR UPDATE USING (public.is_admin());

-- ============================================
-- CHECK-INS
-- ============================================

CREATE POLICY "checkins_bouncer_insert" ON public.checkins
  FOR INSERT WITH CHECK (
    auth.uid() = bouncer_id AND
    EXISTS (
      SELECT 1 FROM public.bouncer_assignments ba
      JOIN public.tickets t ON t.event_id = ba.event_id
      WHERE ba.bouncer_id = auth.uid() AND t.id = checkins.ticket_id
    )
  );

CREATE POLICY "checkins_manager_read" ON public.checkins
  FOR SELECT USING (
    auth.uid() = bouncer_id OR
    public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('event_manager', 'club_owner')
  );

-- ============================================
-- FAVORITES
-- ============================================

CREATE POLICY "favorites_user_own" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (status = 'visible' OR auth.uid() = user_id OR public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'moderator');

CREATE POLICY "reviews_user_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_user_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_moderator_update" ON public.reviews
  FOR UPDATE USING (
    public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'moderator'
  );

-- ============================================
-- COMMENTS
-- ============================================

CREATE POLICY "comments_public_read" ON public.comments
  FOR SELECT USING (status = 'visible' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "comments_user_insert" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_moderator_update" ON public.comments
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'moderator'
  );

-- ============================================
-- REVIEW LIKES
-- ============================================

CREATE POLICY "review_likes_user_own" ON public.review_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "review_likes_public_read" ON public.review_likes
  FOR SELECT USING (true);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE POLICY "payments_user_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "payments_system_all" ON public.payments
  FOR ALL USING (public.is_admin());

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE POLICY "notifications_user_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- WAITLIST
-- ============================================

CREATE POLICY "waitlist_user_own" ON public.waitlist
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ============================================
-- REPORTS
-- ============================================

CREATE POLICY "reports_user_insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_moderator_all" ON public.reports
  FOR ALL USING (
    public.is_admin() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'moderator'
  );

-- ============================================
-- FRAUD LOGS
-- ============================================

CREATE POLICY "fraud_logs_admin_only" ON public.fraud_logs
  FOR ALL USING (public.is_admin());

-- ============================================
-- PAGE VIEWS
-- ============================================

CREATE POLICY "page_views_insert_any" ON public.page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "page_views_owner_read" ON public.page_views
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.clubs WHERE id = target_id::UUID AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.bars WHERE id = target_id::UUID AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.events WHERE id = target_id::UUID AND manager_id = auth.uid())
  );
