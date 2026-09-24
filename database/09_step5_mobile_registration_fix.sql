-- Fix register_for_event to pull and insert attendee_prn and college_id

DROP FUNCTION IF EXISTS register_for_event(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id UUID,
  p_ticket_tier VARCHAR DEFAULT 'Standard Entry Pass'
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_name VARCHAR;
  v_user_prn VARCHAR;
  v_college_id VARCHAR;
  v_status VARCHAR;
  v_capacity INT;
  v_registered INT;
  v_ticket_price NUMERIC;
  v_payment_status VARCHAR;
  v_qr_token TEXT;
BEGIN
  -- Authenticate user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  SELECT name, prn_or_roll, college_id INTO v_user_name, v_user_prn, v_college_id FROM public.users WHERE user_id = v_user_id;

  -- Lock the event row for concurrency safety
  SELECT status, expected_count, registered_count, ticket_price 
  INTO v_status, v_capacity, v_registered, v_ticket_price 
  FROM public.events 
  WHERE event_id = p_event_id 
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  
  -- Event must be published or live
  IF v_status NOT IN ('published', 'live') THEN 
    RAISE EXCEPTION 'Event is not open for registration (Status: %)', v_status; 
  END IF;

  -- Check capacity
  IF v_capacity IS NOT NULL AND v_registered >= v_capacity THEN
    RAISE EXCEPTION 'Event is sold out!';
  END IF;

  -- Ensure not already registered
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = p_event_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already registered for this event';
  END IF;

  -- Determine payment status
  IF v_ticket_price <= 0 THEN
    v_payment_status := 'FREE';
  ELSE
    v_payment_status := 'COMPLETED'; -- Assume gateway success for now
  END IF;

  v_qr_token := encode(gen_random_bytes(16), 'hex');

  -- Insert registration with all fields
  INSERT INTO public.event_registrations (
    event_id, user_id, attendee_name, attendee_prn, college_id, ticket_tier, amount_paid, payment_status, qr_token
  ) VALUES (
    p_event_id, v_user_id, v_user_name, v_user_prn, v_college_id, p_ticket_tier, v_ticket_price, v_payment_status, v_qr_token
  );

  -- Update count
  UPDATE public.events 
  SET registered_count = registered_count + 1 
  WHERE event_id = p_event_id;

  RETURN v_qr_token;
END;
$$;
