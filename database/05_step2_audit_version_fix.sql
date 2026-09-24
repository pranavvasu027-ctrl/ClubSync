-- =================================================================================
-- STEP 2 FIX: RE-INTEGRATE AUDIT LOG & EVENT VERSIONS INTO SUBMIT RPC
-- =================================================================================

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
  -- Get caller
  v_user_id := auth.uid();

  -- Get event
  SELECT * INTO v_event_data 
  FROM public.events 
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  v_club_id := v_event_data.club_id;
  v_status := v_event_data.status;

  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only club executives can submit events for approval';
  END IF;

  IF v_status != 'draft' AND v_status != 'rejected' THEN
    RAISE EXCEPTION 'Invalid state transition: Only draft or rejected events can be submitted';
  END IF;

  -- 1. Snapshot Event Budgets
  SELECT jsonb_agg(row_to_json(b)) INTO v_budget_json 
  FROM public.event_budgets b 
  WHERE event_id = p_event_id;

  -- 2. Insert Version Snapshot
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

  -- 3. Update Event Status & Increment Version
  UPDATE public.events 
  SET status = 'proposed', 
      current_version = COALESCE(current_version, 1) + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE event_id = p_event_id;

  -- 4. Initialize Multi-tier Approvals Queue (FACULTY_MENTOR goes first)
  -- Clear any old pending approvals for this event if re-submitted
  DELETE FROM public.event_approvals WHERE event_id = p_event_id;

  INSERT INTO public.event_approvals (
    event_id, approver_level, decision, decision_timestamp
  ) VALUES (
    p_event_id, 'FACULTY_MENTOR', 'PENDING', NULL
  );

  -- 5. Insert Audit Log
  INSERT INTO public.event_audit_log (
    event_id, version_number, action, previous_status, new_status, performed_by
  ) VALUES (
    p_event_id, COALESCE(v_event_data.current_version, 1), 'SUBMITTED', v_status, 'proposed', v_user_id
  );

END;
$$;
