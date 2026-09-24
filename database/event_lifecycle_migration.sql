-- 1. FIX get_my_role() function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT user_type FROM public.users WHERE auth_user_id = auth.uid();
$$;

-- 2. CREATE helper function get_my_user_id()
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT user_id FROM public.users WHERE auth_user_id = auth.uid();
$$;

-- 3. CREATE helper function get_my_club_id()
CREATE OR REPLACE FUNCTION public.get_my_club_id()
RETURNS varchar
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT m.club_id FROM public.memberships m
  WHERE m.user_id = (SELECT user_id FROM public.users WHERE auth_user_id = auth.uid())
  AND m.status = 'ACTIVE'
  LIMIT 1;
$$;

-- 4. ADD new status values to events table
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('draft', 'proposed', 'upcoming', 'live', 'past', 'cancelled', 'approved', 'rejected', 'published', 'completed', 'settled'));

-- 5. ADD version column to events if not exists
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS current_version INT DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 6. CREATE event_versions table
CREATE TABLE IF NOT EXISTS public.event_versions (
  version_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  
  -- Snapshot of all proposal fields at time of submission
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  scope VARCHAR(30),
  target_audience VARCHAR(100),
  expected_count INT,
  venue_name VARCHAR(150),
  event_date VARCHAR(50),
  event_time VARCHAR(50),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  ticket_price NUMERIC(10,2),
  objectives TEXT,
  expected_outcomes TEXT,
  guest_details JSONB,
  resource_requirements TEXT[],
  compliance_verified BOOLEAN,
  budget_snapshot JSONB, -- snapshot of event_budgets at submission time
  
  submitted_by UUID REFERENCES public.users(user_id),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(event_id, version_number)
);

-- 7. CREATE event_audit_log table (IMMUTABLE)
CREATE TABLE IF NOT EXISTS public.event_audit_log (
  log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  version_number INT,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  performed_by UUID REFERENCES public.users(user_id),
  performer_role VARCHAR(50),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. DROP the UNIQUE constraint on event_approvals
ALTER TABLE public.event_approvals DROP CONSTRAINT IF EXISTS event_approvals_event_id_approver_level_key;

-- 15. ADD a trigger that PREVENTS direct status manipulation to privileged states
CREATE OR REPLACE FUNCTION public.prevent_direct_status_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status NOT IN ('draft') THEN
      RAISE EXCEPTION 'Direct status changes are not allowed. Use the appropriate workflow action.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_status_escalation ON public.events;
CREATE TRIGGER trg_prevent_status_escalation
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_status_escalation();

-- 9. CREATE RPC function: submit_event_for_approval(p_event_id UUID)
CREATE OR REPLACE FUNCTION public.submit_event_for_approval(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_club_id VARCHAR;
  v_event RECORD;
  v_budget_json JSONB;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);

  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated or not found');
  END IF;

  v_role := public.get_my_role();
  IF v_role NOT IN ('President', 'Owner') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only President or Owner can submit events');
  END IF;

  v_club_id := public.get_my_club_id();
  
  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF v_event.club_id != v_club_id AND v_event.created_by != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Event does not belong to your club');
  END IF;

  IF v_event.status NOT IN ('draft', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid status: Only draft or rejected events can be submitted');
  END IF;

  SELECT jsonb_agg(row_to_json(b)) INTO v_budget_json FROM public.event_budgets b WHERE event_id = p_event_id;

  INSERT INTO public.event_versions (
    event_id, version_number, title, description, event_type, scope, target_audience, expected_count, venue_name,
    event_date, event_time, start_time, end_time, ticket_price, objectives, expected_outcomes, guest_details,
    resource_requirements, compliance_verified, budget_snapshot, submitted_by
  ) VALUES (
    v_event.event_id, v_event.current_version, v_event.title, v_event.description, v_event.event_type, v_event.scope,
    v_event.target_audience, v_event.expected_count, v_event.venue_name, v_event.event_date, v_event.event_time,
    v_event.start_time, v_event.end_time, v_event.ticket_price, v_event.objectives, v_event.expected_outcomes,
    v_event.guest_details, v_event.resource_requirements, v_event.compliance_verified, v_budget_json, v_user_id
  );

  INSERT INTO public.event_approvals (event_id, approver_level, decision)
  VALUES (p_event_id, 'FACULTY_MENTOR', 'PENDING');

  UPDATE public.events SET status = 'proposed', current_version = current_version + 1, updated_at = NOW()
  WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, performer_role)
  VALUES (p_event_id, v_event.current_version, 'SUBMITTED', v_event.status, 'proposed', v_user_id, v_role);

  RETURN jsonb_build_object('success', true, 'message', 'Event submitted successfully');
END;
$$;

-- 10. CREATE RPC function: faculty_approve_event(p_event_id UUID, p_remarks TEXT)
CREATE OR REPLACE FUNCTION public.faculty_approve_event(p_event_id UUID, p_remarks TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_event RECORD;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);

  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  v_role := public.get_my_role();
  IF v_role NOT IN ('Faculty', 'Owner') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only Faculty or Owner can approve');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF v_event.status != 'proposed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event is not in proposed status');
  END IF;

  UPDATE public.event_approvals
  SET decision = 'APPROVED', approver_id = v_user_id, remarks = p_remarks, decision_timestamp = NOW()
  WHERE event_id = p_event_id AND decision = 'PENDING' AND approver_level = 'FACULTY_MENTOR';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pending approval not found or already processed');
  END IF;

  UPDATE public.events SET status = 'live', updated_at = NOW() WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, performer_role, reason)
  VALUES (p_event_id, v_event.current_version, 'APPROVED', 'proposed', 'live', v_user_id, v_role, p_remarks);

  RETURN jsonb_build_object('success', true, 'message', 'Event approved successfully');
END;
$$;

-- 11. CREATE RPC function: faculty_reject_event(p_event_id UUID, p_reason TEXT)
CREATE OR REPLACE FUNCTION public.faculty_reject_event(p_event_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_event RECORD;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rejection reason is required');
  END IF;

  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  v_role := public.get_my_role();
  IF v_role NOT IN ('Faculty', 'Owner') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only Faculty or Owner can reject');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF v_event.status != 'proposed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event is not in proposed status');
  END IF;

  UPDATE public.event_approvals
  SET decision = 'REJECTED', approver_id = v_user_id, remarks = p_reason, decision_timestamp = NOW()
  WHERE event_id = p_event_id AND decision = 'PENDING' AND approver_level = 'FACULTY_MENTOR';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pending approval not found or already processed');
  END IF;

  UPDATE public.events SET status = 'rejected', updated_at = NOW() WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, performer_role, reason)
  VALUES (p_event_id, v_event.current_version, 'REJECTED', 'proposed', 'rejected', v_user_id, v_role, p_reason);

  RETURN jsonb_build_object('success', true, 'message', 'Event rejected successfully');
END;
$$;

-- 12. CREATE RPC function: complete_event(p_event_id UUID)
CREATE OR REPLACE FUNCTION public.complete_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_club_id VARCHAR;
  v_event RECORD;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);

  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  v_role := public.get_my_role();
  IF v_role NOT IN ('President', 'Owner') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only President or Owner can complete events');
  END IF;

  v_club_id := public.get_my_club_id();
  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF v_event.club_id != v_club_id AND v_event.created_by != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Event does not belong to your club');
  END IF;

  IF v_event.status != 'live' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event is not live');
  END IF;

  UPDATE public.events SET status = 'completed', updated_at = NOW() WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, performer_role)
  VALUES (p_event_id, v_event.current_version, 'COMPLETED', 'live', 'completed', v_user_id, v_role);

  RETURN jsonb_build_object('success', true, 'message', 'Event completed successfully');
END;
$$;

-- 13. CREATE RPC function: settle_event(p_event_id UUID)
CREATE OR REPLACE FUNCTION public.settle_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_event RECORD;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);

  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  v_role := public.get_my_role();
  IF v_role NOT IN ('Faculty', 'Owner') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only Faculty or Owner can settle events');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF v_event.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event is not completed');
  END IF;

  UPDATE public.events SET status = 'settled', updated_at = NOW() WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, performer_role)
  VALUES (p_event_id, v_event.current_version, 'SETTLED', 'completed', 'settled', v_user_id, v_role);

  RETURN jsonb_build_object('success', true, 'message', 'Event settled successfully');
END;
$$;

-- 14. FIX RLS POLICIES on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', r.policyname);
    END LOOP;
END
$$;

CREATE POLICY "Read events" ON public.events FOR SELECT USING (true);

CREATE POLICY "Insert events" ON public.events FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.get_my_role() IN ('President', 'Owner') AND
  created_by = public.get_my_user_id() AND
  (club_id = public.get_my_club_id() OR public.get_my_club_id() IS NULL)
);

CREATE POLICY "Update events" ON public.events FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() IN ('President', 'Owner') AND
  status IN ('draft', 'rejected') AND
  (club_id = public.get_my_club_id() OR created_by = public.get_my_user_id())
);

CREATE POLICY "Delete events" ON public.events FOR DELETE USING (false);

-- 16. FIX RLS on event_approvals
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'event_approvals' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_approvals', r.policyname);
    END LOOP;
END$$;
CREATE POLICY "Read approvals" ON public.event_approvals FOR SELECT USING (auth.uid() IS NOT NULL);

-- 17. FIX RLS on event_audit_log
ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'event_audit_log' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_audit_log', r.policyname);
    END LOOP;
END$$;
CREATE POLICY "Read audit log" ON public.event_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);

-- 18. FIX RLS on event_versions
ALTER TABLE public.event_versions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'event_versions' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_versions', r.policyname);
    END LOOP;
END$$;
CREATE POLICY "Read event versions" ON public.event_versions FOR SELECT USING (auth.uid() IS NOT NULL);

-- 19. FIX RLS on event_budgets
ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'event_budgets' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_budgets', r.policyname);
    END LOOP;
END$$;
CREATE POLICY "Read event budgets" ON public.event_budgets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Insert event budgets" ON public.event_budgets FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.get_my_role() IN ('President', 'Owner') AND
  EXISTS (SELECT 1 FROM public.events e WHERE e.event_id = event_budgets.event_id AND e.club_id = public.get_my_club_id() AND e.status IN ('draft', 'rejected'))
);
CREATE POLICY "Update event budgets" ON public.event_budgets FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() IN ('President', 'Owner') AND
  EXISTS (SELECT 1 FROM public.events e WHERE e.event_id = event_budgets.event_id AND e.club_id = public.get_my_club_id() AND e.status IN ('draft', 'rejected'))
);
CREATE POLICY "Delete event budgets" ON public.event_budgets FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() IN ('President', 'Owner') AND
  EXISTS (SELECT 1 FROM public.events e WHERE e.event_id = event_budgets.event_id AND e.club_id = public.get_my_club_id() AND e.status IN ('draft', 'rejected'))
);
