
-- =================================================================================
-- PHASE 1: FIX APPROVAL PIPELINE PENDING QUEUE
-- =================================================================================

CREATE OR REPLACE FUNCTION public.submit_event_for_approval(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT club_id, status INTO v_club_id, v_status 
  FROM public.events 
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
    RAISE EXCEPTION 'Unauthorized: Only club executives can submit events for approval';
  END IF;

  IF v_status != 'draft' AND v_status != 'rejected' THEN
    RAISE EXCEPTION 'Invalid state transition: Only draft or rejected events can be submitted';
  END IF;

  -- Update event
  UPDATE public.events 
  SET status = 'under_review', 
      updated_at = CURRENT_TIMESTAMP
  WHERE event_id = p_event_id;

  -- Insert initial pending approval for Faculty Mentor
  INSERT INTO public.event_approvals (event_id, approver_id, approver_level, decision)
  VALUES (p_event_id, '00000000-0000-0000-0000-000000000000', 'FACULTY_MENTOR', 'PENDING')
  ON CONFLICT (event_id, approver_level) 
  DO UPDATE SET decision = 'PENDING', remarks = NULL, decision_timestamp = NULL;
END;
$body;

CREATE OR REPLACE FUNCTION public.process_event_approval(
  p_event_id UUID, 
  p_level VARCHAR, 
  p_decision VARCHAR, 
  p_remarks TEXT
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $body
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
  v_expected_stage VARCHAR;
  v_next_stage VARCHAR;
BEGIN
  -- Get event context
  SELECT club_id, status INTO v_club_id, v_status 
  FROM public.events WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  IF v_status != 'under_review' THEN
    RAISE EXCEPTION 'Event must be in under_review state for approvals';
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

  -- Handle overall event status update and next pending stage
  IF p_decision = 'REJECTED' THEN
    UPDATE public.events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
  ELSIF p_decision = 'APPROVED' THEN
    IF p_level = 'DEAN_ADMIN' THEN
      UPDATE public.events SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
    ELSE
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
$body;


-- =================================================================================
-- PHASE 1: FIX REGISTRATION ATTENDEE NAME
-- =================================================================================

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_ticket_tier VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $body
DECLARE
  v_user_id UUID;
  v_status VARCHAR;
  v_capacity INT;
  v_registered INT;
  v_ticket_price NUMERIC;
  v_payment_status VARCHAR;
  v_registration_id UUID;
  v_user_name VARCHAR;
BEGIN
  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  SELECT name INTO v_user_name FROM public.users WHERE user_id = v_user_id;

  -- Lock the event row for concurrency safety
  SELECT status, expected_count, registered_count 
  INTO v_status, v_capacity, v_registered 
  FROM public.events 
  WHERE event_id = p_event_id 
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  IF v_status NOT IN ('published', 'upcoming') THEN
    RAISE EXCEPTION 'Event is not currently open for registration';
  END IF;

  IF v_registered >= v_capacity THEN
    RAISE EXCEPTION 'Event capacity reached';
  END IF;

  -- Check if ticket exists
  SELECT price INTO v_ticket_price 
  FROM public.tickets 
  WHERE event_id = p_event_id AND tier_name = p_ticket_tier;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid ticket tier';
  END IF;

  v_payment_status := CASE WHEN v_ticket_price > 0 THEN 'PENDING' ELSE 'FREE' END;

  -- Check for existing registration
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = p_event_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'User is already registered for this event';
  END IF;

  -- Insert Registration
  INSERT INTO public.event_registrations (
    event_id, user_id, attendee_name, ticket_tier, amount_paid, payment_status, qr_token
  ) VALUES (
    p_event_id, v_user_id, v_user_name, p_ticket_tier, v_ticket_price, v_payment_status, encode(gen_random_bytes(16), 'hex')
  ) RETURNING registration_id INTO v_registration_id;

  RETURN v_registration_id;
END;
$body;

