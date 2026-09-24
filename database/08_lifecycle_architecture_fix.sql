-- =================================================================================
-- ARCHITECTURE FIX: FIX EVENT STATUS CONSTRAINT & INTRODUCE CHANGES_REQUESTED
-- =================================================================================

-- 1. Drop old constraint and add new constraint with changes_requested
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (
  status IN ('draft', 'proposed', 'approved', 'changes_requested', 'rejected', 'published', 'upcoming', 'live', 'completed', 'past', 'cancelled', 'settled')
);

-- 2. Drop old dangerous mock RPCs from Phase 0 to ensure they are never accidentally called
DROP FUNCTION IF EXISTS public.faculty_approve_event(UUID, TEXT);
DROP FUNCTION IF EXISTS public.faculty_reject_event(UUID, TEXT);

-- 3. Modify submit_event_for_approval to allow resubmission from changes_requested
DROP FUNCTION IF EXISTS public.submit_event_for_approval(UUID);
CREATE OR REPLACE FUNCTION public.submit_event_for_approval(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
  v_event_data RECORD;
  v_user_id UUID;
  v_budget_json JSONB;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_event_data 
  FROM public.events 
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  v_club_id := v_event_data.club_id;
  v_status := v_event_data.status;

  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only club executives can submit events for approval';
  END IF;

  -- ENHANCED: Allow resubmission from changes_requested
  IF v_status NOT IN ('draft', 'changes_requested', 'rejected') THEN
    RAISE EXCEPTION 'Invalid state transition: Only draft, changes_requested, or rejected events can be submitted';
  END IF;

  SELECT jsonb_agg(row_to_json(b)) INTO v_budget_json FROM public.event_budgets b WHERE event_id = p_event_id;

  INSERT INTO public.event_versions (
    event_id, version_number, title, description, event_type, scope, target_audience, expected_count, venue_name,
    event_date, event_time, start_time, end_time, ticket_price, objectives, expected_outcomes, guest_details,
    resource_requirements, compliance_verified, budget_snapshot, submitted_by
  ) VALUES (
    v_event_data.event_id, COALESCE(v_event_data.current_version, 1), v_event_data.title, v_event_data.description, v_event_data.event_type, v_event_data.scope,
    v_event_data.target_audience, v_event_data.expected_count, v_event_data.venue_name, v_event_data.event_date, v_event_data.event_time,
    v_event_data.start_time, v_event_data.end_time, v_event_data.ticket_price, v_event_data.objectives, v_event_data.expected_outcomes,
    v_event_data.guest_details, v_event_data.resource_requirements, v_event_data.compliance_verified, v_budget_json, v_user_id
  );

  UPDATE public.events 
  SET status = 'proposed', 
      current_version = COALESCE(current_version, 1) + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE event_id = p_event_id;

  DELETE FROM public.event_approvals WHERE event_id = p_event_id;

  INSERT INTO public.event_approvals (
    event_id, approver_level, decision, decision_timestamp
  ) VALUES (
    p_event_id, 'FACULTY_MENTOR', 'PENDING', NULL
  );

  INSERT INTO public.event_audit_log (
    event_id, version_number, action, previous_status, new_status, performed_by
  ) VALUES (
    p_event_id, COALESCE(v_event_data.current_version, 1), 'SUBMITTED', v_status, 'proposed', v_user_id
  );
END;
$$;

-- 4. Enhance process_event_approval to properly distinguish CHANGES_REQUESTED from REJECTED
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR, VARCHAR, TEXT);
CREATE OR REPLACE FUNCTION public.process_event_approval(
  p_event_id UUID, 
  p_level VARCHAR, 
  p_decision VARCHAR, 
  p_remarks TEXT
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
  v_version INT;
  v_expected_stage VARCHAR;
  v_next_stage VARCHAR;
BEGIN
  SELECT club_id, status, current_version INTO v_club_id, v_status, v_version 
  FROM public.events WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  IF v_status != 'proposed' THEN
    RAISE EXCEPTION 'Event must be in proposed state for approvals';
  END IF;

  v_expected_stage := public.get_next_approval_stage(p_event_id);
  IF v_expected_stage != p_level THEN
    RAISE EXCEPTION 'Invalid approval sequence. Expected %, got %', v_expected_stage, p_level;
  END IF;

  IF p_level = 'FACULTY_MENTOR' THEN
    IF NOT (public.has_club_role(v_club_id, ARRAY['Faculty_Advisor']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
      RAISE EXCEPTION 'Unauthorized: Only faculty mentor can approve';
    END IF;
  ELSIF p_level = 'RESOURCE_INCHARGE' THEN
    IF NOT public.has_platform_role(ARRAY['Resource_Incharge', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only resource in-charge can approve';
    END IF;
  ELSIF p_level = 'VERTICAL_COORDINATOR' THEN
    IF NOT public.has_platform_role(ARRAY['Vertical_Coordinator', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only vertical coordinator can approve';
    END IF;
  ELSIF p_level = 'DEAN_ADMIN' THEN
    IF NOT public.has_platform_role(ARRAY['Dean', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only dean can approve';
    END IF;
  END IF;

  -- Validate remarks for rejection/changes
  IF p_decision IN ('CHANGES_REQUESTED', 'REJECTED') AND (p_remarks IS NULL OR trim(p_remarks) = '') THEN
    RAISE EXCEPTION 'Remarks are required when requesting changes or rejecting';
  END IF;

  INSERT INTO public.event_approvals (event_id, approver_id, approver_level, decision, remarks, decision_timestamp)
  VALUES (p_event_id, public.get_my_user_id(), p_level, p_decision, p_remarks, CURRENT_TIMESTAMP)
  ON CONFLICT (event_id, approver_level) 
  DO UPDATE SET 
    decision = p_decision,
    remarks = p_remarks,
    approver_id = public.get_my_user_id(),
    decision_timestamp = CURRENT_TIMESTAMP;

  IF p_decision = 'CHANGES_REQUESTED' THEN
    UPDATE public.events SET status = 'changes_requested', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
    INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
    VALUES (p_event_id, COALESCE(v_version, 1), p_decision, 'proposed', 'changes_requested', public.get_my_user_id(), p_remarks);

  ELSIF p_decision = 'REJECTED' THEN
    UPDATE public.events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
    INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
    VALUES (p_event_id, COALESCE(v_version, 1), p_decision, 'proposed', 'rejected', public.get_my_user_id(), p_remarks);
    
  ELSIF p_decision = 'APPROVED' THEN
    IF p_level = 'DEAN_ADMIN' THEN
      UPDATE public.events SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
      INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
      VALUES (p_event_id, COALESCE(v_version, 1), 'APPROVED', 'proposed', 'approved', public.get_my_user_id(), p_remarks);
    ELSE
      INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
      VALUES (p_event_id, COALESCE(v_version, 1), 'APPROVED_' || p_level, 'proposed', 'proposed', public.get_my_user_id(), p_remarks);

      v_next_stage := CASE p_level
        WHEN 'FACULTY_MENTOR' THEN 'RESOURCE_INCHARGE'
        WHEN 'RESOURCE_INCHARGE' THEN 'VERTICAL_COORDINATOR'
        WHEN 'VERTICAL_COORDINATOR' THEN 'DEAN_ADMIN'
      END;
      
      INSERT INTO public.event_approvals (event_id, approver_id, approver_level, decision)
      VALUES (p_event_id, '00000000-0000-0000-0000-000000000000', v_next_stage, 'PENDING')
      ON CONFLICT (event_id, approver_level) 
      DO UPDATE SET decision = 'PENDING', remarks = NULL, decision_timestamp = NULL;
    END IF;
  END IF;
END;
$$;
