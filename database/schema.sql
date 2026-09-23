-- ==============================================================================
-- CLUBSYNC NATIONAL MULTI-TENANT DATABASE SCHEMA (PostgreSQL / Supabase)
-- Version: 3.0 (Production Master Schema)
-- Scope: Multi-Tenancy (National & State Colleges), Google OAuth Auth Sync, 
--        Editable User Profiles, Clubs CMS & Follows, Events & Competitions,
--        Tiered QR Ticketing, Recruitment Pipeline & Analytical Views
-- ==============================================================================

-- Enable UUID & Crypto Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. INSTITUTIONS / COLLEGES (MULTI-TENANT ROOTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS colleges (
    college_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_PUNE', 'IIT_BOMBAY', 'BITS_PILANI'
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    campus_locations TEXT[] DEFAULT '{"Main Campus"}',
    email_domain VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'vit.edu', 'iitb.ac.in', 'pilani.bits-pilani.ac.in'
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. USERS & PROFILES (UNIFIED STUDENT PASSPORT & GOOGLE OAUTH SYNC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Foreign key linking to Supabase auth.users(id)
    college_id VARCHAR(50) REFERENCES colleges(college_id) ON DELETE SET NULL,
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
-- 3. CLUBS, ROLES & SOCIAL FOLLOWERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clubs (
    club_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_GEDIT', 'VIT_EDC', 'IITB_TECHFEST'
    club_no VARCHAR(50) DEFAULT 'CS/2026/001',
    college_id VARCHAR(50) NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS club_followers (
    follower_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_roles (
    role_id VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    hierarchy_rank INT NOT NULL DEFAULT 10,
    is_core_position BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES club_roles(role_id),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'REVOKED')),
    joined_date DATE DEFAULT CURRENT_DATE,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT NULL,
    changed_by UUID REFERENCES users(user_id),
    UNIQUE(user_id, club_id, academic_year, role_id, valid_from)
);

-- ==============================================================================
-- 4. CAMPUS EVENTS & MULTI-TIER APPROVALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) REFERENCES clubs(club_id) ON DELETE CASCADE,
    club_name VARCHAR(150),
    college_id VARCHAR(50) REFERENCES colleges(college_id) ON DELETE CASCADE,
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
    status VARCHAR(30) DEFAULT 'upcoming' CHECK (status IN ('draft', 'proposed', 'upcoming', 'live', 'past', 'cancelled', 'approved', 'rejected', 'published')),
    objectives TEXT,
    expected_outcomes TEXT,
    guest_details JSONB,
    resource_requirements TEXT[],
    compliance_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(user_id),
    approver_level VARCHAR(50) NOT NULL CHECK (approver_level IN ('FACULTY_MENTOR', 'RESOURCE_INCHARGE', 'VERTICAL_COORDINATOR', 'CAMPUS_MANAGER', 'DEAN_ADMIN')),
    decision VARCHAR(30) DEFAULT 'PENDING' CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL')),
    remarks TEXT,
    decision_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, approver_level)
);

-- ==============================================================================
-- 5. TICKETING, REGISTRATIONS & GATE PASSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL, -- e.g. 'Free Entry', 'Early Bird', 'Standard Pass', 'Hackathon All-Access Pass'
    price NUMERIC(10, 2) DEFAULT 0.00 CHECK (price >= 0),
    total_capacity INT NOT NULL DEFAULT 100,
    sold_count INT DEFAULT 0,
    perks TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sales_end_time TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    college_id VARCHAR(50) REFERENCES colleges(college_id),
    attendee_name VARCHAR(150),
    attendee_prn VARCHAR(50),
    ticket_tier VARCHAR(100) DEFAULT 'Standard Entry Pass',
    academic_year VARCHAR(20) DEFAULT '2026-27',
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'COMPLETED' CHECK (payment_status IN ('FREE', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_reference VARCHAR(100),
    qr_token VARCHAR(255) UNIQUE NOT NULL, -- Verification QR token
    check_in_status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (check_in_status IN ('REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED')),
    check_in_timestamp TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 6. COMPETITIONS, TEAMS, WINNERS & HALL OF FAME ARCHIVE (2+ YEARS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS competitions (
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

CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(competition_id) ON DELETE CASCADE,
    team_name VARCHAR(150) NOT NULL,
    lead_user_id UUID NOT NULL REFERENCES users(user_id),
    lead_prn VARCHAR(50),
    representing_college VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    student_name VARCHAR(150) NOT NULL,
    student_prn VARCHAR(50) NOT NULL,
    role_in_team VARCHAR(50) DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS winners (
    winner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(competition_id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(team_id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    winner_name VARCHAR(150) NOT NULL,
    college_id VARCHAR(50) REFERENCES colleges(college_id),
    college_name VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL CHECK (position IN ('1st Place / Winner', '2nd Place / Runner Up', '3rd Place', 'Special Mention', 'Best Innovation', 'Consolation')),
    rank_order INT NOT NULL,
    prize_amount NUMERIC(10, 2) DEFAULT 0.00,
    certificate_url TEXT,
    certificate_verification_code VARCHAR(100) UNIQUE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. RECRUITMENT DRIVES & APPLICATIONS PIPELINE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recruitment_drives (
    drive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    title VARCHAR(150) NOT NULL,
    eligible_years TEXT[] DEFAULT '{"FE", "SE", "TE"}',
    min_cgpa NUMERIC(4, 2) DEFAULT 7.00,
    open_positions TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'INTERVIEWING', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID REFERENCES recruitment_drives(drive_id) ON DELETE SET NULL,
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS interview_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    score NUMERIC(5,2),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ==============================================================================
-- 7B. EVENT PLANNING & EXECUTION (PHASE B)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS event_teams (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL CHECK (role IN ('Event Head', 'Technical Team', 'Design Team', 'Marketing Team', 'Logistics Team', 'Volunteer')),
    assigned_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    deadline TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_budgets (
    budget_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Equipment', 'Venue', 'Materials', 'Prizes', 'Refreshments', 'Marketing', 'Other')),
    description TEXT NOT NULL,
    estimated_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 8. USER NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('event', 'recruitment', 'trophy', 'notice')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. FINANCE & TRANSACTION LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
    added_by_user_id UUID REFERENCES users(user_id),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    txn_type VARCHAR(50) NOT NULL CHECK (txn_type IN ('TICKET_SALE_INCOME', 'SPONSORSHIP_INCOME', 'COLLEGE_GRANT', 'LOGISTICS_EXPENSE', 'PRIZE_POOL_EXPENSE', 'REFRESHMENTS_EXPENSE', 'MARKETING_EXPENSE', 'MISCELLANEOUS_EXPENSE')),
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'ONLINE' CHECK (payment_mode IN ('ONLINE', 'CASH', 'CHEQUE', 'COLLEGE_TRANSFER')),
    description TEXT NOT NULL,
    bill_receipt_url TEXT,
    txn_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. INDEXES & ANALYTICAL VIEWS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clubs_college ON clubs(college_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_pair ON event_registrations(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_followers_club ON club_followers(club_id);
CREATE INDEX IF NOT EXISTS idx_followers_user ON club_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_club_followers_pair ON club_followers(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_applications_club ON applications(club_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(applicant_id);

-- Analytical Views
CREATE OR REPLACE VIEW v_college_winner_leaderboard AS
SELECT 
    c.college_id,
    c.name AS college_name,
    c.short_name,
    COUNT(w.winner_id) AS total_podium_finishes,
    COUNT(CASE WHEN w.rank_order = 1 THEN 1 END) AS first_place_trophies,
    COUNT(CASE WHEN w.rank_order = 2 THEN 1 END) AS runner_up_trophies,
    COUNT(CASE WHEN w.rank_order = 3 THEN 1 END) AS third_place_finishes,
    COALESCE(SUM(w.prize_amount), 0) AS total_prize_money_won
FROM colleges c
LEFT JOIN winners w ON c.college_id = w.college_id
GROUP BY c.college_id, c.name, c.short_name
ORDER BY first_place_trophies DESC, total_podium_finishes DESC;

CREATE OR REPLACE VIEW v_inter_college_participation_stats AS
SELECT 
    e.event_id,
    e.title AS event_title,
    e.academic_year,
    c.short_name AS participant_college,
    COUNT(r.registration_id) AS total_registered,
    COUNT(CASE WHEN r.check_in_status = 'ATTENDED' THEN 1 END) AS verified_attended,
    COALESCE(SUM(r.amount_paid), 0) AS total_ticket_revenue
FROM events e
JOIN event_registrations r ON e.event_id = r.event_id
JOIN colleges c ON r.college_id = c.college_id
GROUP BY e.event_id, e.title, e.academic_year, c.short_name
ORDER BY e.start_time DESC, verified_attended DESC;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid collision
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public colleges read" ON colleges;
    DROP POLICY IF EXISTS "Public clubs read" ON clubs;
    DROP POLICY IF EXISTS "Public events read" ON events;
    DROP POLICY IF EXISTS "Public tickets read" ON tickets;
    DROP POLICY IF EXISTS "Public competitions read" ON competitions;
    DROP POLICY IF EXISTS "Public winners read" ON winners;
    DROP POLICY IF EXISTS "Public users read" ON users;
    DROP POLICY IF EXISTS "Users can insert/update own profile" ON users;
    DROP POLICY IF EXISTS "Clubs can be updated" ON clubs;
    DROP POLICY IF EXISTS "Followers can be managed" ON club_followers;
    DROP POLICY IF EXISTS "Events can be created and managed" ON events;
    DROP POLICY IF EXISTS "Registrations can be created and managed" ON event_registrations;
    DROP POLICY IF EXISTS "Competitions can be created and managed" ON competitions;
    DROP POLICY IF EXISTS "Teams can be created" ON teams;
    DROP POLICY IF EXISTS "Team members can be managed" ON team_members;
    DROP POLICY IF EXISTS "Applications can be created and reviewed" ON applications;
    DROP POLICY IF EXISTS "Notifications can be read and updated" ON notifications;
    DROP POLICY IF EXISTS "Finance can be managed" ON finance_transactions;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Allow Public Read Access for Discovery
CREATE POLICY "Public colleges read" ON colleges FOR SELECT USING (true);
CREATE POLICY "Public clubs read" ON clubs FOR SELECT USING (true);
CREATE POLICY "Public events read" ON events FOR SELECT USING (true);
CREATE POLICY "Public tickets read" ON tickets FOR SELECT USING (true);
CREATE POLICY "Public competitions read" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public winners read" ON winners FOR SELECT USING (true);
CREATE POLICY "Public users read" ON users FOR SELECT USING (true);

-- User Self-Management
CREATE POLICY "Users can insert/update own profile" ON users FOR ALL USING (auth_user_id = auth.uid());

-- Follower Management (Only act on your own behalf)
CREATE POLICY "Followers can be managed" ON club_followers FOR ALL USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
);

-- Ticketing & Event Registration (Register as yourself, view own tickets)
CREATE POLICY "Registrations can be created and managed" ON event_registrations FOR ALL USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
);

-- Application Management
CREATE POLICY "Applications can be created and reviewed" ON applications FOR ALL USING (
    applicant_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
);

-- Teams Management
CREATE POLICY "Teams can be created" ON teams FOR ALL USING (
    lead_user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Notifications can be read and updated" ON notifications FOR ALL USING (
    user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
);

-- Club Admins (Requires Active Core Committee Membership)
CREATE POLICY "Clubs can be updated by core committee" ON clubs FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM memberships m 
        JOIN users u ON m.user_id = u.user_id 
        WHERE m.club_id = clubs.club_id 
        AND u.auth_user_id = auth.uid() 
        AND m.status = 'ACTIVE'
    )
);

-- Temporary open policies for development (Events, Finance, Competitions)
CREATE POLICY "Events can be created and managed" ON events FOR ALL USING (true);
CREATE POLICY "Competitions can be created and managed" ON competitions FOR ALL USING (true);
CREATE POLICY "Team members can be managed" ON team_members FOR ALL USING (true);
CREATE POLICY "Finance can be managed" ON finance_transactions FOR ALL USING (true);
CREATE POLICY "Event Teams can be managed" ON event_teams FOR ALL USING (true);
CREATE POLICY "Event Tasks can be managed" ON event_tasks FOR ALL USING (true);
CREATE POLICY "Event Budgets can be managed" ON event_budgets FOR ALL USING (true);
CREATE POLICY "Event Feedback can be managed" ON event_feedback FOR ALL USING (true);

-- ==============================================================================
-- 12. INITIAL PRODUCTION SEED DATA (NATIONWIDE COLLEGES & VIT CLUBS)
-- ==============================================================================

-- 1. National & State Colleges
INSERT INTO colleges (college_id, name, short_name, campus_locations, email_domain, city, state) VALUES
('VIT_PUNE', 'Vishwakarma Institute of Technology, Pune', 'VIT Pune', '{"Bibwewadi", "Kondhwa"}', 'vit.edu', 'Pune', 'Maharashtra'),
('COEP_TECH', 'COEP Technological University', 'COEP Tech', '{"Shivajinagar"}', 'coeptech.ac.in', 'Pune', 'Maharashtra'),
('PICT_PUNE', 'Pune Institute of Computer Technology', 'PICT', '{"Dhankawadi"}', 'pict.edu', 'Pune', 'Maharashtra'),
('MIT_WPU', 'MIT World Peace University', 'MIT-WPU', '{"Kothrud"}', 'mitwpu.edu.in', 'Pune', 'Maharashtra'),
('VIIT_PUNE', 'Vishwakarma Institute of Information Technology', 'VIIT', '{"Kondhwa"}', 'viit.ac.in', 'Pune', 'Maharashtra'),
('PCCOE_PUNE', 'Pimpri Chinchwad College of Engineering', 'PCCOE', '{"Akurdi"}', 'pccoepune.org', 'Pune', 'Maharashtra'),
('IIT_BOMBAY', 'Indian Institute of Technology Bombay', 'IIT Bombay', '{"Powai"}', 'iitb.ac.in', 'Mumbai', 'Maharashtra'),
('BITS_PILANI', 'Birla Institute of Technology & Science, Pilani', 'BITS Pilani', '{"Vidya Vihar"}', 'pilani.bits-pilani.ac.in', 'Pilani', 'Rajasthan'),
('NIT_TRICHY', 'National Institute of Technology, Tiruchirappalli', 'NIT Trichy', '{"Tanjore Main Road"}', 'nitt.edu', 'Tiruchirappalli', 'Tamil Nadu'),
('VIT_VELLORE', 'Vellore Institute of Technology', 'VIT Vellore', '{"Katpadi"}', 'vit.ac.in', 'Vellore', 'Tamil Nadu')
ON CONFLICT (college_id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name;

-- 2. Core Seed Clubs
INSERT INTO clubs (club_id, club_no, college_id, name, short_name, vertical, tagline, campus, status, established_year, faculty_mentor, instagram_handle, open_recruitment, recruitment_deadline, logo_bg) VALUES
('VIT_GEDIT', 'VIT/SA/25-26/T-001', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Pioneering open-source, competitive programming & full-stack innovation at VIT.', 'Bibwewadi', 'ACTIVE', 2018, 'Prof. Pankaj Kunekar', '@gedit_vit', TRUE, '2026-08-28', '#185FA5'),
('VIT_EDC', 'VIT/SA/25-26/E-002', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC', 'Entrepreneurship', 'Fostering student startup incubations, Angel pitch fests, and Earn & Sell.', 'Bibwewadi', 'ACTIVE', 2012, 'Dr. C. M. Mahajan', '@edc_vit', TRUE, '2026-08-30', '#D97706'),
('VIT_TRF', 'VIT/SA/25-26/T-003', 'VIT_PUNE', 'The Robotics Forum', 'TRF', 'Technical', 'Designing battlebots, autonomous rovers and national ABU Robocon entries.', 'Bibwewadi', 'ACTIVE', 2008, 'Prof. S. R. Shinde', '@trf_vit', FALSE, '2026-09-05', '#DC2626'),
('VIT_MELANGE', 'VIT/SA/25-26/C-004', 'VIT_PUNE', 'Mélange Cultural Committee', 'Mélange', 'Cultural', 'Annual Flagship Cultural & Arts Extravaganza with 15,000+ footfall.', 'Bibwewadi', 'ACTIVE', 2005, 'Prof. V. D. Kulkarni', '@melange_vit', TRUE, '2026-08-25', '#9333EA'),
('VIT_SPEAKERS', 'VIT/SA/25-26/L-005', 'VIT_PUNE', 'Speakers Arena & Debating Society', 'Speakers Arena', 'Literary', 'Parliamentary debates, Model United Nations, and public discourse.', 'Bibwewadi', 'ACTIVE', 2016, 'Prof. A. S. Joshi', '@speakers_vit', FALSE, '2026-09-10', '#059669'),
('IITB_TECHFEST', 'IITB/SA/26-27/001', 'IIT_BOMBAY', 'Techfest IIT Bombay', 'Techfest', 'Technical', 'Asia Largest Science & Technology Festival.', 'Powai', 'ACTIVE', 1998, 'Prof. Devang Khakhar', '@techfest_iitb', TRUE, '2026-09-15', '#0284C7'),
('COEP_ROBOTICS', 'COEP/SA/26-27/002', 'COEP_TECH', 'Robot Study Circle', 'RSC COEP', 'Technical', 'Robocon champions and robotics research collective.', 'Shivajinagar', 'ACTIVE', 2004, 'Dr. S. S. Ohol', '@rsccoep', TRUE, '2026-08-31', '#EA580C')
ON CONFLICT (club_id) DO NOTHING;

-- 3. Initial Events
INSERT INTO events (club_id, club_name, college_id, college_name, title, description, event_type, vertical, scope, venue_name, venue_type, event_date, event_time, ticket_price, prize_pool, is_hackathon, status, registered_count) VALUES
('VIT_GEDIT', 'GedIT Technical Club', 'VIT_PUNE', 'Vishwakarma Institute of Technology, Pune', 'Pune TechFest Grand Hackathon 2026', '36-hour national-level hackathon with AI, Web3, and Smart Campus tracks.', 'Hackathon', 'Technical', 'NATIONAL', 'Central Computer Center & Auditorium', 'Computer Lab', '28 Aug 2026', '09:00 AM', 0.00, '₹1,00,000', TRUE, 'upcoming', 142),
('VIT_EDC', 'Entrepreneurship Development Cell', 'VIT_PUNE', 'Vishwakarma Institute of Technology, Pune', 'Earn & Sell 2026: Campus Bazaar', 'Flagship experiential business arena where 100+ student startups deploy live stalls.', 'Competition', 'Entrepreneurship', 'INTER_COLLEGIATE', 'Bibwewadi Campus Open Ground', 'Open Ground', '30 Aug 2026', '10:00 AM', 0.00, '₹50,000', FALSE, 'upcoming', 88),
('VIT_MELANGE', 'Mélange Cultural Committee', 'VIT_PUNE', 'Vishwakarma Institute of Technology, Pune', 'Battle of the Bands 2026', 'Western and Indian rock band competition across Maharashtra colleges.', 'Cultural Fest', 'Cultural', 'INTER_COLLEGIATE', 'Main Amphitheatre', 'Auditorium', '05 Sep 2026', '05:30 PM', 50.00, '₹40,000', FALSE, 'upcoming', 210)
ON CONFLICT DO NOTHING;

-- 4. Initial Competitions
INSERT INTO competitions (title, organizer, organizer_logo_bg, college_name, category, mode, location, team_size, min_team, max_team, days_left, deadline_date, prize_pool, entry_fee, registered_count, description) VALUES
('National AI Agent Hackathon 2026', 'Techfest IIT Bombay', '#0284C7', 'IIT Bombay', 'Hackathons', 'Hybrid', 'Powai, Mumbai & Online', '1 - 4 Members', 1, 4, '12 Days', '15 Sep 2026', '₹2,50,000', 0.00, 320, 'Build agentic AI workflows and LLM apps evaluated by Google DeepMind and top tech leads.'),
('COEP Tech Innovation Cup 2026', 'COEP Technological University', '#EA580C', 'COEP Tech', 'Hackathons', 'Offline On-Campus', 'Shivajinagar, Pune', '2 - 4 Members', 2, 4, '8 Days', '31 Aug 2026', '₹1,50,000', 0.00, 195, 'Hardware prototyping, IoT sensors, and autonomous robotics challenge.'),
('Unstop National Case Study Challenge', 'EDC BITS Pilani', '#D97706', 'BITS Pilani', 'B-Plan & Case Studies', 'Online', 'Online Pan-India', '1 - 3 Members', 1, 3, '5 Days', '28 Aug 2026', '₹75,000', 0.00, 410, 'Solve real-world go-to-market and growth engineering bottlenecks for Indian unicorns.')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 13. STORAGE BUCKETS & POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('club_logos', 'club_logos', true),
('event_banners', 'event_banners', true),
('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Allow Public Read for Public Buckets
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Read Logos" ON storage.objects FOR SELECT USING (bucket_id = 'club_logos');
CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'event_banners');

-- Allow Authenticated Users to Upload Avatars
CREATE POLICY "Auth Users Upload Avatars" ON storage.objects FOR INSERT USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users Update Own Avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- ==============================================================================
-- 14. REALTIME CONFIGURATION
-- ==============================================================================
-- Enable logical replication (Supabase Realtime) for specific highly dynamic tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
