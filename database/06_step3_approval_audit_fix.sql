-- =================================================================================
-- STEP 3 FIX: RE-INTEGRATE AUDIT LOG INTO APPROVAL RPC
-- =================================================================================

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
  -- Get event context
  SELECT club_id, status, current_version INTO v_club_id, v_status, v_version 
  FROM public.events WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  IF v_status != 'proposed' THEN
    RAISE EXCEPTION 'Event must be in proposed state for approvals';
  END IF;

  -- Validate sequential approval
  v_expected_stage := public.get_next_approval_stage(p_event_id);
  IF v_expected_stage != p_level THEN
    RAISE EXCEPTION 'Invalid approval sequence. Expected %, got %', v_expected_stage, p_level;
  END IF;

  -- Security Check
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

  -- Record decision
  INSERT INTO public.event_approvals (event_id, approver_id, approver_level, decision, remarks, decision_timestamp)
  VALUES (p_event_id, public.get_my_user_id(), p_level, p_decision, p_remarks, CURRENT_TIMESTAMP)
  ON CONFLICT (event_id, approver_level) 
  DO UPDATE SET 
    decision = p_decision,
    remarks = p_remarks,
    approver_id = public.get_my_user_id(),
    decision_timestamp = CURRENT_TIMESTAMP;

  -- Handle overall event status update, audit log, and next pending stage
  IF p_decision = 'REJECTED' THEN
    UPDATE public.events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
    
    INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
    VALUES (p_event_id, COALESCE(v_version, 1), p_decision, 'proposed', 'rejected', public.get_my_user_id(), p_remarks);
    
  ELSIF p_decision = 'APPROVED' THEN
    IF p_level = 'DEAN_ADMIN' THEN
      UPDATE public.events SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
      
      INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
      VALUES (p_event_id, COALESCE(v_version, 1), 'APPROVED', 'proposed', 'approved', public.get_my_user_id(), p_remarks);
    ELSE
      -- Log interim approval
      INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by, reason)
      VALUES (p_event_id, COALESCE(v_version, 1), 'APPROVED_' || p_level, 'proposed', 'proposed', public.get_my_user_id(), p_remarks);

      -- Insert pending for next level
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
