-- ==============================================================================
-- CLUBSYNC UNIFIED MULTI-COLLEGE DATABASE SCHEMA (PostgreSQL / Supabase)
-- Version: 2.0
-- Scope: Multi-Tenancy (Pune Colleges), Multi-Year Archive (2+ Years), Ticketing, 
--        Competitions & Winners, Approvals, Recruitment & Financial Ledgers
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. INSTITUTIONS / COLLEGES (MULTI-TENANT ROOTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS colleges (
    college_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_PUNE', 'COEP_TECH', 'PICT_PUNE'
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    campus_locations TEXT[] DEFAULT '{"Main Campus"}', -- e.g. '{"Bibwewadi", "Kondhwa"}'
    email_domain VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'vit.edu', 'coeptech.ac.in', 'pict.edu'
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. USERS & PROFILES (UNIFIED STUDENT PASSPORT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id VARCHAR(50) REFERENCES colleges(college_id) ON DELETE RESTRICT,
    prn_or_roll VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    year_of_study VARCHAR(10) CHECK (year_of_study IN ('FE', 'SE', 'TE', 'BE', 'ME', 'PHD', 'ALUMNI', 'FACULTY')),
    branch VARCHAR(100),
    cgpa NUMERIC(4, 2) CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    user_type VARCHAR(30) DEFAULT 'STUDENT' CHECK (user_type IN ('STUDENT', 'CLUB_LEAD', 'FACULTY_MENTOR', 'VERTICAL_COORDINATOR', 'DEAN_ADMIN', 'SUPER_ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. CLUBS & ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clubs (
    club_id VARCHAR(50) PRIMARY KEY, -- e.g. 'VIT_GEDIT', 'VIT_EDC', 'COEP_ROBOTICS'
    college_id VARCHAR(50) NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    vertical VARCHAR(50) NOT NULL CHECK (vertical IN ('Technical', 'Cultural', 'Sports', 'Social', 'Entrepreneurship', 'Literary', 'Others')),
    campus VARCHAR(100) DEFAULT 'Main Campus',
    faculty_mentor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    vision TEXT,
    mission TEXT,
    objectives TEXT,
    website_url TEXT,
    instagram_handle VARCHAR(100),
    linkedin_handle VARCHAR(100),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_RENEWAL', 'PROBATION', 'INACTIVE')),
    established_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_roles (
    role_id VARCHAR(50) PRIMARY KEY, -- e.g. 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'EVENT_COORDINATOR', 'PRO', 'CORE_MEMBER', 'ASSOCIATE_MEMBER'
    role_name VARCHAR(100) NOT NULL,
    hierarchy_rank INT NOT NULL DEFAULT 10,
    is_core_position BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES club_roles(role_id),
    academic_year VARCHAR(20) NOT NULL, -- e.g. '2024-25', '2025-26', '2026-27'
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'REVOKED')),
    joined_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, club_id, academic_year)
);

-- ==============================================================================
-- 4. EVENTS & MULTI-TIER APPROVALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Workshop', 'Seminar', 'Competition', 'Hackathon', 'Guest Lecture', 'Cultural Fest', 'Sports Tournament', 'Recruitment Drive', 'Meeting')),
    scope VARCHAR(30) DEFAULT 'INTER_COLLEGIATE' CHECK (scope IN ('INTRA_COLLEGE', 'INTER_COLLEGIATE', 'CITY_WIDE', 'NATIONAL')),
    target_audience VARCHAR(100),
    expected_count INT DEFAULT 100,
    venue_name VARCHAR(150),
    venue_type VARCHAR(50) CHECK (venue_type IN ('Classroom', 'Auditorium', 'Computer Lab', 'Seminar Hall', 'Open Ground', 'Online', 'Multiple Venues')),
    room_or_lab_numbers VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    banner_image_url TEXT,
    academic_year VARCHAR(20) NOT NULL, -- e.g. '2025-26', '2026-27'
    estimated_budget NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'PROPOSED' CHECK (status IN ('DRAFT', 'PROPOSED', 'APPROVED', 'REJECTED', 'LIVE', 'COMPLETED', 'CANCELLED')),
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
-- 5. TICKETING, REGISTRATIONS & LIVE CHECK-IN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL, -- e.g. 'Free Entry', 'Early Bird', 'Standard Pass', 'External College Team'
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
    ticket_id UUID NOT NULL REFERENCES tickets(ticket_id),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    college_id VARCHAR(50) NOT NULL REFERENCES colleges(college_id),
    academic_year VARCHAR(20) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'COMPLETED' CHECK (payment_status IN ('FREE', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_reference VARCHAR(100),
    qr_token VARCHAR(255) UNIQUE NOT NULL, -- Verification QR string
    check_in_status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (check_in_status IN ('REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED')),
    check_in_timestamp TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ==============================================================================
-- 6. COMPETITIONS, TEAMS, WINNERS & HISTORICAL ARCHIVE (2+ YEARS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS competitions (
    competition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- e.g. 'GedIT Web & AI Track', 'Debate Grand Finals'
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hackathon', 'Coding', 'Robotics', 'Debate', 'Dance', 'Music', 'Sports', 'Quiz', 'Gaming', 'Other')),
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 4,
    total_prize_pool NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(competition_id) ON DELETE CASCADE,
    team_name VARCHAR(150) NOT NULL,
    lead_user_id UUID NOT NULL REFERENCES users(user_id),
    representing_college_id VARCHAR(50) NOT NULL REFERENCES colleges(college_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_in_team VARCHAR(50) DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS winners (
    winner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(competition_id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
    solo_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    college_id VARCHAR(50) NOT NULL REFERENCES colleges(college_id),
    position VARCHAR(50) NOT NULL CHECK (position IN ('1st Place / Winner', '2nd Place / Runner Up', '3rd Place', 'Special Mention', 'Best Innovation', 'Consolation')),
    rank_order INT NOT NULL, -- 1 for 1st, 2 for 2nd, etc.
    prize_amount NUMERIC(10, 2) DEFAULT 0.00,
    certificate_url TEXT,
    certificate_verification_code VARCHAR(100) UNIQUE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. RECRUITMENT DRIVES & APPLICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recruitment_drives (
    drive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL, -- e.g. '2026-27'
    title VARCHAR(150) NOT NULL,
    eligible_years TEXT[] DEFAULT '{"SE", "TE"}',
    min_cgpa NUMERIC(4, 2) DEFAULT 7.00,
    open_positions TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'INTERVIEWING', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID NOT NULL REFERENCES recruitment_drives(drive_id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    applied_role VARCHAR(100) NOT NULL,
    sop_statement TEXT,
    resume_url TEXT,
    interview_score NUMERIC(5, 2),
    status VARCHAR(30) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'ACCEPTED')),
    interview_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, applicant_id, applied_role)
);

-- ==============================================================================
-- 8. FINANCE & TRANSACTION LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
    added_by_user_id UUID NOT NULL REFERENCES users(user_id),
    academic_year VARCHAR(20) NOT NULL,
    txn_type VARCHAR(50) NOT NULL CHECK (txn_type IN ('TICKET_SALE_INCOME', 'SPONSORSHIP_INCOME', 'COLLEGE_GRANT', 'LOGISTICS_EXPENSE', 'PRIZE_POOL_EXPENSE', 'REFRESHMENTS_EXPENSE', 'MARKETING_EXPENSE', 'MISCELLANEOUS_EXPENSE')),
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'ONLINE' CHECK (payment_mode IN ('ONLINE', 'CASH', 'CHEQUE', 'COLLEGE_TRANSFER')),
    description TEXT NOT NULL,
    bill_receipt_url TEXT,
    txn_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES (FOR FAST 2+ YEAR SEARCH & ANALYTICS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_academic_year ON events(academic_year);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_college ON event_registrations(event_id, college_id);
CREATE INDEX IF NOT EXISTS idx_registrations_academic_year ON event_registrations(academic_year);
CREATE INDEX IF NOT EXISTS idx_winners_college ON winners(college_id);
CREATE INDEX IF NOT EXISTS idx_winners_competition ON winners(competition_id);
CREATE INDEX IF NOT EXISTS idx_finance_club_year ON finance_transactions(club_id, academic_year);

-- ==============================================================================
-- 10. ANALYTICAL VIEWS (CONCLUSION & INSIGHT ENGINE)
-- ==============================================================================

-- A. Inter-College Winner Leaderboard (Which college wins the most)
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

-- B. Inter-College Participation & Footfall Map
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

-- C. Club Annual Performance Summary (For Renewal Form AY 2026-27)
CREATE OR REPLACE VIEW v_club_annual_performance AS
SELECT 
    cl.club_id,
    cl.name AS club_name,
    cl.vertical,
    e.academic_year,
    COUNT(DISTINCT e.event_id) AS total_events_conducted,
    COUNT(DISTINCT r.registration_id) AS total_students_engaged,
    COALESCE(SUM(CASE WHEN f.txn_type LIKE '%INCOME%' THEN f.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN f.txn_type LIKE '%EXPENSE%' THEN f.amount ELSE 0 END), 0) AS total_expenses,
    (COALESCE(SUM(CASE WHEN f.txn_type LIKE '%INCOME%' THEN f.amount ELSE 0 END), 0) - 
     COALESCE(SUM(CASE WHEN f.txn_type LIKE '%EXPENSE%' THEN f.amount ELSE 0 END), 0)) AS net_balance
FROM clubs cl
LEFT JOIN events e ON cl.club_id = e.club_id
LEFT JOIN event_registrations r ON e.event_id = r.event_id
LEFT JOIN finance_transactions f ON cl.club_id = f.club_id AND e.academic_year = f.academic_year
GROUP BY cl.club_id, cl.name, cl.vertical, e.academic_year;

-- ==============================================================================
-- 11. SAMPLE INITIAL SEED DATA (PUNE COLLEGES & VIT CLUBS)
-- ==============================================================================

-- 1. Colleges
INSERT INTO colleges (college_id, name, short_name, campus_locations, email_domain, city, state) VALUES
('VIT_PUNE', 'Vishwakarma Institute of Technology', 'VIT Pune', '{"Bibwewadi", "Kondhwa"}', 'vit.edu', 'Pune', 'Maharashtra'),
('COEP_TECH', 'COEP Technological University', 'COEP Tech', '{"Shivajinagar"}', 'coeptech.ac.in', 'Pune', 'Maharashtra'),
('PICT_PUNE', 'Pune Institute of Computer Technology', 'PICT', '{"Dhankawadi"}', 'pict.edu', 'Pune', 'Maharashtra'),
('MIT_WPU', 'MIT World Peace University', 'MIT-WPU', '{"Kothrud"}', 'mitwpu.edu.in', 'Pune', 'Maharashtra'),
('VIIT_PUNE', 'Vishwakarma Institute of Information Technology', 'VIIT', '{"Kondhwa"}', 'viit.ac.in', 'Pune', 'Maharashtra'),
('PCCOE_PUNE', 'Pimpri Chinchwad College of Engineering', 'PCCOE', '{"Akurdi"}', 'pccoepune.org', 'Pune', 'Maharashtra')
ON CONFLICT (college_id) DO NOTHING;

-- 2. Roles
INSERT INTO club_roles (role_id, role_name, hierarchy_rank, is_core_position) VALUES
('PRESIDENT', 'President', 1, TRUE),
('VICE_PRESIDENT', 'Vice President', 2, TRUE),
('SECRETARY', 'Secretary', 3, TRUE),
('TREASURER', 'Treasurer', 4, TRUE),
('EVENT_COORDINATOR', 'Event Coordinator', 5, TRUE),
('PRO', 'Public Relations Officer', 6, TRUE),
('TECH_LEAD', 'Technical Head', 7, TRUE),
('CORE_MEMBER', 'Core Team Member', 8, FALSE),
('ASSOCIATE_MEMBER', 'Associate Member', 9, FALSE)
ON CONFLICT (role_id) DO NOTHING;

-- 3. Core Clubs (VIT Pune)
INSERT INTO clubs (club_id, college_id, name, short_name, vertical, campus, status, established_year) VALUES
('VIT_GEDIT', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Bibwewadi', 'ACTIVE', 2018),
('VIT_EDC', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC', 'Entrepreneurship', 'Bibwewadi', 'ACTIVE', 2012),
('VIT_IEEE', 'VIT_PUNE', 'IEEE Student Branch & CIS', 'IEEE', 'Technical', 'Bibwewadi', 'ACTIVE', 2010),
('VIT_TRF', 'VIT_PUNE', 'The Robotics Forum', 'TRF', 'Technical', 'Bibwewadi', 'ACTIVE', 2008),
('VIT_SPEAKERS', 'VIT_PUNE', 'Speakers Arena & Debating Society', 'Speakers Arena', 'Literary', 'Bibwewadi', 'ACTIVE', 2016),
('VIT_CSI', 'VIT_PUNE', 'Computer Society of India VIT Chapter', 'CSI', 'Technical', 'Bibwewadi', 'ACTIVE', 2014),
('VIT_MELANGE', 'VIT_PUNE', 'Mélange Cultural Committee', 'Mélange', 'Cultural', 'Bibwewadi', 'ACTIVE', 2005)
ON CONFLICT (club_id) DO NOTHING;
