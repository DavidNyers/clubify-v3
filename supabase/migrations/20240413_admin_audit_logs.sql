-- ============================================
-- ADMIN AUDIT LOGS
-- ============================================

CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_id UUID NOT NULL, -- The ID of the club, bar, user, or event
  target_type TEXT NOT NULL CHECK (target_type IN ('club', 'bar', 'event', 'user')),
  action TEXT NOT NULL, -- e.g., 'updated_details', 'status_changed'
  changes JSONB DEFAULT '{}', -- Details of what changed (old values vs new values)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only admins can view the audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert audit logs" 
ON public.admin_audit_logs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON TABLE public.admin_audit_logs IS 'Tracks all administrative actions for transparency and rollback capabilities.';
