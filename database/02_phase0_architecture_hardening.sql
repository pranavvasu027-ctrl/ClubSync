-- =================================================================================
-- PHASE 0: SCALABILITY FOUNDATION + ARCHITECTURE HARDENING
-- This migration hardens the tenant boundaries and RLS policies for multi-club support.
-- =================================================================================

-- 1. Create a robust function to check if a user has a specific role in a specific club
CREATE OR REPLACE FUNCTION public.has_club_role(target_club_id VARCHAR, allowed_roles VARCHAR[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.status = 'ACTIVE'
      AND m.role = ANY(allowed_roles)
  );
$$;

-- 2. Create a robust function to check if a user is a member of a specific club (any role)
CREATE OR REPLACE FUNCTION public.is_club_member(target_club_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.status = 'ACTIVE'
  );
$$;

-- 3. Create a function to check platform-level roles (e.g., 'Owner' or 'Admin')
-- These roles have access across all clubs.
CREATE OR REPLACE FUNCTION public.has_platform_role(allowed_roles VARCHAR[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.user_type = ANY(allowed_roles)
  );
$$;

-- =================================================================================
-- ENFORCE STRICT TENANT RLS ON EVENTS
-- =================================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read events" ON public.events;
DROP POLICY IF EXISTS "Insert events" ON public.events;
DROP POLICY IF EXISTS "Update events" ON public.events;
DROP POLICY IF EXISTS "Delete events" ON public.events;

-- Anyone can read live, completed, settled events
CREATE POLICY "Public can view live events" ON public.events
FOR SELECT
USING (status IN ('live', 'completed', 'settled'));

-- Club members can read ALL events for their club (including drafts and proposed)
CREATE POLICY "Club members can view their events" ON public.events
FOR SELECT
USING (
  public.is_club_member(club_id) 
  OR public.has_platform_role(ARRAY['Owner', 'Admin'])
);

-- Only President, Executive, or Owner can insert events for their club
CREATE POLICY "Authorized users can insert events" ON public.events
FOR INSERT
WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  OR public.has_platform_role(ARRAY['Owner'])
);

-- Only President, Executive, or Owner can update their club's events
CREATE POLICY "Authorized users can update events" ON public.events
FOR UPDATE
USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  OR public.has_platform_role(ARRAY['Owner'])
);

-- Delete events
CREATE POLICY "Only Owners can delete events" ON public.events
FOR DELETE
USING (public.has_platform_role(ARRAY['Owner']));


-- =================================================================================
-- ENFORCE STRICT TENANT RLS ON EVENT APPROVALS
-- =================================================================================
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read approvals" ON public.event_approvals;

-- Only club members and platform owners can read approvals for their club
CREATE POLICY "Club members can view approvals" ON public.event_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_approvals.event_id 
      AND (public.is_club_member(e.club_id) OR public.has_platform_role(ARRAY['Owner', 'Admin']))
  )
);


-- =================================================================================
-- ENFORCE STRICT TENANT RLS ON EVENT AUDIT LOG
-- =================================================================================
ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read audit log" ON public.event_audit_log;

CREATE POLICY "Club members can view audit logs" ON public.event_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_audit_log.event_id 
      AND (public.is_club_member(e.club_id) OR public.has_platform_role(ARRAY['Owner', 'Admin']))
  )
);


-- =================================================================================
-- ENFORCE STRICT TENANT RLS ON EVENT BUDGETS
-- =================================================================================
ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read event budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Insert event budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Update event budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Delete event budgets" ON public.event_budgets;

CREATE POLICY "Club members can view budgets" ON public.event_budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.is_club_member(e.club_id) OR public.has_platform_role(ARRAY['Owner', 'Admin']))
  )
);

CREATE POLICY "Authorized users can insert budgets" ON public.event_budgets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Treasurer']) OR public.has_platform_role(ARRAY['Owner']))
  )
);

CREATE POLICY "Authorized users can update budgets" ON public.event_budgets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Treasurer']) OR public.has_platform_role(ARRAY['Owner']))
  )
);


-- =================================================================================
-- FIX RPC FUNCTIONS TO USE MULTI-TENANT CHECKS INSTEAD OF GLOBAL USER TYPE
-- =================================================================================
-- We must update `submit_event_for_approval` to check `has_club_role` instead of `get_my_role`.

CREATE OR REPLACE FUNCTION public.submit_event_for_approval(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
BEGIN
  -- Get the event details
  SELECT club_id, status INTO v_club_id, v_status 
  FROM public.events 
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Security Check: Must be President or Owner of THAT club
  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only club executives can submit events for approval';
  END IF;

  IF v_status != 'draft' AND v_status != 'rejected' THEN
    RAISE EXCEPTION 'Invalid state transition: Only draft or rejected events can be submitted';
  END IF;

  -- Update event
  UPDATE public.events 
  SET status = 'proposed', 
      updated_at = CURRENT_TIMESTAMP
  WHERE event_id = p_event_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.faculty_approve_event(p_event_id UUID, p_comments TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT club_id, status INTO v_club_id, v_status FROM public.events WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  -- Security Check: Must be Faculty for that club or Platform Owner
  IF NOT (public.has_club_role(v_club_id, ARRAY['Faculty_Advisor']) OR public.has_platform_role(ARRAY['Owner', 'Faculty'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only faculty can approve events';
  END IF;

  IF v_status != 'proposed' THEN
    RAISE EXCEPTION 'Invalid state transition: Event must be in proposed state';
  END IF;

  UPDATE public.events SET status = 'live', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;

  INSERT INTO public.event_approvals (event_id, approver_id, stage, decision, comments)
  VALUES (p_event_id, public.get_my_user_id(), 'faculty', 'approved', p_comments);
END;
$$;


CREATE OR REPLACE FUNCTION public.faculty_reject_event(p_event_id UUID, p_comments TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT club_id, status INTO v_club_id, v_status FROM public.events WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  -- Security Check
  IF NOT (public.has_club_role(v_club_id, ARRAY['Faculty_Advisor']) OR public.has_platform_role(ARRAY['Owner', 'Faculty'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only faculty can reject events';
  END IF;

  IF v_status != 'proposed' THEN
    RAISE EXCEPTION 'Invalid state transition: Event must be in proposed state';
  END IF;

  UPDATE public.events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;

  INSERT INTO public.event_approvals (event_id, approver_id, stage, decision, comments)
  VALUES (p_event_id, public.get_my_user_id(), 'faculty', 'rejected', p_comments);
END;
$$;

-- Complete event
CREATE OR REPLACE FUNCTION public.complete_event(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT club_id, status INTO v_club_id, v_status FROM public.events WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner'])) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_status != 'live' THEN
    RAISE EXCEPTION 'Invalid state transition: Event must be live to complete';
  END IF;

  UPDATE public.events SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
END;
$$;


-- =================================================================================
-- DATABASE INDEXES FOR SCALABILITY & MULTI-TENANCY
-- =================================================================================

-- Events
CREATE INDEX IF NOT EXISTS idx_events_club_status ON public.events(club_id, status);
CREATE INDEX IF NOT EXISTS idx_events_club_date ON public.events(club_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_college_date ON public.events(college_id, event_date);

-- Approvals
CREATE INDEX IF NOT EXISTS idx_event_approvals_event_decision ON public.event_approvals(event_id, decision);

-- Memberships
CREATE INDEX IF NOT EXISTS idx_memberships_club_status ON public.memberships(club_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_club ON public.memberships(user_id, club_id);

-- Registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user ON public.event_registrations(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

