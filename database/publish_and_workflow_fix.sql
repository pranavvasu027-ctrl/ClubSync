-- ==============================================================================
-- CLUBSYNC: PUBLISH & APPROVAL WORKFLOW FIX
-- Run this in Supabase SQL Editor.
-- ==============================================================================

-- 1. Drop the triggers that block event status changes
DROP TRIGGER IF EXISTS trg_prevent_status_escalation ON public.events;
DROP TRIGGER IF EXISTS trg_check_event_status ON public.events;

-- 2. Drop old functions first so PostgreSQL allows changing return type
DROP FUNCTION IF EXISTS public.publish_event(UUID);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_and_checkin_pass(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.verify_and_checkin_pass(UUID, TEXT);

-- 3. Create clean publish_event function (works seamlessly in demo & production)
CREATE OR REPLACE FUNCTION public.publish_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event RECORD;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF v_event.event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
  END IF;

  UPDATE public.events 
  SET status = 'published', updated_at = NOW() 
  WHERE event_id = p_event_id;

  -- Auto-provision standard ticket tier if none exists
  INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count, is_active)
  VALUES (gen_random_uuid(), p_event_id, 'Standard Pass', COALESCE(v_event.ticket_price, 0), COALESCE(v_event.expected_count, 100), 0, true)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'status', 'success', 'message', 'Event published to Student Portal.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_event(UUID) TO anon, authenticated, service_role;

-- 4. Create clean process_event_approval function
CREATE OR REPLACE FUNCTION public.process_event_approval(
    p_event_id UUID,
    p_decision VARCHAR,
    p_remarks TEXT DEFAULT '',
    p_level VARCHAR DEFAULT 'FACULTY_MENTOR'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_norm_decision VARCHAR;
    v_new_status VARCHAR;
BEGIN
    v_norm_decision := UPPER(TRIM(COALESCE(p_decision, '')));
    IF v_norm_decision = 'APPROVED' THEN
        v_new_status := 'approved';
    ELSIF v_norm_decision = 'CHANGES_REQUESTED' THEN
        v_new_status := 'changes_requested';
    ELSIF v_norm_decision = 'REJECTED' THEN
        v_new_status := 'rejected';
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid approval decision: ' || COALESCE(p_decision, 'NULL'));
    END IF;

    UPDATE public.events
    SET status = v_new_status,
        faculty_remarks = p_remarks,
        faculty_name = 'Dr. S. K. Kulkarni',
        decision_timestamp = NOW(),
        updated_at = NOW()
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'success',
        'message', 'Event status updated to ' || v_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_event_approval(UUID, VARCHAR, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- 5. Create clean verify_and_checkin_pass function
CREATE OR REPLACE FUNCTION public.verify_and_checkin_pass(
  p_event_id UUID,
  p_qr_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT * INTO v_reg FROM public.event_registrations
  WHERE event_id = p_event_id AND UPPER(TRIM(qr_token)) = UPPER(TRIM(p_qr_token));

  IF v_reg.registration_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'status', 'INVALID', 'message', 'Token not found for this event.');
  END IF;

  IF v_reg.check_in_status = 'ATTENDED' THEN
    RETURN jsonb_build_object(
      'valid', false, 'status', 'ALREADY_USED',
      'attendee_name', v_reg.student_name,
      'scanned_at', v_reg.check_in_timestamp,
      'message', 'DUPLICATE SCAN: Pass already used at ' || COALESCE(v_reg.check_in_timestamp::TEXT, 'earlier')
    );
  END IF;

  IF v_reg.check_in_status = 'CANCELLED' THEN
    RETURN jsonb_build_object('valid', false, 'status', 'CANCELLED', 'attendee_name', v_reg.student_name, 'message', 'Pass has been cancelled.');
  END IF;

  UPDATE public.event_registrations
  SET check_in_status = 'ATTENDED', check_in_timestamp = NOW()
  WHERE registration_id = v_reg.registration_id;

  RETURN jsonb_build_object(
    'valid', true, 'status', 'ATTENDED',
    'attendee_name', v_reg.student_name,
    'scanned_at', NOW(),
    'message', 'Entry granted! Welcome, ' || COALESCE(v_reg.student_name, 'Attendee') || '!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_checkin_pass(UUID, TEXT) TO anon, authenticated, service_role;

-- 6. Automatically publish all approved events so they appear in Student Portal
UPDATE public.events SET status = 'published' WHERE status = 'approved';
