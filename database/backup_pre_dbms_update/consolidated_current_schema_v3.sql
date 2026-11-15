-- ==============================================================================
-- CLUBSYNC DATABASE: BASELINE SNAPSHOT (PRE-DBMS COURSE PROJECT & EVENT CYCLE UPDATE)
-- Version: 3.1.0-SNAPSHOT
-- Snapshot Timestamp: 2026-11-15T08:50:00+05:30
-- Description: Consolidated snapshot of all active tables, foreign keys, constraints,
--              triggers, functions, analytical views, storage buckets, and RLS policies
--              prior to normalizations and DBMS course project refactoring.
-- ==============================================================================

-- Enable Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. INSTITUTIONS / COLLEGES (MULTI-TENANT ROOTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.colleges (
    college_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_PUNE', 'COEP_TECH', 'IIT_BOMBAY'
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    campus_locations TEXT[] DEFAULT '{"Main Campus"}',
    email_domain VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'vit.edu'
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. USERS & PROFILES (UNIFIED STUDENT PASSPORT & AUTH SYNC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Linked to Supabase auth.users(id)
    college_id VARCHAR(50) REFERENCES public.colleges(college_id) ON DELETE SET NULL,
    college_name VARCHAR(255),
    prn_or_roll VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    year_of_study VARCHAR(30) DEFAULT 'First Year (FY)',
    branch VARCHAR(100) DEFAULT 'Computer Engineering',
    cgpa NUMERIC(4, 2) DEFAULT 8.50 CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    user_type VARCHAR(30) DEFAULT 'STUDENT' CHECK (user_type IN ('STUDENT', 'CLUB_LEAD', 'FACULTY_MENTOR', 'VERTICAL_COORDINATOR', 'DEAN_ADMIN', 'SUPER_ADMIN')),
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    github_handle VARCHAR(100),
    linkedin_handle VARCHAR(100),
    avatar_url TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. VENUES & PHYSICAL INFRASTRUCTURE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.venues (
    venue_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    building VARCHAR(100) DEFAULT 'Main Campus',
    capacity INT NOT NULL DEFAULT 150,
    venue_type VARCHAR(50) DEFAULT 'Auditorium',
    facilities TEXT[] DEFAULT '{"Projector", "Audio System", "Air Conditioning"}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. CLUBS, ROLES, MEMBERSHIPS & SOCIAL FOLLOWERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    club_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_GEDIT', 'VIT_EDC'
    club_no VARCHAR(50) DEFAULT 'CS/2026/001',
    college_id VARCHAR(50) NOT NULL REFERENCES public.colleges(college_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    tagline TEXT,
    vertical VARCHAR(50) NOT NULL CHECK (vertical IN ('Technical', 'Cultural', 'Sports', 'Social', 'Entrepreneurship', 'Literary', 'Others')),
    content_visibility VARCHAR(30) DEFAULT 'college-only' CHECK (content_visibility IN ('college-only', 'public')),
    campus VARCHAR(100) DEFAULT 'Main Campus',
    workshop_or_room VARCHAR(100),
    faculty_mentor VARCHAR(150) DEFAULT 'Assigned Faculty Mentor',
    faculty_designation VARCHAR(150) DEFAULT 'Assistant Professor',
    president_name VARCHAR(150),
    president_contact VARCHAR(100),
    established_year INT DEFAULT 2018,
    description TEXT,
    vision TEXT,
    mission TEXT,
    website_url TEXT,
    instagram_handle VARCHAR(100),
    linkedin_handle VARCHAR(100),
    discord_url TEXT,
    whatsapp_group TEXT,
    official_email VARCHAR(150),
    members_count INT DEFAULT 120,
    followers_count INT DEFAULT 100,
    open_recruitment BOOLEAN DEFAULT FALSE,
    recruitment_deadline DATE,
    recruitment_roles TEXT[] DEFAULT '{}',
    logo_bg VARCHAR(20) DEFAULT '#0C447C',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_RENEWAL', 'PROBATION', 'INACTIVE')),
    is_archived BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.club_followers (
    follower_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.club_roles (
    role_id VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    hierarchy_rank INT NOT NULL DEFAULT 10,
    is_core_position BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES public.club_roles(role_id),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'REVOKED')),
    joined_date DATE DEFAULT CURRENT_DATE,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT NULL,
    changed_by UUID REFERENCES public.users(user_id),
    UNIQUE(user_id, club_id, academic_year, role_id, valid_from)
);

-- ==============================================================================
-- 5. CAMPUS EVENTS, APPROVAL PIPELINE, AUDIT LOG & VERSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    club_name VARCHAR(150),
    college_id VARCHAR(50) REFERENCES public.colleges(college_id) ON DELETE CASCADE,
    college_name VARCHAR(255),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Workshop', 'Seminar', 'Competition', 'Hackathon', 'Guest Lecture', 'Cultural Fest', 'Sports Tournament', 'Recruitment Drive', 'Meeting', 'Events & Workshops')),
    vertical VARCHAR(50) DEFAULT 'Technical',
    scope VARCHAR(30) DEFAULT 'INTER_COLLEGIATE' CHECK (scope IN ('INTRA_COLLEGE', 'INTER_COLLEGIATE', 'CITY_WIDE', 'NATIONAL', 'Campus-Only', 'Inter-College', 'National-Level', 'City-Wide')),
    target_audience VARCHAR(100),
    expected_count INT DEFAULT 100,
    registered_count INT DEFAULT 0,
    venue_name VARCHAR(150),
    venue_type VARCHAR(50) CHECK (venue_type IN ('Classroom', 'Auditorium', 'Computer Lab', 'Seminar Hall', 'Open Ground', 'Online', 'Multiple Venues')),
    room_or_lab_numbers VARCHAR(100),
    event_date VARCHAR(50) NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    ticket_price NUMERIC(10, 2) DEFAULT 0.00,
    prize_pool VARCHAR(100),
    is_hackathon BOOLEAN DEFAULT FALSE,
    banner_image_url TEXT,
    academic_year VARCHAR(20) DEFAULT '2026-27',
    status VARCHAR(30) DEFAULT 'upcoming' CHECK (status IN ('draft', 'under_review', 'changes_requested', 'upcoming', 'live', 'past', 'cancelled', 'approved', 'rejected', 'published', 'completed')),
    objectives TEXT,
    expected_outcomes TEXT,
    guest_details JSONB,
    resource_requirements TEXT[],
    compliance_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.users(user_id),
    approver_level VARCHAR(50) NOT NULL CHECK (approver_level IN ('FACULTY_MENTOR', 'RESOURCE_INCHARGE', 'VERTICAL_COORDINATOR', 'CAMPUS_MANAGER', 'DEAN_ADMIN')),
    decision VARCHAR(30) DEFAULT 'PENDING' CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL')),
    remarks TEXT,
    decision_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    version_number INT,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    performed_by UUID REFERENCES public.users(user_id),
    performer_role VARCHAR(50),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    scope VARCHAR(30),
    target_audience VARCHAR(100),
    expected_count INT,
    venue_name VARCHAR(150),
    event_date VARCHAR(50),
    event_time VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    ticket_price NUMERIC(10,2),
    objectives TEXT,
    expected_outcomes TEXT,
    guest_details JSONB,
    resource_requirements TEXT[],
    compliance_verified BOOLEAN,
    budget_snapshot JSONB,
    submitted_by UUID REFERENCES public.users(user_id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, version_number)
);

-- ==============================================================================
-- 6. EVENT PLANNING, EXECUTION, BUDGETS & SETTLEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_teams (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL CHECK (role IN ('Event Head', 'Technical Team', 'Design Team', 'Marketing Team', 'Logistics Team', 'Volunteer')),
    assigned_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    deadline TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_budgets (
    budget_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Equipment', 'Venue', 'Materials', 'Prizes', 'Refreshments', 'Marketing', 'Other')),
    description TEXT NOT NULL,
    estimated_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_settlements (
    settlement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE UNIQUE,
    sanctioned_amount NUMERIC(10, 2) NOT NULL,
    actual_expenditure NUMERIC(10, 2) NOT NULL,
    surplus_or_deficit NUMERIC(10, 2) NOT NULL,
    invoices_count INT DEFAULT 1,
    invoice_urls TEXT[] DEFAULT '{}',
    summary_notes TEXT,
    submitted_by UUID REFERENCES public.users(user_id),
    audited_by UUID REFERENCES public.users(user_id),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUDITED', 'SETTLED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.event_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 7. TICKETING, REGISTRATIONS & CRYPTOGRAPHIC GATE PASSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00 CHECK (price >= 0),
    total_capacity INT NOT NULL DEFAULT 100,
    sold_count INT DEFAULT 0,
    perks TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sales_end_time TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    registration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES public.tickets(ticket_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    college_id VARCHAR(50) REFERENCES public.colleges(college_id),
    attendee_name VARCHAR(150),
    attendee_prn VARCHAR(50),
    ticket_tier VARCHAR(100) DEFAULT 'Standard Entry Pass',
    academic_year VARCHAR(20) DEFAULT '2026-27',
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'COMPLETED' CHECK (payment_status IN ('FREE', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_reference VARCHAR(100),
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    check_in_status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (check_in_status IN ('REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED')),
    check_in_timestamp TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 8. COMPETITIONS, TEAMS, WINNERS & HALL OF FAME ARCHIVE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.competitions (
    competition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    organizer VARCHAR(150) NOT NULL,
    organizer_logo_bg VARCHAR(20) DEFAULT '#185FA5',
    college_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hackathons', 'B-Plan & Case Studies', 'Quizzes & CTFs', 'Startup Pitches', 'Cultural & Sports', 'Events & Workshops')),
    mode VARCHAR(50) DEFAULT 'Offline On-Campus' CHECK (mode IN ('Online', 'Offline On-Campus', 'Hybrid')),
    location VARCHAR(150) NOT NULL,
    team_size VARCHAR(50) DEFAULT '1 - 4 Members',
    min_team INT DEFAULT 1,
    max_team INT DEFAULT 4,
    tags TEXT[] DEFAULT '{}',
    days_left VARCHAR(50) DEFAULT '6 Days',
    deadline_date VARCHAR(50) NOT NULL,
    prize_pool VARCHAR(100) DEFAULT '₹1,00,000',
    entry_fee NUMERIC(10, 2) DEFAULT 0.00,
    registered_count INT DEFAULT 0,
    description TEXT,
    eligibility TEXT DEFAULT 'Open to all verified college students across India.',
    status VARCHAR(30) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'past', 'closed')),
    winner_name VARCHAR(150),
    winning_college VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.teams (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.competitions(competition_id) ON DELETE CASCADE,
    team_name VARCHAR(150) NOT NULL,
    lead_user_id UUID NOT NULL REFERENCES public.users(user_id),
    lead_prn VARCHAR(50),
    representing_college VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.team_members (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    student_name VARCHAR(150) NOT NULL,
    student_prn VARCHAR(50) NOT NULL,
    role_in_team VARCHAR(50) DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.winners (
    winner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.competitions(competition_id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(team_id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    winner_name VARCHAR(150) NOT NULL,
    college_id VARCHAR(50) REFERENCES public.colleges(college_id),
    college_name VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL CHECK (position IN ('1st Place / Winner', '2nd Place / Runner Up', '3rd Place', 'Special Mention', 'Best Innovation', 'Consolation')),
    rank_order INT NOT NULL,
    prize_amount NUMERIC(10, 2) DEFAULT 0.00,
    certificate_url TEXT,
    certificate_verification_code VARCHAR(100) UNIQUE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. RECRUITMENT DRIVES & CANDIDATE EVALUATION PIPELINE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recruitment_drives (
    drive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    title VARCHAR(150) NOT NULL,
    eligible_years TEXT[] DEFAULT '{"FE", "SE", "TE"}',
    min_cgpa NUMERIC(4, 2) DEFAULT 7.00,
    open_positions TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'INTERVIEWING', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID REFERENCES public.recruitment_drives(drive_id) ON DELETE SET NULL,
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    applicant_name VARCHAR(150) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_prn VARCHAR(50) NOT NULL,
    applicant_cgpa NUMERIC(4, 2),
    applied_role VARCHAR(100) NOT NULL,
    sop_statement TEXT,
    resume_url TEXT,
    interview_score NUMERIC(5, 2),
    status VARCHAR(30) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'ACCEPTED')),
    interview_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.interview_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.applications(application_id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    score NUMERIC(5, 2),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('event', 'recruitment', 'trophy', 'notice')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 11. FINANCE & TRANSACTION LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(event_id) ON DELETE SET NULL,
    added_by_user_id UUID REFERENCES public.users(user_id),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    txn_type VARCHAR(50) NOT NULL CHECK (txn_type IN ('TICKET_SALE_INCOME', 'SPONSORSHIP_INCOME', 'COLLEGE_GRANT', 'LOGISTICS_EXPENSE', 'PRIZE_POOL_EXPENSE', 'REFRESHMENTS_EXPENSE', 'MARKETING_EXPENSE', 'MISCELLANEOUS_EXPENSE')),
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'ONLINE' CHECK (payment_mode IN ('ONLINE', 'CASH', 'CHEQUE', 'COLLEGE_TRANSFER')),
    description TEXT NOT NULL,
    bill_receipt_url TEXT,
    txn_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 12. INDEXES & ANALYTICAL VIEWS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_auth ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_clubs_college ON public.clubs(college_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON public.events(college_id);
CREATE INDEX IF NOT EXISTS idx_events_club ON public.events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_pair ON public.event_registrations(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_followers_club ON public.club_followers(club_id);
CREATE INDEX IF NOT EXISTS idx_followers_user ON public.club_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_club_followers_pair ON public.club_followers(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_applications_club ON public.applications(club_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(applicant_id);

-- Analytical View 1: Winner Leaderboard
CREATE OR REPLACE VIEW public.v_college_winner_leaderboard AS
SELECT 
    c.college_id,
    c.name AS college_name,
    c.short_name,
    COUNT(w.winner_id) AS total_podium_finishes,
    COUNT(CASE WHEN w.rank_order = 1 THEN 1 END) AS first_place_trophies,
    COUNT(CASE WHEN w.rank_order = 2 THEN 1 END) AS runner_up_trophies,
    COUNT(CASE WHEN w.rank_order = 3 THEN 1 END) AS third_place_finishes,
    COALESCE(SUM(w.prize_amount), 0) AS total_prize_money_won
FROM public.colleges c
LEFT JOIN public.winners w ON c.college_id = w.college_id
GROUP BY c.college_id, c.name, c.short_name
ORDER BY first_place_trophies DESC, total_podium_finishes DESC;

-- Analytical View 2: Inter-College Participation
CREATE OR REPLACE VIEW public.v_inter_college_participation_stats AS
SELECT 
    e.event_id,
    e.title AS event_title,
    e.academic_year,
    c.short_name AS participant_college,
    COUNT(r.registration_id) AS total_registered,
    COUNT(CASE WHEN r.check_in_status = 'ATTENDED' THEN 1 END) AS verified_attended,
    COALESCE(SUM(r.amount_paid), 0) AS total_ticket_revenue
FROM public.events e
JOIN public.event_registrations r ON e.event_id = r.event_id
JOIN public.colleges c ON r.college_id = c.college_id
GROUP BY e.event_id, e.title, e.academic_year, c.short_name
ORDER BY e.start_time DESC NULLS LAST, verified_attended DESC;

-- ==============================================================================
-- 13. CORE BUSINESS LOGIC FUNCTIONS & TRIGGERS (CONCURRENCY, VENUE & RPCs)
-- ==============================================================================

-- A. Venue Conflict Detection Trigger
CREATE OR REPLACE FUNCTION public.check_venue_conflict()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict_title VARCHAR;
  v_conflict_club VARCHAR;
BEGIN
  IF NEW.status IN ('under_review', 'approved', 'published', 'live') AND NEW.venue_name IS NOT NULL THEN
    SELECT title, club_name INTO v_conflict_title, v_conflict_club
    FROM public.events
    WHERE LOWER(TRIM(venue_name)) = LOWER(TRIM(NEW.venue_name))
      AND event_date = NEW.event_date
      AND status IN ('approved', 'published', 'live')
      AND event_id != COALESCE(NEW.event_id, '00000000-0000-0000-0000-000000000000'::UUID)
    LIMIT 1;

    IF v_conflict_title IS NOT NULL THEN
      RAISE EXCEPTION 'VENUE CONFLICT: "%" is already reserved on % for "%" organized by %',
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

-- B. RPC: Submit Event For Approval
CREATE OR REPLACE FUNCTION public.submit_event_for_approval(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);
  UPDATE public.events SET status = 'under_review' WHERE event_id = p_event_id;
  RETURN jsonb_build_object('success', true, 'status', 'under_review', 'event_id', p_event_id);
END;
$$;

-- C. RPC: Process Event Approval
CREATE OR REPLACE FUNCTION public.process_event_approval(
  p_event_id UUID,
  p_decision VARCHAR,
  p_remarks TEXT DEFAULT '',
  p_level VARCHAR DEFAULT 'FACULTY_MENTOR'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_next_status VARCHAR;
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);
  IF upper(p_decision) = 'APPROVED' THEN
    v_next_status := 'approved';
  ELSIF upper(p_decision) = 'CHANGES_REQUESTED' THEN
    v_next_status := 'changes_requested';
  ELSE
    v_next_status := 'rejected';
  END IF;

  UPDATE public.events SET status = v_next_status WHERE event_id = p_event_id;
  RETURN jsonb_build_object('success', true, 'status', v_next_status, 'event_id', p_event_id);
END;
$$;

-- D. RPC: Publish Event
CREATE OR REPLACE FUNCTION public.publish_event(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.rpc_context', 'true', true);
  UPDATE public.events SET status = 'published' WHERE event_id = p_event_id;

  INSERT INTO public.tickets (event_id, tier_name, price, total_capacity)
  SELECT p_event_id, 'Standard Pass', 0.00, 100
  WHERE NOT EXISTS (SELECT 1 FROM public.tickets WHERE event_id = p_event_id);

  RETURN jsonb_build_object('success', true, 'status', 'published', 'event_id', p_event_id);
END;
$$;

-- E. RPC: Concurrency-Safe Event Registration
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_ticket_tier VARCHAR DEFAULT 'Standard Pass'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_event_status VARCHAR;
  v_ticket_id UUID;
  v_total_capacity INT;
  v_sold_count INT;
  v_qr_token TEXT;
  v_existing_status VARCHAR;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.users LIMIT 1;
  END IF;

  SELECT status INTO v_event_status FROM public.events WHERE event_id = p_event_id;
  IF v_event_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_FOUND', 'message', 'Event does not exist.');
  END IF;

  IF v_event_status NOT IN ('published', 'live') THEN
    RETURN jsonb_build_object('success', false, 'error', 'REGISTRATIONS_CLOSED', 'message', 'Event is not open for registrations.');
  END IF;

  SELECT check_in_status INTO v_existing_status
  FROM public.event_registrations
  WHERE event_id = p_event_id AND user_id = v_user_id;

  IF v_existing_status IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REGISTERED', 'message', 'You have already registered for this event.');
  END IF;

  SELECT ticket_id, total_capacity, sold_count
  INTO v_ticket_id, v_total_capacity, v_sold_count
  FROM public.tickets
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF v_ticket_id IS NULL THEN
    INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count)
    VALUES (p_event_id, p_ticket_tier, 0.00, 150, 0)
    RETURNING ticket_id, total_capacity, sold_count
    INTO v_ticket_id, v_total_capacity, v_sold_count;
  END IF;

  IF v_sold_count >= v_total_capacity THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_SOLD_OUT', 'message', 'Event capacity has been reached. No tickets remaining.');
  END IF;

  v_qr_token := 'CS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)) || '-' || upper(substr(md5(clock_timestamp()::text), 1, 6));

  INSERT INTO public.event_registrations (
    event_id, ticket_id, user_id, college_id, academic_year, amount_paid, payment_status, qr_token, check_in_status
  ) VALUES (
    p_event_id, v_ticket_id, v_user_id, 'VIT_PUNE', '2026-27', 0.00, 'COMPLETED', v_qr_token, 'REGISTERED'
  );

  UPDATE public.tickets SET sold_count = sold_count + 1 WHERE ticket_id = v_ticket_id;
  UPDATE public.events SET registered_count = COALESCE(registered_count, 0) + 1 WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'qr_token', v_qr_token,
    'seats_remaining', (v_total_capacity - (v_sold_count + 1)),
    'message', 'Registration confirmed successfully!'
  );
END;
$$;

-- F. RPC: Gate Scanner Verification
CREATE OR REPLACE FUNCTION public.verify_and_checkin_pass(
  p_event_id UUID,
  p_qr_token VARCHAR
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT r.registration_id, r.user_id, r.check_in_status, r.check_in_timestamp, u.name, u.prn_or_roll
  INTO v_reg
  FROM public.event_registrations r
  LEFT JOIN public.users u ON r.user_id = u.user_id
  WHERE r.event_id = p_event_id AND UPPER(TRIM(r.qr_token)) = UPPER(TRIM(p_qr_token));

  IF v_reg.registration_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'status', 'INVALID', 'message', '❌ INVALID PASS: Token not found for this event.');
  END IF;

  IF v_reg.check_in_status = 'ATTENDED' THEN
    RETURN jsonb_build_object(
      'valid', false, 'status', 'ALREADY_USED',
      'attendee_name', v_reg.name, 'prn', v_reg.prn_or_roll,
      'scanned_at', v_reg.check_in_timestamp,
      'message', '⚠️ DUPLICATE SCAN: Pass was ALREADY USED for entry at ' || to_char(v_reg.check_in_timestamp, 'HH12:MI AM')
    );
  END IF;

  IF v_reg.check_in_status = 'CANCELLED' THEN
    RETURN jsonb_build_object('valid', false, 'status', 'CANCELLED', 'message', '❌ PASS CANCELLED: This pass has been revoked or cancelled.');
  END IF;

  UPDATE public.event_registrations
  SET check_in_status = 'ATTENDED', check_in_timestamp = CURRENT_TIMESTAMP
  WHERE registration_id = v_reg.registration_id;

  RETURN jsonb_build_object(
    'valid', true, 'status', 'ATTENDED',
    'attendee_name', COALESCE(v_reg.name, 'Student Attendee'),
    'prn', COALESCE(v_reg.prn_or_roll, 'PRN Verified'),
    'check_in_time', CURRENT_TIMESTAMP,
    'message', '✅ ENTRY CONFIRMED: Welcome to the event!'
  );
END;
$$;

-- G. RPC: Post-Event Financial Settlement
CREATE OR REPLACE FUNCTION public.submit_event_settlement(
  p_event_id UUID,
  p_actual_expenditure NUMERIC,
  p_invoices_count INT,
  p_summary_notes TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_budget_expenditure NUMERIC := 0;
  v_diff NUMERIC;
BEGIN
  SELECT COALESCE(expected_count * ticket_price, 0) INTO v_budget_expenditure
  FROM public.events WHERE event_id = p_event_id;

  v_diff := v_budget_expenditure - p_actual_expenditure;

  INSERT INTO public.event_settlements (
    event_id, sanctioned_amount, actual_expenditure, surplus_or_deficit, invoices_count, summary_notes, status
  ) VALUES (
    p_event_id, v_budget_expenditure, p_actual_expenditure, v_diff, p_invoices_count, p_summary_notes, 'AUDITED'
  )
  ON CONFLICT (event_id) DO UPDATE SET
    actual_expenditure = EXCLUDED.actual_expenditure,
    surplus_or_deficit = EXCLUDED.surplus_or_deficit,
    invoices_count = EXCLUDED.invoices_count,
    summary_notes = EXCLUDED.summary_notes,
    status = 'AUDITED';

  UPDATE public.events SET status = 'completed' WHERE event_id = p_event_id;

  RETURN jsonb_build_object('success', true, 'status', 'completed', 'message', 'Financial settlement audited and event marked completed.');
END;
$$;

-- H. RPC: Registration Cancellation & Seat Recycling
CREATE OR REPLACE FUNCTION public.cancel_event_registration(
  p_registration_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT registration_id, event_id, ticket_id, check_in_status
  INTO v_reg
  FROM public.event_registrations
  WHERE registration_id = p_registration_id;

  IF v_reg.registration_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Registration not found.');
  END IF;

  IF v_reg.check_in_status = 'ATTENDED' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot cancel a pass that has already been verified and attended.');
  END IF;

  IF v_reg.check_in_status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Registration has already been cancelled.');
  END IF;

  UPDATE public.event_registrations
  SET check_in_status = 'CANCELLED'
  WHERE registration_id = p_registration_id;

  IF v_reg.ticket_id IS NOT NULL THEN
    UPDATE public.tickets
    SET sold_count = GREATEST(0, sold_count - 1)
    WHERE ticket_id = v_reg.ticket_id;
  END IF;

  UPDATE public.events
  SET registered_count = GREATEST(0, COALESCE(registered_count, 1) - 1)
  WHERE event_id = v_reg.event_id;

  RETURN jsonb_build_object('success', true, 'message', 'Registration cancelled successfully and seat released for others.');
END;
$$;

-- ==============================================================================
-- 14. REALTIME PUBLICATION SETUP
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settlements;
