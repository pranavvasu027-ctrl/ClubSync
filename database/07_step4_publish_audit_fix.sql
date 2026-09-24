-- =================================================================================
-- STEP 4 FIX: ADD AUDIT LOG TO PUBLISH RPC
-- =================================================================================

CREATE OR REPLACE FUNCTION public.publish_event(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id VARCHAR;
  v_status VARCHAR;
  v_version INT;
  v_has_tickets BOOLEAN;
BEGIN
  SELECT club_id, status, current_version INTO v_club_id, v_status, v_version 
  FROM public.events 
  WHERE event_id = p_event_id;
  
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

  UPDATE public.events 
  SET status = 'published', updated_at = CURRENT_TIMESTAMP 
  WHERE event_id = p_event_id;

  INSERT INTO public.event_audit_log (event_id, version_number, action, previous_status, new_status, performed_by)
  VALUES (p_event_id, COALESCE(v_version, 1), 'PUBLISHED', 'approved', 'published', public.get_my_user_id());
END;
$$;
