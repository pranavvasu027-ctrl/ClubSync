-- ==============================================================================
-- CLUBSYNC DATABASE SEED SCRIPT (DBMS Course Project & Production Demo)
-- Target: PostgreSQL 15 / Supabase
-- Populates the 8 Core Event Lifecycle Tables:
-- colleges, venues, users, clubs, events, tickets, event_registrations, event_settlements
-- ==============================================================================

-- 1. Insert College
INSERT INTO public.colleges (college_id, name, short_name, email_domain, city, state, logo_url)
VALUES ('VIT_PUNE', 'Vishwakarma Institute of Technology', 'VIT Pune', 'vit.edu', 'Pune', 'Maharashtra', 'https://www.vit.edu/images/logo.png')
ON CONFLICT (college_id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Insert Standard Campus Venues
INSERT INTO public.venues (venue_id, name, building, capacity, venue_type) VALUES
('V_SHARAD_ARENA', 'Sharad Arena', 'Central Block', 1200, 'Auditorium'),
('V_MAIN_AUDITORIUM', 'Main Auditorium', 'Auditorium Complex', 800, 'Auditorium'),
('V_COMP_LABS', 'Computer Center Labs 1–4', 'IT Block 3rd Floor', 250, 'Computer Lab'),
('V_INNOVATION_LAB_2', 'Innovation Lab 2', 'Mechanical Building', 100, 'Seminar Hall'),
('V_SEMINAR_HALL_A', 'Seminar Hall A', 'Civil Engineering Block', 180, 'Seminar Hall')
ON CONFLICT (venue_id) DO UPDATE SET capacity = EXCLUDED.capacity;

-- 3. Insert Persona Users
INSERT INTO public.users (user_id, college_id, prn_or_roll, name, email, user_type, year_of_study, branch, cgpa) VALUES
('11111111-1111-1111-1111-111111111111', 'VIT_PUNE', '12210001', 'Arnav Deshmukh (President)', 'president.csi@vit.edu', 'CLUB_LEAD', 'Third Year (TY)', 'Computer Engineering', 9.20),
('22222222-2222-2222-2222-222222222222', 'VIT_PUNE', 'FAC001', 'Dr. S. K. Kulkarni', 'mentor@vit.edu', 'FACULTY_MENTOR', 'Faculty', 'Computer Engineering', 10.00),
('33333333-3333-3333-3333-333333333333', 'VIT_PUNE', '12110789', 'Rohit Sharma', 'rohit.sharma@vit.edu', 'STUDENT', 'Third Year (TY)', 'Computer Engineering', 8.80),
('44444444-4444-4444-4444-444444444444', 'VIT_PUNE', 'DEAN01', 'Dr. P. B. Mane (Dean)', 'owner@clubsync.org', 'DEAN_ADMIN', 'Executive', 'Administration', 10.00)
ON CONFLICT (email) DO NOTHING;

-- 4. Insert Clubs
INSERT INTO public.clubs (club_id, club_no, college_id, name, short_name, vertical, faculty_mentor, president_name, official_email, logo_bg) VALUES
('VIT_CSI', 'CS/2026/001', 'VIT_PUNE', 'Computer Society of India (CSI)', 'CSI VIT Pune', 'Technical', 'Dr. S. K. Kulkarni', 'Arnav Deshmukh', 'csi@vit.edu', '#0C447C'),
('VIT_EDC', 'CS/2026/002', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC VIT Pune', 'Entrepreneurship', 'Dr. S. K. Kulkarni', 'EDC Lead', 'edc@vit.edu', '#D97706'),
('VIT_GEDIT', 'CS/2026/003', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Dr. S. K. Kulkarni', 'GedIT Lead', 'gedit@vit.edu', '#12A37A')
ON CONFLICT (club_id) DO NOTHING;

-- 5. Seed Events in Key Lifecycle States
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

-- 6. Ticket Inventory Tier
INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Pass', 0.00, 120, 1),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Workshop Pass', 150.00, 85, 0)
ON CONFLICT (ticket_id) DO NOTHING;

-- 7. Seed Student Pass for Live Gate Scanner Demo
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
