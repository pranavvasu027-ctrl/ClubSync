-- ==============================================================================
-- CLUBSYNC DATABASE SEED SCRIPT (VIT Pune Demo Data)
-- This script safely injects mock colleges, clubs, users, and events to populate
-- the ClubSync Web Dashboard and Mobile App.
-- ==============================================================================

-- 1. Insert College
INSERT INTO colleges (college_id, name, short_name, campus_locations, email_domain, city, state, logo_url)
VALUES 
('VIT_PUNE', 'Vishwakarma Institute of Technology', 'VIT Pune', '{"Bibwewadi Campus"}', 'vit.edu', 'Pune', 'Maharashtra', 'https://www.vit.edu/images/logo.png')
ON CONFLICT (college_id) DO NOTHING;

-- 2. Insert Test Users (You can log in with these if auth is bypassed or use them as references)
-- First, ensure the college_name column exists (in case your live schema is older)
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(30) DEFAULT 'STUDENT';
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(30) DEFAULT 'First Year (FY)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(100) DEFAULT 'Computer Engineering';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4, 2) DEFAULT 9.0;

-- Now insert them into the public.users table. Real users require Supabase Auth UUIDs.
INSERT INTO users (user_id, college_id, college_name, prn_or_roll, name, email, user_type, year_of_study, branch, cgpa)
VALUES 
('11111111-1111-1111-1111-111111111111', 'VIT_PUNE', 'VIT Pune', '12210001', 'Test President (CSI)', 'president.csi@vit.edu', 'CLUB_LEAD', 'Third Year (TY)', 'Computer Engineering', 9.2),
('22222222-2222-2222-2222-222222222222', 'VIT_PUNE', 'VIT Pune', 'FAC001', 'Dr. Faculty Mentor', 'mentor@vit.edu', 'FACULTY_MENTOR', 'Faculty', 'Computer Engineering', 10.0),
('33333333-3333-3333-3333-333333333333', 'VIT_PUNE', 'VIT Pune', '12310055', 'Regular Student', 'student@vit.edu', 'STUDENT', 'Second Year (SY)', 'IT', 8.5)
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS college_id VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_no VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS short_name VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS vertical VARCHAR(50);

INSERT INTO clubs (club_id, club_no, college_id, name, short_name, tagline, vertical, website_url, instagram_handle, logo_bg, members_count, followers_count, description)
VALUES
('VIT_CSI', 'CS/2026/001', 'VIT_PUNE', 'Computer Society of India VIT Pune', 'CSI VIT Pune', 'Empowering Tech Enthusiasts', 'Technical', 'https://csivitpune.in', '@csi_vitpune', '#0C447C', 120, 850, 'The premier technical club of VIT Pune organizing workshops, hackathons, and tech talks.'),
('VIT_GDG', 'CS/2026/002', 'VIT_PUNE', 'Google Developer Groups VIT Pune', 'GDG VIT Pune', 'Build for everyone', 'Technical', 'https://www.gdgvitpune.com', '@gdgvitpune', '#16A34A', 90, 1100, 'University based community groups for students interested in Google developer technologies.'),
('VIT_EDC', 'CS/2026/003', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC VIT Pune', 'Ideate, Innovate, Incubate', 'Entrepreneurship', 'https://vishwapreneur.co.in', '@edc.vit', '#D97706', 75, 1300, 'Fostering the spirit of entrepreneurship through flagship events like Vishwapreneur.'),
('VIT_VELOCE', 'CS/2026/004', 'VIT_PUNE', 'Team Veloce Racing', 'Veloce Racing', 'Speed is our religion', 'Technical', 'https://veloceracing.in', '@veloceracing_vit', '#BE185D', 45, 950, 'The official Formula SAE team of VIT Pune building combustion and EV racecars.')
ON CONFLICT (club_id) DO NOTHING;

-- 4. Assign Roles (Memberships)
INSERT INTO memberships (membership_id, club_id, user_id, role_id, academic_year, valid_from, is_active)
VALUES
(uuid_generate_v4(), 'VIT_CSI', '11111111-1111-1111-1111-111111111111', 'President', '2026-27', CURRENT_DATE, true),
(uuid_generate_v4(), 'VIT_EDC', '22222222-2222-2222-2222-222222222222', 'Faculty_Advisor', '2026-27', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- 5. Insert Events
ALTER TABLE events ADD COLUMN IF NOT EXISTS college_id VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT 'Technical';

INSERT INTO events (event_id, club_id, club_name, college_id, college_name, title, description, event_type, vertical, event_date, event_time, venue_name, ticket_price, expected_count, status)
VALUES
(uuid_generate_v4(), 'VIT_CSI', 'CSI VIT Pune', 'VIT_PUNE', 'VIT Pune', 'Web Dev Bootcamp 2026', 'A 2-day intensive bootcamp on React and Next.js for beginners.', 'Workshop', 'Technical', '15 Sep 2026', '10:00 AM', 'Sharad Arena', 150.00, 200, 'live'),
(uuid_generate_v4(), 'VIT_GDG', 'GDG VIT Pune', 'VIT_PUNE', 'VIT Pune', 'DevFest Hackathon', '24-hour hackathon building solutions for local businesses.', 'Hackathon', 'Technical', '28 Oct 2026', '09:00 AM', 'Computer Center, Lab 1-4', 0.00, 300, 'live'),
(uuid_generate_v4(), 'VIT_EDC', 'EDC VIT Pune', 'VIT_PUNE', 'VIT Pune', 'Vishwapreneur 2026 (Proposals)', 'National level entrepreneurial summit with guest speakers.', 'Seminar', 'Entrepreneurship', '10 Jan 2027', '09:00 AM', 'Sharad Arena', 350.00, 1500, 'under_review'),
(uuid_generate_v4(), 'VIT_VELOCE', 'Veloce Racing', 'VIT_PUNE', 'VIT Pune', 'Car Unveiling Ceremony', 'Unveiling the new Formula SAE car for the 2026 season.', 'Events & Workshops', 'Technical', '05 Nov 2026', '04:00 PM', 'Main Ground', 0.00, 500, 'upcoming')
ON CONFLICT DO NOTHING;
