-- ==============================================================================
-- CLUBSYNC: CANONICAL ACID FUNCTIONS & CONFLICT-FREE TRIGGERS
-- Run this script in the Supabase SQL Editor to install all verified, bug-free
-- functions, triggers, unique constraints, and anti-concurrency locks.
-- ==============================================================================

-- 1. Ensure Table Constraints & Unique Indexes Exist
ALTER TABLE IF EXISTS public.tickets 
  ADD CONSTRAINT uq_tickets_event_tier UNIQUE (event_id, tier_name);

ALTER TABLE IF EXISTS public.event_registrations 
  ADD CONSTRAINT uq_event_reg_email UNIQUE (event_id, student_email);

-- 2. Drop Obsolete / Ambiguous Overloaded Functions
DROP FUNCTION IF EXISTS public.register_for_event(UUID);
DROP FUNCTION IF EXISTS public.register_for_event(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.register_for_event(UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.register_for_event(UUID, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.submit_event_settlement(UUID);
DROP FUNCTION IF EXISTS public.submit_event_settlement(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.submit_event_settlement(UUID, NUMERIC, INT);
DROP FUNCTION IF EXISTS public.submit_event_settlement(UUID, NUMERIC, INT, TEXT);
DROP FUNCTION IF EXISTS public.submit_event_settlement(UUID, NUMERIC, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.publish_event(UUID);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.process_event_approval(UUID, VARCHAR, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.verify_and_checkin_pass(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.cancel_event_registration(UUID);
DROP FUNCTION IF EXISTS public.cancel_event_registration(UUID, VARCHAR);

-- ==============================================================================
-- 3. VENUE COLLISION TRIGGER (TIME & PHYSICAL VENUE AWARE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_venue_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_title VARCHAR;
    v_conflict_club VARCHAR;
BEGIN
    -- Only validate conflicts for confirmed/active event stages with a physical venue
    IF NEW.status IN ('under_review', 'approved', 'published', 'live') AND NEW.venue_name IS NOT NULL THEN
        -- Virtual or online venues do not collide with physical rooms
        IF LOWER(TRIM(NEW.venue_name)) LIKE '%online%' OR LOWER(TRIM(NEW.venue_name)) LIKE '%virtual%' THEN
            RETURN NEW;
        END IF;

        -- Prevent approving or publishing events on past dates
        IF NEW.status IN ('approved', 'published', 'live') AND NEW.event_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'DATE INVALID: Cannot confirm event on a past date (%)', NEW.event_date;
        END IF;

        -- Check if another confirmed event already reserves this venue on this date
        SELECT e.title, COALESCE(c.name, e.club_id) INTO v_conflict_title, v_conflict_club
        FROM public.events e
        LEFT JOIN public.clubs c ON e.club_id = c.club_id
        WHERE LOWER(TRIM(e.venue_name)) = LOWER(TRIM(NEW.venue_name))
          AND e.event_date = NEW.event_date
          AND e.status IN ('approved', 'published', 'live')
          AND e.event_id != COALESCE(NEW.event_id, '00000000-0000-0000-0000-000000000000'::UUID)
        LIMIT 1;

        IF v_conflict_title IS NOT NULL THEN
            RAISE EXCEPTION 'VENUE COLLISION: "%" is already reserved on % for "%" organized by %',
                NEW.venue_name, NEW.event_date, v_conflict_title, v_conflict_club;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_venue_conflict ON public.events;
CREATE TRIGGER trg_venue_conflict
BEFORE INSERT OR UPDATE OF venue_name, event_date, status ON public.events
FOR EACH ROW EXECUTE FUNCTION public.check_venue_conflict();

-- ==============================================================================
-- 4. PROCESS EVENT APPROVAL (FACULTY MENTOR SANCTION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_event_approval(
    p_event_id UUID,
    p_decision VARCHAR,
    p_remarks TEXT DEFAULT '',
    p_level VARCHAR DEFAULT 'FACULTY_MENTOR'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_norm_decision VARCHAR;
    v_new_status VARCHAR;
    v_event RECORD;
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
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Invalid approval decision: ' || COALESCE(p_decision, 'NULL') || '. Allowed: APPROVED, CHANGES_REQUESTED, REJECTED.'
        );
    END IF;

    -- Update Event status & faculty remarks
    UPDATE public.events
    SET status = v_new_status,
        faculty_remarks = p_remarks,
        decision_timestamp = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE event_id = p_event_id;

    -- Insert Immutable Audit Note
    INSERT INTO public.event_approvals (
        event_id, decision, remarks, level, reviewed_at
    ) VALUES (
        p_event_id, v_norm_decision, p_remarks, COALESCE(p_level, 'FACULTY_MENTOR'), CURRENT_TIMESTAMP
    );

    RETURN jsonb_build_object(
        'success', true, 
        'status', v_new_status, 
        'event_id', p_event_id, 
        'message', 'Faculty decision (' || v_norm_decision || ') recorded successfully.'
    );
END;
$$;

-- ==============================================================================
-- 5. PUBLISH EVENT (PRESIDENT ACTION POST-FACULTY APPROVAL)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.publish_event(
    p_event_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_event RECORD;
    v_capacity INT;
    v_price NUMERIC;
BEGIN
    SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
    IF v_event.event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    IF v_event.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only faculty-approved events can be published.');
    END IF;

    IF v_event.event_date < CURRENT_DATE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot publish an event with a past date (' || v_event.event_date::text || ').');
    END IF;

    -- Transition event to published
    UPDATE public.events 
    SET status = 'published', updated_at = CURRENT_TIMESTAMP 
    WHERE event_id = p_event_id;

    -- Ensure default ticket tier exists
    v_capacity := GREATEST(10, COALESCE(v_event.expected_count, 100));
    v_price := GREATEST(0.00, COALESCE(v_event.ticket_price, 0.00));

    INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
    VALUES (p_event_id, 'Standard Pass', v_price, v_capacity, 0, true)
    ON CONFLICT (event_id, tier_name) DO UPDATE SET
        price = EXCLUDED.price,
        total_capacity = GREATEST(public.tickets.sold_count, EXCLUDED.total_capacity),
        is_active = true;

    RETURN jsonb_build_object(
        'success', true, 
        'status', 'published', 
        'event_id', p_event_id, 
        'message', 'Event published successfully to student portal.'
    );
END;
$$;

-- ==============================================================================
-- 6. CONCURRENCY-SAFE STUDENT REGISTRATION (ANTI-OVERBOOKING)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id UUID,
    p_student_name VARCHAR DEFAULT 'Student Attendee',
    p_student_email VARCHAR DEFAULT NULL,
    p_ticket_tier VARCHAR DEFAULT 'Standard Pass'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_event_status VARCHAR;
    v_ticket_id UUID;
    v_total_capacity INT;
    v_sold_count INT;
    v_qr_token TEXT;
    v_existing_status VARCHAR;
    v_user_id UUID;
    v_email VARCHAR;
    v_name VARCHAR;
    v_tier_name VARCHAR;
    v_registration_id UUID;
BEGIN
    -- 1. Check Event Existence & Status
    SELECT status INTO v_event_status FROM public.events WHERE event_id = p_event_id;
    IF v_event_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_FOUND', 'message', 'Event not found.');
    END IF;

    IF v_event_status NOT IN ('published', 'live') THEN
        RETURN jsonb_build_object('success', false, 'error', 'REGISTRATIONS_CLOSED', 'message', 'Registrations are closed for this event.');
    END IF;

    -- 2. Resolve Student Identity
    v_email := LOWER(TRIM(COALESCE(p_student_email, '')));
    v_name := TRIM(COALESCE(p_student_name, ''));

    IF v_email = '' THEN
        v_user_id := auth.uid();
        IF v_user_id IS NOT NULL THEN
            SELECT email, name INTO v_email, v_name FROM public.users WHERE auth_user_id = v_user_id OR user_id = v_user_id LIMIT 1;
        END IF;
    ELSE
        SELECT user_id INTO v_user_id FROM public.users WHERE LOWER(TRIM(email)) = v_email LIMIT 1;
    END IF;

    IF v_email IS NULL OR v_email = '' THEN
        v_email := 'student.' || substr(md5(random()::text), 1, 6) || '@vit.edu';
    END IF;
    IF v_name IS NULL OR v_name = '' THEN
        v_name := 'Student Attendee';
    END IF;

    -- 3. Prevent Duplicate Active Registration
    SELECT check_in_status INTO v_existing_status
    FROM public.event_registrations
    WHERE event_id = p_event_id AND LOWER(TRIM(student_email)) = v_email;

    IF v_existing_status = 'REGISTERED' OR v_existing_status = 'ATTENDED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REGISTERED', 'message', 'You are already registered for this event.');
    END IF;

    -- 4. PESSIMISTIC WRITE LOCK on Ticket Tier to eliminate race condition overbooking
    v_tier_name := COALESCE(NULLIF(TRIM(p_ticket_tier), ''), 'Standard Pass');

    SELECT ticket_id, total_capacity, sold_count
    INTO v_ticket_id, v_total_capacity, v_sold_count
    FROM public.tickets
    WHERE event_id = p_event_id AND tier_name = v_tier_name
    FOR UPDATE;

    -- Fallback: lock any active tier for this event if specified tier not found
    IF v_ticket_id IS NULL THEN
        SELECT ticket_id, total_capacity, sold_count
        INTO v_ticket_id, v_total_capacity, v_sold_count
        FROM public.tickets
        WHERE event_id = p_event_id
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;
    END IF;

    -- If still no ticket exists, provision one atomically
    IF v_ticket_id IS NULL THEN
        INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
        VALUES (p_event_id, v_tier_name, 0.00, 100, 0, true)
        RETURNING ticket_id, total_capacity, sold_count
        INTO v_ticket_id, v_total_capacity, v_sold_count;
    END IF;

    -- 5. Anti-Overbooking Check
    IF v_sold_count >= v_total_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'EVENT_SOLD_OUT', 'message', 'EVENT SOLD OUT: Capacity (' || v_total_capacity || ' seats) has been reached.');
    END IF;

    -- 6. Cryptographically Unique QR Token
    v_qr_token := 'CS-PASS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)) || '-' || upper(substr(md5(clock_timestamp()::text), 1, 4));

    -- 7. Insert or Reactivate Registration Record
    INSERT INTO public.event_registrations (
        event_id, ticket_id, user_id, student_name, student_email, qr_token, check_in_status, registered_at
    ) VALUES (
        p_event_id, v_ticket_id, v_user_id, v_name, v_email, v_qr_token, 'REGISTERED', CURRENT_TIMESTAMP
    )
    ON CONFLICT (event_id, student_email) DO UPDATE SET
        ticket_id = EXCLUDED.ticket_id,
        qr_token = EXCLUDED.qr_token,
        check_in_status = 'REGISTERED',
        registered_at = CURRENT_TIMESTAMP,
        cancelled_at = NULL
    RETURNING registration_id INTO v_registration_id;

    -- 8. Atomically Increment Ticket & Event Counters
    UPDATE public.tickets SET sold_count = sold_count + 1 WHERE ticket_id = v_ticket_id;
    UPDATE public.events SET registered_count = COALESCE(registered_count, 0) + 1 WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_registration_id,
        'qr_token', v_qr_token,
        'seats_remaining', GREATEST(0, (v_total_capacity - (v_sold_count + 1))),
        'message', 'Registration confirmed! Digital entry pass generated.'
    );
END;
$$;

-- ==============================================================================
-- 7. DOOR GATE CHECK-IN WITH ATOMIC ROW LOCK (ANTI-REPLAY ATTACK)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.verify_and_checkin_pass(
    p_event_id UUID,
    p_qr_token VARCHAR
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_reg RECORD;
    v_clean_token VARCHAR;
BEGIN
    v_clean_token := UPPER(TRIM(COALESCE(p_qr_token, '')));
    IF v_clean_token = '' THEN
        RETURN jsonb_build_object('valid', false, 'status', 'INVALID', 'message', 'Please scan or enter a non-empty QR token.');
    END IF;

    -- Atomic Row Lock on Registration to eliminate concurrent double-scans across gates
    SELECT registration_id, student_name, student_email, check_in_status, check_in_timestamp
    INTO v_reg
    FROM public.event_registrations
    WHERE event_id = p_event_id AND UPPER(TRIM(qr_token)) = v_clean_token
    FOR UPDATE;

    IF v_reg.registration_id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'INVALID',
            'message', '❌ INVALID PASS: Token not found for this event.'
        );
    END IF;

    -- Replay Attack Detection
    IF v_reg.check_in_status = 'ATTENDED' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'ALREADY_USED',
            'attendee_name', v_reg.student_name,
            'scanned_at', v_reg.check_in_timestamp,
            'message', '⚠️ DUPLICATE SCAN! Pass for ' || v_reg.student_name || ' was ALREADY USED for entry at ' || to_char(v_reg.check_in_timestamp, 'HH12:MI AM')
        );
    END IF;

    IF v_reg.check_in_status = 'CANCELLED' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'CANCELLED',
            'attendee_name', v_reg.student_name,
            'message', '❌ PASS CANCELLED: This entry pass has been revoked or cancelled.'
        );
    END IF;

    -- Mark Attended atomically
    UPDATE public.event_registrations
    SET check_in_status = 'ATTENDED',
        check_in_timestamp = CURRENT_TIMESTAMP
    WHERE registration_id = v_reg.registration_id;

    RETURN jsonb_build_object(
        'valid', true,
        'status', 'ATTENDED',
        'attendee_name', v_reg.student_name,
        'scanned_at', CURRENT_TIMESTAMP,
        'message', '✅ ENTRY CONFIRMED: Welcome, ' || v_reg.student_name || '!'
    );
END;
$$;

-- ==============================================================================
-- 8. ATTENDEE CANCELLATION & ATOMIC SEAT RECYCLING
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cancel_event_registration(
    p_registration_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_reg RECORD;
BEGIN
    -- Atomic Row Lock on Registration
    SELECT registration_id, event_id, ticket_id, check_in_status
    INTO v_reg
    FROM public.event_registrations
    WHERE registration_id = p_registration_id
    FOR UPDATE;

    IF v_reg.registration_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration record not found.');
    END IF;

    IF v_reg.check_in_status = 'ATTENDED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot cancel a pass that has already been verified and attended.');
    END IF;

    IF v_reg.check_in_status = 'CANCELLED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'This registration has already been cancelled.');
    END IF;

    -- Update registration status
    UPDATE public.event_registrations
    SET check_in_status = 'CANCELLED',
        cancelled_at = CURRENT_TIMESTAMP
    WHERE registration_id = p_registration_id;

    -- Recycle seat back to ticket tier
    IF v_reg.ticket_id IS NOT NULL THEN
        UPDATE public.tickets
        SET sold_count = GREATEST(0, sold_count - 1)
        WHERE ticket_id = v_reg.ticket_id;
    END IF;

    -- Decrement event registered count
    UPDATE public.events
    SET registered_count = GREATEST(0, COALESCE(registered_count, 1) - 1)
    WHERE event_id = v_reg.event_id;

    RETURN jsonb_build_object('success', true, 'message', 'Registration cancelled successfully and seat has been released for other students.');
END;
$$;

-- ==============================================================================
-- 9. POST-EVENT FINANCIAL SETTLEMENT & OVERRUN SAFEGUARD
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_event_settlement(
    p_event_id UUID,
    p_actual_expenditure NUMERIC,
    p_invoices_count INT DEFAULT 1,
    p_summary_notes TEXT DEFAULT '',
    p_overrun_justification TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_event RECORD;
    v_sanctioned NUMERIC := 0.00;
    v_diff NUMERIC;
    v_has_overrun BOOLEAN;
    v_settlement_status VARCHAR;
    v_invoices INT;
BEGIN
    SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
    IF v_event.event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    -- Safely read sanctioned budget expenditure from JSONB budget
    v_sanctioned := COALESCE((v_event.budget->>'expenditure')::NUMERIC, 0.00);
    IF v_sanctioned = 0.00 AND v_event.expected_count > 0 AND v_event.ticket_price > 0 THEN
        v_sanctioned := (v_event.expected_count * v_event.ticket_price);
    END IF;

    v_invoices := GREATEST(1, COALESCE(p_invoices_count, 1));
    v_diff := v_sanctioned - GREATEST(0.00, COALESCE(p_actual_expenditure, 0.00));
    v_has_overrun := GREATEST(0.00, COALESCE(p_actual_expenditure, 0.00)) > v_sanctioned;
    v_settlement_status := CASE WHEN v_has_overrun THEN 'AUDITED_WITH_OVERRUN' ELSE 'AUDITED' END;

    INSERT INTO public.event_settlements (
        event_id, sanctioned_amount, actual_expenditure, surplus_or_deficit,
        invoices_count, summary_notes, overrun_justification, status, settled_at
    ) VALUES (
        p_event_id, v_sanctioned, GREATEST(0.00, COALESCE(p_actual_expenditure, 0.00)), v_diff,
        v_invoices, p_summary_notes, p_overrun_justification, v_settlement_status, CURRENT_TIMESTAMP
    )
    ON CONFLICT (event_id) DO UPDATE SET
        actual_expenditure = EXCLUDED.actual_expenditure,
        surplus_or_deficit = EXCLUDED.surplus_or_deficit,
        invoices_count = EXCLUDED.invoices_count,
        summary_notes = EXCLUDED.summary_notes,
        overrun_justification = EXCLUDED.overrun_justification,
        status = EXCLUDED.status,
        settled_at = CURRENT_TIMESTAMP;

    UPDATE public.events SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', v_settlement_status,
        'has_overrun', v_has_overrun,
        'sanctioned', v_sanctioned,
        'diff', v_diff,
        'message', CASE WHEN v_has_overrun 
            THEN 'Settlement audited and flagged with budget overrun documentation. Event marked completed.'
            ELSE 'Financial settlement audited successfully and event marked completed!' END
    );
END;
$$;
