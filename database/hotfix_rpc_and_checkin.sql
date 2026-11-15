-- ==============================================================================
-- CLUBSYNC: FINAL POLISH HOTFIX (RPC OVERLOAD & DEMO AUTH)
-- Run this in Supabase SQL Editor.
-- Fixes:
--   1. Drop duplicate verify_and_checkin_pass signature
--   2. Allow process_event_approval in demo mode (sets app.rpc_context)
--   3. Allow publish_event in demo mode (sets app.rpc_context)
-- ==============================================================================

-- 1. Drop old duplicate verify_and_checkin_pass signature
DROP FUNCTION IF EXISTS public.verify_and_checkin_pass(UUID, VARCHAR);

-- 2. Make process_event_approval work seamlessly for demo and authenticated users
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
    v_event RECORD;
    v_user_id UUID;
    v_reviewer_name VARCHAR;
BEGIN
    SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
    IF v_event.event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

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

    -- Resolve reviewer: authenticated user or fallback to faculty mentor
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT user_id, name INTO v_user_id, v_reviewer_name FROM public.users WHERE user_type = 'FACULTY_MENTOR' LIMIT 1;
    ELSE
        SELECT name INTO v_reviewer_name FROM public.users WHERE user_id = v_user_id OR auth_user_id = v_user_id;
    END IF;

    -- Set RPC context to bypass direct update trigger
    PERFORM set_config('app.rpc_context', 'true', true);

    -- Update Event
    UPDATE public.events
    SET status = v_new_status,
        faculty_remarks = p_remarks,
        faculty_name = COALESCE(v_reviewer_name, 'Dr. S. K. Kulkarni'),
        decision_timestamp = NOW(),
        updated_at = NOW()
    WHERE event_id = p_event_id;

    -- Insert approval record if event_approvals exists
    BEGIN
        INSERT INTO public.event_approvals (
            approval_id, event_id, approval_level, status, comments, approved_by, reviewed_at
        ) VALUES (
            gen_random_uuid(), p_event_id, p_level, v_norm_decision, p_remarks, v_user_id, NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Event status updated to ' || v_new_status || ' by faculty mentor.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_event_approval(UUID, VARCHAR, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- 3. Make publish_event work seamlessly for demo and authenticated users
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

    IF v_event.status NOT IN ('approved', 'live') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only approved events can be published.');
    END IF;

    -- Set RPC context to bypass direct update trigger
    PERFORM set_config('app.rpc_context', 'true', true);

    UPDATE public.events SET status = 'published', updated_at = NOW() WHERE event_id = p_event_id;

    -- Ensure ticket exists
    INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count, is_active)
    VALUES (gen_random_uuid(), p_event_id, 'Standard Pass', COALESCE(v_event.ticket_price, 0), COALESCE(v_event.expected_count, 100), 0, true)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true, 'message', 'Event published to Student Portal.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_event(UUID) TO anon, authenticated, service_role;
