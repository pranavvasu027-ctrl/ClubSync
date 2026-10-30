-- =================================================================================
-- PHASE 1: COMPLETE EDC EVENT CYCLE (RPCs)
-- =================================================================================

-- 1. Get the next required approval stage
CREATE OR REPLACE FUNCTION public.get_next_approval_stage(p_event_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_stage VARCHAR;
BEGIN
  -- Hierarchy: FACULTY_MENTOR -> RESOURCE_INCHARGE -> VERTICAL_COORDINATOR -> DEAN_ADMIN
  IF NOT EXISTS (SELECT 1 FROM public.event_approvals WHERE event_id = p_event_id AND approver_level = 'FACULTY_MENTOR' AND decision = 'APPROVED') THEN
    RETURN 'FACULTY_MENTOR';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.event_approvals WHERE event_id = p_event_id AND approver_level = 'RESOURCE_INCHARGE' AND decision = 'APPROVED') THEN
    RETURN 'RESOURCE_INCHARGE';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.event_approvals WHERE event_id = p_event_id AND approver_level = 'VERTICAL_COORDINATOR' AND decision = 'APPROVED') THEN
    RETURN 'VERTICAL_COORDINATOR';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.event_approvals WHERE event_id = p_event_id AND approver_level = 'DEAN_ADMIN' AND decision = 'APPROVED') THEN
    RETURN 'DEAN_ADMIN';
  END IF;

  RETURN 'ALL_APPROVED';
END;
$$;

-- 2. Process an approval decision
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
  v_expected_stage VARCHAR;
BEGIN
  -- Get event context
  SELECT club_id, status INTO v_club_id, v_status 
  FROM public.events WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  -- Must be in proposed state
  IF v_status != 'under_review' THEN
    RAISE EXCEPTION 'Event must be in under_review state for approvals';
  END IF;

  -- Validate sequential approval
  v_expected_stage := public.get_next_approval_stage(p_event_id);
  IF v_expected_stage != p_level THEN
    RAISE EXCEPTION 'Invalid approval sequence. Expected %, got %', v_expected_stage, p_level;
  END IF;

  -- Security Check based on level
  IF p_level = 'FACULTY_MENTOR' THEN
    IF NOT (public.has_club_role(v_club_id, ARRAY['Faculty_Advisor']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
      RAISE EXCEPTION 'Unauthorized: Only faculty mentor can approve at this stage';
    END IF;
  ELSIF p_level = 'RESOURCE_INCHARGE' THEN
    IF NOT public.has_platform_role(ARRAY['Resource_Incharge', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only resource in-charge can approve at this stage';
    END IF;
  ELSIF p_level = 'VERTICAL_COORDINATOR' THEN
    IF NOT public.has_platform_role(ARRAY['Vertical_Coordinator', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only vertical coordinator can approve at this stage';
    END IF;
  ELSIF p_level = 'DEAN_ADMIN' THEN
    IF NOT public.has_platform_role(ARRAY['Dean', 'Owner', 'Admin']) THEN
      RAISE EXCEPTION 'Unauthorized: Only dean can approve at this stage';
    END IF;
  END IF;

  -- Record the decision (upsert in case of previous rejections)
  INSERT INTO public.event_approvals (event_id, approver_id, approver_level, decision, remarks, decision_timestamp)
  VALUES (p_event_id, public.get_my_user_id(), p_level, p_decision, p_remarks, CURRENT_TIMESTAMP)
  ON CONFLICT (event_id, approver_level) 
  DO UPDATE SET 
    decision = p_decision,
    remarks = p_remarks,
    approver_id = public.get_my_user_id(),
    decision_timestamp = CURRENT_TIMESTAMP;

  -- Handle overall event status update
  IF p_decision = 'REJECTED' THEN
    UPDATE public.events SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
  ELSIF p_decision = 'APPROVED' AND p_level = 'DEAN_ADMIN' THEN
    -- Final approval! Moves to 'approved' for setup, before being manually 'published'
    UPDATE public.events SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
  END IF;

END;
$$;

-- 3. Publish Event (Readiness Check)
CREATE OR REPLACE FUNCTION public.publish_event(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
  v_has_tickets BOOLEAN;
BEGIN
  SELECT club_id, status INTO v_club_id, v_status FROM public.events WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  -- Must be President or Executive
  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
    RAISE EXCEPTION 'Unauthorized to publish event';
  END IF;

  -- Must be 'approved' to be published
  IF v_status != 'approved' THEN
    RAISE EXCEPTION 'Event must be approved by Dean/Admin before it can be published';
  END IF;

  -- Readiness Check: Must have at least one ticket tier configured
  SELECT EXISTS(SELECT 1 FROM public.tickets WHERE event_id = p_event_id) INTO v_has_tickets;
  IF NOT v_has_tickets THEN
    RAISE EXCEPTION 'Readiness failed: Event must have at least one ticket tier configured before publishing';
  END IF;

  UPDATE public.events SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;
END;
$$;

-- 4. Register for Event (Transaction Safe)
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_ticket_tier VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR;
  v_capacity INT;
  v_registered INT;
  v_ticket_price NUMERIC;
  v_payment_status VARCHAR;
  v_registration_id UUID;
BEGIN
  v_user_id := public.get_my_user_id();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

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
    event_id, user_id, ticket_tier, amount_paid, payment_status, qr_token
  ) VALUES (
    p_event_id, v_user_id, p_ticket_tier, v_ticket_price, v_payment_status, encode(gen_random_bytes(16), 'hex')
  ) RETURNING registration_id INTO v_registration_id;

  RETURN v_registration_id;
END;
$$;

-- 5. Scan QR & Check-in (Transaction Safe)
CREATE OR REPLACE FUNCTION public.scan_event_checkin(
  p_event_id UUID,
  p_qr_token VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_reg RECORD;
BEGIN
  -- Verify operator permissions
  SELECT club_id INTO v_club_id FROM public.events WHERE event_id = p_event_id;
  IF NOT (public.has_club_role(v_club_id, ARRAY['President', 'Executive', 'Volunteer']) OR public.has_platform_role(ARRAY['Owner', 'Admin'])) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized to scan check-ins');
  END IF;

  -- Lock registration for concurrency safety
  SELECT * INTO v_reg 
  FROM public.event_registrations 
  WHERE event_id = p_event_id AND qr_token = p_qr_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid QR Token or Ticket does not belong to this event');
  END IF;

  IF v_reg.check_in_status = 'ATTENDED' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ticket has already been checked in!');
  END IF;

  IF v_reg.payment_status NOT IN ('FREE', 'COMPLETED') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ticket payment is pending!');
  END IF;

  UPDATE public.event_registrations 
  SET check_in_status = 'ATTENDED', check_in_timestamp = CURRENT_TIMESTAMP 
  WHERE registration_id = v_reg.registration_id;

  RETURN jsonb_build_object('success', true, 'message', 'Check-in successful!', 'user_id', v_reg.user_id);
END;
$$;

-- 6. Add created_by to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL;

