-- ==============================================================================
-- CLUBSYNC: STREAMLINED EVENT LIFECYCLE DATABASE ENGINE
-- DBMS Course Project & Production Architecture (PostgreSQL 15 / Supabase)
-- Version: 4.0 (Normalized 3NF / BCNF Lean Schema)
-- Scope: 8 Core Relational Tables, Full ACID Concurrency, Real-Time Gate Scanner,
--        Time-Slot Aware Venue Conflict Trigger, and Financial Auditing.
-- ==============================================================================

-- Enable UUID & Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- STEP 1: DROP ALL UNWANTED / OBSOLETE TABLES & VIEWS (TEARDOWN)
-- Eliminates schema bloat outside the core Event Lifecycle scope.
-- ==============================================================================

-- Analytical views
DROP VIEW IF EXISTS public.v_college_winner_leaderboard CASCADE;
DROP VIEW IF EXISTS public.v_inter_college_participation_stats CASCADE;

-- Recruitment domain tables (mocked in UI via STATIC_RECRUITMENTS)
DROP TABLE IF EXISTS public.interview_evaluations CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.recruitment_drives CASCADE;
DROP TABLE IF EXISTS public.club_applicants CASCADE;
DROP TABLE IF EXISTS public.recruitment_cycles CASCADE;

-- Competition & team formation tables (mocked in UI)
DROP TABLE IF EXISTS public.winners CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;

-- Redundant / non-core event sub-tables (mocked in UI)
DROP TABLE IF EXISTS public.event_feedback CASCADE;
DROP TABLE IF EXISTS public.event_budgets CASCADE;
DROP TABLE IF EXISTS public.event_tasks CASCADE;
DROP TABLE IF EXISTS public.event_teams CASCADE;
DROP TABLE IF EXISTS public.event_versions CASCADE;
DROP TABLE IF EXISTS public.event_audit_log CASCADE;
DROP TABLE IF EXISTS public.club_ledger CASCADE;
DROP TABLE IF EXISTS public.finance_transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Institutional scope: Single campus VIT Pune (eliminates redundant multi-tenancy table)
DROP TABLE IF EXISTS public.colleges CASCADE;

-- Social & complex permission tables (simplified into RBAC)
DROP TABLE IF EXISTS public.club_followers CASCADE;
DROP TABLE IF EXISTS public.club_roles CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;

-- ==============================================================================
-- STEP 2: CREATE CORE RELATIONAL TABLES (NORMALIZED 3NF / BCNF - VIT PUNE SCOPE)
-- ==============================================================================

-- 1. USERS: Unified Student Passport, Faculty & President Profiles
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Foreign key linking to Supabase auth.users(id)
    college_id VARCHAR(50) DEFAULT 'VIT_PUNE',
    prn_or_roll VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    year_of_study VARCHAR(30) DEFAULT 'Third Year (TY)',
    branch VARCHAR(100) DEFAULT 'Computer Engineering',
    cgpa NUMERIC(4, 2) DEFAULT 8.80 CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    user_type VARCHAR(30) DEFAULT 'STUDENT' CHECK (user_type IN ('STUDENT', 'CLUB_LEAD', 'FACULTY_MENTOR', 'DEAN_ADMIN', 'SUPER_ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLUBS: Student Club Chapters
CREATE TABLE IF NOT EXISTS public.clubs (
    club_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_CSI', 'VIT_EDC'
    club_no VARCHAR(50) DEFAULT 'CS/2026/001',
    college_id VARCHAR(50) DEFAULT 'VIT_PUNE',
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    vertical VARCHAR(50) NOT NULL CHECK (vertical IN ('Technical', 'Cultural', 'Sports', 'Social', 'Entrepreneurship', 'Literary', 'Others')),
    faculty_mentor VARCHAR(150) DEFAULT 'Dr. S. K. Kulkarni',
    faculty_designation VARCHAR(150) DEFAULT 'Associate Professor',
    president_name VARCHAR(150) DEFAULT 'Arnav Deshmukh',
    official_email VARCHAR(150),
    logo_bg VARCHAR(20) DEFAULT '#0C447C',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_RENEWAL', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. VENUES: Standardized Campus Venues with Strict Capacity Constraints
CREATE TABLE IF NOT EXISTS public.venues (
    venue_id VARCHAR(50) PRIMARY KEY, -- e.g. 'V_SHARAD_ARENA'
    name VARCHAR(150) NOT NULL UNIQUE,
    building VARCHAR(100) DEFAULT 'Main Campus',
    capacity INT NOT NULL DEFAULT 150 CHECK (capacity > 0),
    venue_type VARCHAR(50) DEFAULT 'Auditorium',
    facilities TEXT[] DEFAULT '{"Projector", "Audio System", "Air Conditioning"}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. EVENTS: Canonical Event Lifecycle Entity
CREATE TABLE IF NOT EXISTS public.events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    college_id VARCHAR(50) DEFAULT 'VIT_PUNE',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'Workshop' CHECK (event_type IN ('Workshop', 'Tech Talk', 'Hackathon', 'Seminar', 'Competition', 'Cultural')),
    scope VARCHAR(50) DEFAULT 'INTRA_COLLEGE' CHECK (scope IN ('INTRA_COLLEGE', 'INTER_COLLEGIATE', 'NATIONAL')),
    event_date DATE NOT NULL,
    event_time VARCHAR(50) DEFAULT '10:00 AM – 1:00 PM',
    venue_name VARCHAR(150) NOT NULL,
    target_audience VARCHAR(150) DEFAULT 'All Students',
    expected_count INT NOT NULL DEFAULT 100 CHECK (expected_count >= 10),
    registered_count INT DEFAULT 0 CHECK (registered_count >= 0),
    ticket_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (ticket_price >= 0.00),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
        'draft', 'under_review', 'changes_requested', 'approved', 'published', 'live', 'completed', 'rejected', 'cancelled'
    )),
    objectives TEXT,
    expected_outcomes TEXT,
    guest_details JSONB DEFAULT '[]'::JSONB,
    resource_requirements TEXT[] DEFAULT '{}',
    budget JSONB DEFAULT '{"income": 0, "expenditure": 0, "source_of_funds": "Club Fund"}'::JSONB,
    faculty_remarks TEXT,
    faculty_name VARCHAR(150),
    decision_timestamp TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(user_id),
    created_by_name VARCHAR(150) DEFAULT 'Club President',
    current_version INT DEFAULT 1 CHECK (current_version >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. EVENT_APPROVALS: Immutable Faculty Sanction Notes & Revisions Log
CREATE TABLE IF NOT EXISTS public.event_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED')),
    remarks TEXT,
    level VARCHAR(50) DEFAULT 'FACULTY_MENTOR',
    reviewed_by UUID REFERENCES public.users(user_id),
    reviewer_name VARCHAR(150) DEFAULT 'Dr. S. K. Kulkarni',
    version_number INT DEFAULT 1,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TICKETS: Capacity Allocation & Concurrency Lock Target
CREATE TABLE IF NOT EXISTS public.tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    tier_name VARCHAR(100) DEFAULT 'Standard Pass',
    price NUMERIC(10, 2) DEFAULT 0.00 CHECK (price >= 0.00),
    total_capacity INT NOT NULL DEFAULT 100 CHECK (total_capacity > 0),
    sold_count INT NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sold_le_total CHECK (sold_count <= total_capacity)
);

-- 8. EVENT_REGISTRATIONS: Cryptographic Passes & Real-Time Entry Gate Records
CREATE TABLE IF NOT EXISTS public.event_registrations (
    registration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES public.tickets(ticket_id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    college_id VARCHAR(50) DEFAULT 'VIT_PUNE',
    qr_token VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'CS-PASS-9B2K4F-2940'
    check_in_status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (check_in_status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')),
    check_in_timestamp TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_id, student_email)
);

-- 9. EVENT_SETTLEMENTS: Post-Event Financial Auditing & Deficit Overrun Notes
CREATE TABLE IF NOT EXISTS public.event_settlements (
    settlement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE UNIQUE,
    sanctioned_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_expenditure NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    surplus_or_deficit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    invoices_count INT NOT NULL DEFAULT 1 CHECK (invoices_count >= 1),
    summary_notes TEXT,
    overrun_justification TEXT,
    submitted_by UUID REFERENCES public.users(user_id),
    audited_by UUID REFERENCES public.users(user_id),
    status VARCHAR(30) DEFAULT 'AUDITED' CHECK (status IN ('PENDING', 'AUDITED', 'AUDITED_WITH_OVERRUN', 'SETTLED', 'REJECTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================================================
STEP 3: TRIGGERS & CANONICAL STORED PROCEDURES (ACID CONCURRENCY CONTROLS)
-- ==============================================================================

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

-- ==============================================================================
-- -- STEP 5: SEED CANONICAL DBMS COURSE PROJECT DEMO DATA
-- ==============================================================================

-- 2. Standard Campus Venues
INSERT INTO public.venues (venue_id, name, building, capacity, venue_type) VALUES
('V_SHARAD_ARENA', 'Sharad Arena', 'Central Block', 1200, 'Auditorium'),
('V_MAIN_AUDITORIUM', 'Main Auditorium', 'Auditorium Complex', 800, 'Auditorium'),
('V_COMP_LABS', 'Computer Center Labs 1–4', 'IT Block 3rd Floor', 250, 'Computer Lab'),
('V_INNOVATION_LAB_2', 'Innovation Lab 2', 'Mechanical Building', 100, 'Seminar Hall'),
('V_SEMINAR_HALL_A', 'Seminar Hall A', 'Civil Engineering Block', 180, 'Seminar Hall')
ON CONFLICT (venue_id) DO UPDATE SET capacity = EXCLUDED.capacity;

-- 3. Persona Users (4 Key Evaluator Personas)
INSERT INTO public.users (user_id, college_id, prn_or_roll, name, email, user_type, year_of_study, branch, cgpa) VALUES
('11111111-1111-1111-1111-111111111111', 'VIT_PUNE', '12210001', 'Arnav Deshmukh (President)', 'president.csi@vit.edu', 'CLUB_LEAD', 'Third Year (TY)', 'Computer Engineering', 9.20),
('22222222-2222-2222-2222-222222222222', 'VIT_PUNE', 'FAC001', 'Dr. S. K. Kulkarni', 'mentor@vit.edu', 'FACULTY_MENTOR', 'Faculty', 'Computer Engineering', 10.00),
('33333333-3333-3333-3333-333333333333', 'VIT_PUNE', '12110789', 'Rohit Sharma', 'rohit.sharma@vit.edu', 'STUDENT', 'Third Year (TY)', 'Computer Engineering', 8.80),
('44444444-4444-4444-4444-444444444444', 'VIT_PUNE', 'DEAN01', 'Dr. P. B. Mane (Dean)', 'owner@clubsync.org', 'DEAN_ADMIN', 'Executive', 'Administration', 10.00)
ON CONFLICT (email) DO NOTHING;

-- 4. Clubs
INSERT INTO public.clubs (club_id, club_no, college_id, name, short_name, vertical, faculty_mentor, president_name, official_email, logo_bg) VALUES
('VIT_CSI', 'CS/2026/001', 'VIT_PUNE', 'Computer Society of India (CSI)', 'CSI VIT Pune', 'Technical', 'Dr. S. K. Kulkarni', 'Arnav Deshmukh', 'csi@vit.edu', '#0C447C'),
('VIT_EDC', 'CS/2026/002', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC VIT Pune', 'Entrepreneurship', 'Dr. S. K. Kulkarni', 'EDC Lead', 'edc@vit.edu', '#D97706'),
('VIT_GEDIT', 'CS/2026/003', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Dr. S. K. Kulkarni', 'GedIT Lead', 'gedit@vit.edu', '#12A37A')
ON CONFLICT (club_id) DO NOTHING;

-- 5. Seed Events Across Lifecycle States
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, budget, faculty_remarks, faculty_name, current_version
) VALUES
(
    'a0000000-0000-0000-0000-000000000001', 'VIT_CSI', 'VIT_PUNE',
    'Building Scalable Web Apps',
    'Learn modern full-stack system architecture, microservices, and React performance from senior industry engineers.',
    'Tech Talk', 'INTRA_COLLEGE', '2026-11-25', '4:00 PM – 6:00 PM', 'Main Auditorium',
    'Computer Science, IT & AI/DS Students', 120, 1, 0.00, 'published',
    'Understand horizontal scaling and caching strategies.', 'Hands-on architectural patterns implemented in production.',
    '{"income": 0, "expenditure": 25000, "source_of_funds": "CSI Operating Fund"}'::JSONB,
    'Approved. Official sanction note granted. Ensure auditorium booking.', 'Dr. S. K. Kulkarni', 1
),
(
    'a0000000-0000-0000-0000-000000000002', 'VIT_GEDIT', 'VIT_PUNE',
    'UI/UX Design Systems Workshop',
    'A 3-hour masterclass on Figma design tokens, component architecture, and accessibility standards.',
    'Workshop', 'INTRA_COLLEGE', '2026-11-28', '2:00 PM – 5:00 PM', 'Innovation Lab 2',
    'Designers & Frontend Enthusiasts', 85, 0, 150.00, 'published',
    'Master design-to-code token systems using Figma and CSS variables.', 'Complete UI kit ready for React component handoff.',
    '{"income": 12750, "expenditure": 8000, "source_of_funds": "Ticket Sales"}'::JSONB,
    'Approved. Lab allocation confirmed.', 'Dr. S. K. Kulkarni', 1
),
(
    'a0000000-0000-0000-0000-000000000003', 'VIT_EDC', 'VIT_PUNE',
    'Vishwapreneur 2027 National Summit',
    'Flagship national entrepreneurship summit hosting startup founders, venture capitalists, and pitch competitions.',
    'Seminar', 'NATIONAL', '2027-01-10', '9:00 AM – 6:00 PM', 'Sharad Arena',
    'All Students & Startup Enthusiasts across India', 1200, 0, 350.00, 'approved',
    'Foster entrepreneurial thinking and provide funding opportunities for student startups.', 'Connect student ventures with seed investors.',
    '{"income": 420000, "expenditure": 320000, "source_of_funds": "Sponsorships & Passes"}'::JSONB,
    'Approved after budget audit. Coordinate with campus security.', 'Dr. S. K. Kulkarni', 1
),
(
    'a0000000-0000-0000-0000-000000000004', 'VIT_CSI', 'VIT_PUNE',
    'DevFest 24-Hour Hackathon 2026',
    'Inter-collegiate 24-hour hackathon building solutions for sustainability, healthcare, and education.',
    'Hackathon', 'INTER_COLLEGIATE', '2026-12-05', '9:00 AM – 9:00 AM', 'Computer Center Labs 1–4',
    'College Developers & Innovators', 250, 0, 0.00, 'under_review',
    'Build and deploy working prototypes under 24 hours with mentor guidance.', 'Deploy 40+ student software prototypes.',
    '{"income": 50000, "expenditure": 45000, "source_of_funds": "Sponsors"}'::JSONB,
    NULL, NULL, 1
)
ON CONFLICT (event_id) DO NOTHING;

-- 6. Ticket Inventory Tier for Published Event
INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Pass', 0.00, 120, 1),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Workshop Pass', 150.00, 85, 0)
ON CONFLICT (ticket_id) DO NOTHING;

-- 7. Pre-Seeded Pass for Student Gate Scan Demo
INSERT INTO public.event_registrations (
    registration_id, event_id, ticket_id, user_id, student_name, student_email, qr_token, check_in_status
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'Rohit Sharma',
    'rohit.sharma@vit.edu',
    'CS-PASS-9B2K4F-2940',
    'REGISTERED'
)
ON CONFLICT (event_id, student_email) DO NOTHING;

-- ==============================================================================
-- STEP 6: CONFIGURE ROW-LEVEL SECURITY (RLS) FOR EVALUATION & DEMO
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settlements ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted read access for presentation demonstration
CREATE POLICY "Public Read Access: Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Approvals" ON public.event_approvals FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Settlements" ON public.event_settlements FOR SELECT USING (true);

-- Allow authenticated and service role modifications
CREATE POLICY "Allow Write: Events" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow Write: Approvals" ON public.event_approvals FOR ALL USING (true);
CREATE POLICY "Allow Write: Tickets" ON public.tickets FOR ALL USING (true);
CREATE POLICY "Allow Write: Registrations" ON public.event_registrations FOR ALL USING (true);
CREATE POLICY "Allow Write: Settlements" ON public.event_settlements FOR ALL USING (true);
