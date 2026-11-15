-- ==============================================================================
-- CLUBSYNC: COMPLETE DATABASE CLEANUP, STANDARDIZATION & REGISTRATION FIX
-- DBMS Course Project - Vishwakarma Institute of Technology, Pune (VIT Pune)
-- Target: PostgreSQL 15 / Supabase Cloud
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP UNWANTED MULTI-TENANCY TABLE & CONSTRAINTS (COLLEGES)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.clubs DROP CONSTRAINT IF EXISTS clubs_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.venues DROP CONSTRAINT IF EXISTS venues_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_college_id_fkey CASCADE;

DROP TABLE IF EXISTS public.colleges CASCADE;

-- Ensure default institutional scope is VIT_PUNE across all tables
ALTER TABLE IF EXISTS public.users ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.clubs ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.events ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.venues ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.event_registrations ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';

-- Ensure required columns exist on event_registrations
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS student_name VARCHAR(150);
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS student_email VARCHAR(255);
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'COMPLETED';

-- ------------------------------------------------------------------------------
-- 2. PURGE JUNK & UNWANTED ROWS ACROSS ALL TRANSACTION TABLES
-- ------------------------------------------------------------------------------
DELETE FROM public.event_registrations;
DELETE FROM public.event_settlements;
DELETE FROM public.event_approvals;
DELETE FROM public.tickets;
DELETE FROM public.events;
DELETE FROM public.venues;
DELETE FROM public.memberships;
DELETE FROM public.club_roles;

-- ------------------------------------------------------------------------------
-- 3. STANDARDIZE VENUES (VIT PUNE CAMPUS)
-- Eliminates dummy rows ('a', 'LAB27', 'Sharad Arena Auditorium' duplicates)
-- Guarantees clean, non-null capacity, building, and facilities columns.
-- ------------------------------------------------------------------------------
INSERT INTO public.venues (venue_id, name, building, capacity, venue_type, is_active) VALUES
('V_SHARAD_ARENA', 'Sharad Arena', 'Central Block', 1200, 'Auditorium', true),
('V_MAIN_AUDITORIUM', 'Main Auditorium', 'Auditorium Complex', 800, 'Auditorium', true),
('V_COMP_LABS', 'Computer Center Labs 1–4', 'IT Block 3rd Floor', 250, 'Computer Lab', true),
('V_INNOVATION_LAB_2', 'Innovation Lab 2', 'Mechanical Building', 100, 'Seminar Hall', true),
('V_SEMINAR_HALL_A', 'Seminar Hall A', 'Civil Engineering Block', 180, 'Seminar Hall', true),
('V_AMPHITHEATRE', 'Campus Amphitheatre', 'Student Activity Center', 600, 'Open Air', true)
ON CONFLICT (name) DO UPDATE SET
    building = EXCLUDED.building,
    capacity = EXCLUDED.capacity,
    venue_type = EXCLUDED.venue_type,
    is_active = true;

-- ------------------------------------------------------------------------------
-- 4. STANDARDIZE CLUBS & FILL UNWANTED NULL COLUMNS
-- ------------------------------------------------------------------------------
INSERT INTO public.clubs (
    club_id, college_id, name, short_name, vertical, campus,
    status, established_year, vision, mission, objectives, official_email, faculty_mentor, president_name
) VALUES
('VIT_CSI', 'VIT_PUNE', 'Computer Society of India (CSI)', 'CSI VIT Pune', 'Technical', 'Bibwewadi', 'ACTIVE', 1998,
 'Lead students toward excellence in software engineering, cloud computing, and AI.',
 'Conduct hands-on hackathons, technical symposiums, and industrial workshops.',
 'Foster industry-academia connect and open-source contributions.',
 'csi@vit.edu', 'Dr. S. K. Kulkarni', 'Arnav Deshmukh'),

('VIT_EDC', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC VIT Pune', 'Entrepreneurship', 'Bibwewadi', 'ACTIVE', 2012,
 'Ignite entrepreneurial mindset and incubate scalable student ventures.',
 'Connect student founders with angel investors, seed grants, and mentor networks.',
 'Host flagship national entrepreneurship conclaves.',
 'edc@vit.edu', 'Dr. S. K. Kulkarni', 'Tanmay Joshi'),

('VIT_GEDIT', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Bibwewadi', 'ACTIVE', 2018,
 'Champion design systems, frontend craftsmanship, and UI/UX accessibility.',
 'Bridge design-to-code gap using modern prototyping and component architectures.',
 'Train engineers in Figma tokens and frontend frameworks.',
 'gedit@vit.edu', 'Dr. S. K. Kulkarni', 'Riya Patil'),

('VIT_ROBOTICS', 'VIT_PUNE', 'Robotics & Automation Society', 'VIT Robotics', 'Technical', 'Bibwewadi', 'ACTIVE', 2015,
 'Pioneer autonomous robotics, ROS2 automation, and embedded IoT systems.',
 'Design autonomous rovers and participate in national robotics competitions.',
 'Equip students with hardware, firmware, and sensor integration skills.',
 'robotics@vit.edu', 'Prof. V. M. Phadke', 'Aditya Kulkarni'),

('VIT_CULTURAL', 'VIT_PUNE', 'VIT Cultural Society', 'Cultural Club', 'Cultural', 'Bibwewadi', 'ACTIVE', 2005,
 'Celebrate performing arts, theatrical drama, and vibrant campus heritage.',
 'Organize annual college festivals and inter-collegiate artistic showcases.',
 'Provide stage for musical, dramatic, and fine arts talents.',
 'cultural@vit.edu', 'Dr. Anita Joshi', 'Siddharth Rao'),

('VIT_IEEE', 'VIT_PUNE', 'IEEE Student Branch', 'IEEE VIT', 'Technical', 'Bibwewadi', 'ACTIVE', 2002,
 'Advancing technology for humanity through peer-reviewed student research.',
 'Publish technical papers, organize global conferences, and host AI symposiums.',
 'Connect student members with IEEE global engineering sections.',
 'ieee@vit.edu', 'Dr. P. K. Shinde', 'Neha Kulkarni'),

('VIT_ACM', 'VIT_PUNE', 'ACM Student Chapter', 'ACM VIT', 'Technical', 'Bibwewadi', 'ACTIVE', 2014,
 'Promote competitive programming, algorithmic research, and system engineering.',
 'Organize code sprints, low-latency workshops, and computing contests.',
 'Cultivate strong algorithmic problem-solving foundations.',
 'acm@vit.edu', 'Prof. A. S. Bhalerao', 'Varun Sen')
ON CONFLICT (club_id) DO UPDATE SET
    name = EXCLUDED.name,
    vertical = EXCLUDED.vertical,
    campus = EXCLUDED.campus,
    established_year = EXCLUDED.established_year,
    vision = EXCLUDED.vision,
    mission = EXCLUDED.mission,
    objectives = EXCLUDED.objectives,
    official_email = EXCLUDED.official_email,
    faculty_mentor = EXCLUDED.faculty_mentor,
    president_name = EXCLUDED.president_name;

-- ------------------------------------------------------------------------------
-- 5. STANDARDIZE CLUB ROLES & MEMBERSHIPS
-- ------------------------------------------------------------------------------
INSERT INTO public.club_roles (role_id, role_name, access_level, description) VALUES
('ROLE_PRESIDENT', 'President', 'PRESIDENT', 'Full administrative authority over club proposals, ticketing, and settlements'),
('ROLE_FACULTY', 'Faculty Mentor', 'FACULTY_MENTOR', 'Authority to review, sanction, request changes, or reject club proposals'),
('ROLE_SECRETARY', 'Secretary', 'EXECUTIVE', 'Assists in documentation, registrations, and logistics management'),
('ROLE_TREASURER', 'Treasurer', 'EXECUTIVE', 'Manages line-item budget submissions and expenditure bills'),
('ROLE_MEMBER', 'General Member', 'STUDENT', 'Enrolled club participant')
ON CONFLICT (role_id) DO UPDATE SET role_name = EXCLUDED.role_name;

-- Link canonical evaluator personas to clubs
INSERT INTO public.memberships (user_id, club_id, role_id, status) VALUES
('11111111-1111-1111-1111-111111111111', 'VIT_CSI', 'ROLE_PRESIDENT', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'VIT_CSI', 'ROLE_FACULTY', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'VIT_EDC', 'ROLE_FACULTY', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'VIT_GEDIT', 'ROLE_FACULTY', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'VIT_CSI', 'ROLE_MEMBER', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. INSERT 10 CANONICAL CAMPUS EVENTS (PROPER ROWS & COLUMNS)
-- ------------------------------------------------------------------------------

-- Event 1: Published National Hackathon
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000001', 'VIT_CSI', 'Computer Society of India (CSI)', 'VIT_PUNE',
    'HackVIT 2026: 36-Hour National Hackathon',
    'Flagship 36-hour inter-college hackathon building solutions for sustainability, healthcare, and education.',
    'Hackathon', 'NATIONAL',
    '2026-11-28', '09:00 AM – 09:00 PM', 'Computer Center Labs 1–4',
    'Developers, AI/ML Engineers & Problem Solvers', 250, 142,
    0.00, 'published',
    'Build cutting-edge decentralized, AI-driven, and sustainable campus solutions within 36 hours.',
    'Deploy 50+ open-source prototypes with mentorship from senior industry architects.',
    '[{"name": "Vikram Malhotra", "designation": "Principal Engineer, Google Cloud", "contact": "v.malhotra@google.com"}]'::JSONB,
    '{"income": 150000, "expenditure": 135000, "source_of_funds": "Industry Sponsorships (Devfolio, Polygon)"}'::JSONB,
    'Approved. Labs 1-4 reserved with high-speed uplink and overnight security.', 'Dr. S. K. Kulkarni', 1, false
);

-- Event 2: Published Tech Talk
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000002', 'VIT_CSI', 'Computer Society of India (CSI)', 'VIT_PUNE',
    'Building Scalable Cloud Microservices',
    'Learn modern full-stack system architecture, microservices orchestration, and database scaling from senior engineers.',
    'Tech Talk', 'INTRA_COLLEGE',
    '2026-12-02', '04:00 PM – 06:30 PM', 'Main Auditorium',
    'Computer, IT & AI/DS Students', 400, 285,
    0.00, 'published',
    'Deep dive into Docker, Kubernetes orchestration, distributed tracing, and high-concurrency database design.',
    'Architect resilient microservices architectures handling 10k+ requests per second.',
    '[{"name": "Aarav Mehta", "designation": "Staff Architect, AWS", "contact": "aarav@amazon.com"}]'::JSONB,
    '{"income": 20000, "expenditure": 18000, "source_of_funds": "CSI Operational Grant"}'::JSONB,
    'Approved. Excellent technical topic for third and final year students.', 'Dr. S. K. Kulkarni', 1, false
);

-- Event 3: Published Design Workshop
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000003', 'VIT_GEDIT', 'GedIT Technical Club', 'VIT_PUNE',
    'UI/UX Design Systems & Figma Tokens Masterclass',
    'A 3-hour masterclass on design tokens, component architecture, and WCAG accessibility standards for modern web applications.',
    'Workshop', 'INTRA_COLLEGE',
    '2026-12-05', '02:00 PM – 05:30 PM', 'Innovation Lab 2',
    'Frontend Developers, Product Designers & UI Enthusiasts', 80, 58,
    150.00, 'published',
    'Learn component tokens, atomic design, WCAG accessibility standards, and export design tokens into React/Tailwind.',
    'Publish an industry-grade design system UI kit ready for production code handoff.',
    '[{"name": "Riya Patil", "designation": "Staff Product Designer, Razorpay", "contact": "riya@razorpay.com"}]'::JSONB,
    '{"income": 12000, "expenditure": 9500, "source_of_funds": "Delegate Registration Fees"}'::JSONB,
    'Approved. Innovation Lab 2 booked with projector and high-speed Wi-Fi.', 'Dr. S. K. Kulkarni', 1, false
);

-- Event 4: Published Robotics Workshop
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000004', 'VIT_ROBOTICS', 'Robotics & Automation Society', 'VIT_PUNE',
    'Autonomous Rover & ROS2 Robotics Bootcamp',
    'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms on autonomous rovers.',
    'Workshop', 'INTER_COLLEGIATE',
    '2026-12-08', '10:00 AM – 04:00 PM', 'Seminar Hall A',
    'Mechanical, EnTC, Computer & Robotics Students', 120, 74,
    200.00, 'published',
    'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms on autonomous rovers.',
    'Program and navigate a physical miniature 4WD rover autonomously through a maze obstacle course.',
    '[{"name": "Dr. Anand Joshi", "designation": "Robotics Research Scientist, DRDO", "contact": "anand.j@drdo.gov.in"}]'::JSONB,
    '{"income": 24000, "expenditure": 21000, "source_of_funds": "Delegate Fees & Kit Sponsorship"}'::JSONB,
    'Sanctioned. Hardware demonstration safety protocol verified.', 'Prof. V. M. Phadke', 1, false
);

-- Event 5: Approved National Summit (Ready for President to Publish)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000005', 'VIT_EDC', 'Entrepreneurship Development Cell', 'VIT_PUNE',
    'Vishwapreneur 2027: National Startup Conclave',
    'Flagship national entrepreneurship summit hosting startup founders, venture capitalists, and live student pitch rooms.',
    'Seminar', 'NATIONAL',
    '2027-01-16', '09:30 AM – 06:00 PM', 'Sharad Arena',
    'Student Entrepreneurs, Angel Investors & Early Stage Founders', 1000, 0,
    350.00, 'approved',
    'National summit featuring unicorn founders, venture capital panel discussions, live angel pitch rooms, and networking.',
    'Seed-funding opportunities and angel mentorship for top 5 student startups.',
    '[{"name": "Naveen Kumar", "designation": "Founder & Angel Investor, Blume Ventures", "contact": "naveen@blume.vc"}]'::JSONB,
    '{"income": 450000, "expenditure": 380000, "source_of_funds": "Corporate Sponsors & Delegate Passes"}'::JSONB,
    'Sanctioned by Faculty Dean. Coordinate with campus security for VIP escort and parking logistics.', 'Dr. S. K. Kulkarni', 1, false
);

-- Event 6: Under Review Proposal (In Faculty Approval Queue)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000006', 'VIT_IEEE', 'IEEE Student Branch', 'VIT_PUNE',
    'AI Agents & Local LLM Fine-Tuning Symposium',
    'Explore LoRA fine-tuning, retrieval-augmented generation (RAG), and autonomous multi-agent swarms using open-weights models.',
    'Seminar', 'INTER_COLLEGIATE',
    '2026-12-12', '10:30 AM – 01:30 PM', 'Main Auditorium',
    'AI/DS, Computer Engineering, Research Scholars & Faculty', 350, 0,
    0.00, 'under_review',
    'Explore LoRA fine-tuning, retrieval-augmented generation (RAG), and autonomous multi-agent swarms using open-weights models.',
    'Publish student technical survey on agentic LLM workflows and benchmark on campus GPU clusters.',
    '[{"name": "Dr. Prateek Sharma", "designation": "AI Research Lead, Microsoft Research", "contact": "prateek@microsoft.com"}]'::JSONB,
    '{"income": 30000, "expenditure": 28000, "source_of_funds": "IEEE Pune Section Activity Grant"}'::JSONB,
    NULL, NULL, 1, false
);

-- Event 7: Under Review Proposal (In Faculty Approval Queue)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000007', 'VIT_ACM', 'ACM Student Chapter', 'VIT_PUNE',
    'Algorithmic Trading & High-Frequency Systems Workshop',
    'Implement order book matching simulation in C++20 and backtest momentum trading strategies on historical tick data.',
    'Workshop', 'INTRA_COLLEGE',
    '2026-12-15', '02:00 PM – 05:00 PM', 'Seminar Hall A',
    'Quantitative Finance Enthusiasts, Math & CS Students', 150, 0,
    100.00, 'under_review',
    'Implement order book matching simulation in C++20 and backtest momentum strategies on historical tick data.',
    'Construct an ultra-low latency matching engine in C++ with sub-microsecond event loops.',
    '[{"name": "Siddharth Deshpande", "designation": "Quantitative Strategist, Tower Research", "contact": "siddharth@tower.com"}]'::JSONB,
    '{"income": 15000, "expenditure": 12000, "source_of_funds": "Registration Fees"}'::JSONB,
    NULL, NULL, 1, false
);

-- Event 8: Changes Requested (Demonstrates Feedback Workflow)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000008', 'VIT_CULTURAL', 'VIT Cultural Society', 'VIT_PUNE',
    'Aarohan 2026: Annual Inter-College Cultural Fest',
    'Celebrate campus music, theatrical drama, and street play performances across Maharashtra engineering colleges.',
    'Cultural', 'INTER_COLLEGIATE',
    '2026-12-20', '05:00 PM – 10:00 PM', 'Campus Amphitheatre',
    'All College Students & Faculty', 800, 0,
    0.00, 'changes_requested',
    'Celebrate campus music, theatrical drama, and street play performances across Maharashtra colleges.',
    'Foster cross-college cultural exchange and artistic expression.',
    '[{"name": "Shreya Kulkarni", "designation": "Sangeet Natak Akademi Awardee", "contact": "shreya@arts.org"}]'::JSONB,
    '{"income": 120000, "expenditure": 140000, "source_of_funds": "Student Council Fund & Sponsors"}'::JSONB,
    'Budget expenditure exceeds projected sponsorship by ₹20,000. Please revise sound vendor estimates and resubmit.', 'Dr. Anita Joshi', 1, false
);

-- Event 9: Completed Event (With Financial Settlement Audit)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000009', 'VIT_CSI', 'Computer Society of India (CSI)', 'VIT_PUNE',
    'Cloud DevOps & CI/CD Pipeline Workshop',
    'Hands-on deployment of GitHub Actions, Docker containerization, and AWS ECS Fargate automation.',
    'Workshop', 'INTRA_COLLEGE',
    '2026-11-10', '10:00 AM – 01:00 PM', 'Computer Center Labs 1–4',
    'Computer Science Students', 120, 118,
    0.00, 'completed',
    'Hands-on deployment of GitHub Actions, Docker containerization, and AWS ECS Fargate automation.',
    'Each participant built and deployed a self-healing CI/CD pipeline on AWS.',
    '[{"name": "Rohan Chitnis", "designation": "DevOps Architect, Red Hat", "contact": "rohan@redhat.com"}]'::JSONB,
    '{"income": 15000, "expenditure": 14200, "source_of_funds": "CSI Student Chapter Grant"}'::JSONB,
    'Event successfully conducted. 118 students attended with verified practical submissions.', 'Dr. S. K. Kulkarni', 1, false
);

-- Event 10: Draft Event (Work in Progress by President)
INSERT INTO public.events (
    event_id, club_id, club_name, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version, is_deleted
) VALUES (
    '10000000-0000-0000-0000-000000000010', 'VIT_CSI', 'Computer Society of India (CSI)', 'VIT_PUNE',
    'Web3 & Smart Contract Security Audit Seminar',
    'Analyzing real-world reentrancy vulnerabilities, EVM bytecode security, and Foundry testing techniques.',
    'Tech Talk', 'INTRA_COLLEGE',
    '2026-12-28', '03:00 PM – 05:00 PM', 'Main Auditorium',
    'Blockchain & Cybersecurity Aspirants', 150, 0,
    0.00, 'draft',
    'Analyzing real-world reentrancy vulnerabilities, EVM bytecode security, and Foundry testing techniques.',
    'Conduct formal verification audit on vulnerable Solidity test contracts.',
    '[{"name": "Aditya Roy", "designation": "Security Researcher, OpenZeppelin", "contact": "aditya@openzeppelin.com"}]'::JSONB,
    '{"income": 10000, "expenditure": 8500, "source_of_funds": "CSI Treasury"}'::JSONB,
    NULL, NULL, 1, false
);

-- ------------------------------------------------------------------------------
-- 7. SEED TICKET TIERS WITH REAL VENUE CAPACITIES
-- ------------------------------------------------------------------------------
INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count, is_active) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hacker Pass', 0.00, 250, 142, true),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Standard Delegate Pass', 0.00, 400, 285, true),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Hands-on Workshop Pass', 150.00, 80, 58, true),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Robotics Delegate Pass', 200.00, 120, 74, true)
ON CONFLICT (ticket_id) DO UPDATE SET 
    total_capacity = EXCLUDED.total_capacity,
    sold_count = EXCLUDED.sold_count,
    price = EXCLUDED.price;

-- ------------------------------------------------------------------------------
-- 8. SEED CANONICAL STUDENT PASS FOR LIVE GATE SCANNER DEMO
-- ------------------------------------------------------------------------------
INSERT INTO public.event_registrations (
    registration_id, event_id, ticket_id, user_id, student_name, student_email,
    college_id, qr_token, check_in_status
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'Rohit Sharma',
    'rohit.sharma@vit.edu',
    'VIT_PUNE',
    'CS-PASS-9B2K4F-2940',
    'REGISTERED'
)
ON CONFLICT (event_id, student_email) DO UPDATE SET
    qr_token = EXCLUDED.qr_token,
    check_in_status = EXCLUDED.check_in_status;

-- ------------------------------------------------------------------------------
-- 9. SEED FACULTY APPROVAL LOG RECORDS
-- ------------------------------------------------------------------------------
INSERT INTO public.event_approvals (approval_id, event_id, decision, remarks, level, reviewer_name) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'APPROVED', 'Approved. Labs 1-4 reserved with high-speed uplink and overnight security.', 'FACULTY_MENTOR', 'Dr. S. K. Kulkarni'),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'APPROVED', 'Approved. Excellent technical topic for third and final year students.', 'FACULTY_MENTOR', 'Dr. S. K. Kulkarni'),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'APPROVED', 'Approved. Innovation Lab 2 booked with projector and high-speed Wi-Fi.', 'FACULTY_MENTOR', 'Dr. S. K. Kulkarni'),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'APPROVED', 'Sanctioned. Hardware demonstration safety protocol verified.', 'FACULTY_MENTOR', 'Prof. V. M. Phadke'),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'APPROVED', 'Sanctioned by Faculty Dean. Coordinate with campus security for VIP escort and parking logistics.', 'DEAN_ADMIN', 'Dr. S. K. Kulkarni'),
('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'CHANGES_REQUESTED', 'Budget expenditure exceeds projected sponsorship by ₹20,000. Please revise sound vendor estimates and resubmit.', 'FACULTY_MENTOR', 'Dr. Anita Joshi')
ON CONFLICT (approval_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. SEED POST-EVENT FINANCIAL AUDIT RECORD
-- ------------------------------------------------------------------------------
INSERT INTO public.event_settlements (
    settlement_id, event_id, sanctioned_amount, actual_expenditure, surplus_or_deficit,
    invoices_count, summary_notes, status
) VALUES (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000009',
    15000.00,
    14200.00,
    800.00,
    3,
    'All speaker honorariums, lab technician refreshments, and participation certificates disbursed within sanctioned budget.',
    'AUDITED'
)
ON CONFLICT (event_id) DO UPDATE SET
    sanctioned_amount = EXCLUDED.sanctioned_amount,
    actual_expenditure = EXCLUDED.actual_expenditure,
    surplus_or_deficit = EXCLUDED.surplus_or_deficit,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 11. REFRESH RLS POLICIES & PERMISSIONS FOR ERROR-FREE OPERATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;

-- Drop all old policies to avoid duplicates
DROP POLICY IF EXISTS "Public Read Access: Events" ON public.events;
DROP POLICY IF EXISTS "Public Read Access: Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public Read Access: Approvals" ON public.event_approvals;
DROP POLICY IF EXISTS "Public Read Access: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Public Read Access: Settlements" ON public.event_settlements;
DROP POLICY IF EXISTS "Public Read Access: Venues" ON public.venues;
DROP POLICY IF EXISTS "Public Read Access: Clubs" ON public.clubs;
DROP POLICY IF EXISTS "Public Read Access: Users" ON public.users;
DROP POLICY IF EXISTS "Public Read Access: Memberships" ON public.memberships;
DROP POLICY IF EXISTS "Public Read Access: ClubRoles" ON public.club_roles;

DROP POLICY IF EXISTS "Allow All Operations: Events" ON public.events;
DROP POLICY IF EXISTS "Allow All Operations: Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow All Operations: Approvals" ON public.event_approvals;
DROP POLICY IF EXISTS "Allow All Operations: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow All Operations: Settlements" ON public.event_settlements;
DROP POLICY IF EXISTS "Allow Insert: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Select: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Update: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Delete: Registrations" ON public.event_registrations;

-- Public READ for transparent academic inspection
CREATE POLICY "Public Read Access: Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Approvals" ON public.event_approvals FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Settlements" ON public.event_settlements FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Memberships" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "Public Read Access: ClubRoles" ON public.club_roles FOR SELECT USING (true);

-- Permissive write for registrations and events
CREATE POLICY "Allow All Operations: Events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Approvals" ON public.event_approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Registrations" ON public.event_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Settlements" ON public.event_settlements FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges to anon, authenticated, and service_role
GRANT ALL ON public.events TO anon, authenticated, service_role;
GRANT ALL ON public.tickets TO anon, authenticated, service_role;
GRANT ALL ON public.event_approvals TO anon, authenticated, service_role;
GRANT ALL ON public.event_registrations TO anon, authenticated, service_role;
GRANT ALL ON public.event_settlements TO anon, authenticated, service_role;
GRANT ALL ON public.venues TO anon, authenticated, service_role;
GRANT ALL ON public.clubs TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.memberships TO anon, authenticated, service_role;
GRANT ALL ON public.club_roles TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 12. STORED PROCEDURE: register_for_event (ACID CONCURRENCY LOCKING)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id UUID,
    p_ticket_tier VARCHAR DEFAULT 'Standard Pass',
    p_student_name VARCHAR DEFAULT NULL,
    p_student_email VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_event RECORD;
    v_ticket RECORD;
    v_user_id UUID;
    v_student_name VARCHAR;
    v_student_email VARCHAR;
    v_qr_token VARCHAR;
    v_registration_id UUID;
BEGIN
    -- 1. Identify current authenticated user (or fallback to provided params)
    v_student_email := COALESCE(NULLIF(TRIM(p_student_email), ''), auth.jwt() ->> 'email', 'president.csi@vit.edu');
    v_student_name := COALESCE(NULLIF(TRIM(p_student_name), ''), 'Club President / Student');

    -- Lookup user profile UUID from public.users if available
    SELECT user_id INTO v_user_id FROM public.users 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_student_email)) OR auth_user_id = auth.uid()
    LIMIT 1;

    -- 2. Validate Event
    SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
    IF v_event.event_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_FOUND', 'message', 'Event not found in database.');
    END IF;

    IF v_event.status NOT IN ('published', 'live', 'approved') THEN
        RETURN jsonb_build_object('success', false, 'error', 'REGISTRATION_CLOSED', 'message', 'Registration is not open for this event.');
    END IF;

    -- 3. Check for Duplicate Active Registration
    IF EXISTS (
        SELECT 1 FROM public.event_registrations 
        WHERE event_id = p_event_id 
          AND (
            (v_user_id IS NOT NULL AND user_id = v_user_id) 
            OR LOWER(TRIM(student_email)) = LOWER(TRIM(v_student_email))
          )
          AND check_in_status != 'CANCELLED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REGISTERED', 'message', 'You are already registered for this event.');
    END IF;

    -- 4. Pessimistic Lock on Ticket Tier (Anti-Overbooking Concurrency Protection)
    SELECT * INTO v_ticket FROM public.tickets 
    WHERE event_id = p_event_id 
    LIMIT 1 
    FOR UPDATE;

    IF v_ticket.ticket_id IS NOT NULL THEN
        IF v_ticket.sold_count >= v_ticket.total_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'SOLD_OUT', 'message', 'This event is completely sold out.');
        END IF;
    ELSE
        -- Auto-provision a default ticket tier if none exists
        INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
        VALUES (p_event_id, COALESCE(p_ticket_tier, 'Standard Pass'), COALESCE(v_event.ticket_price, 0), COALESCE(v_event.expected_count, 100), 0, true)
        RETURNING * INTO v_ticket;
    END IF;

    -- 5. Generate Cryptographic QR Token
    v_qr_token := 'CS-PASS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)) || '-' || TO_CHAR(CURRENT_TIMESTAMP, 'MISE');
    v_registration_id := gen_random_uuid();

    -- 6. Insert Registration Record
    INSERT INTO public.event_registrations (
        registration_id, event_id, ticket_id, user_id, student_name, student_email,
        qr_token, check_in_status, payment_status, college_id
    ) VALUES (
        v_registration_id, p_event_id, v_ticket.ticket_id, v_user_id, v_student_name, v_student_email,
        v_qr_token, 'REGISTERED', CASE WHEN COALESCE(v_event.ticket_price, 0) > 0 THEN 'PENDING' ELSE 'COMPLETED' END, 'VIT_PUNE'
    );

    -- 7. Atomically Increment Ticket Counter
    UPDATE public.tickets SET sold_count = sold_count + 1 WHERE ticket_id = v_ticket.ticket_id;
    UPDATE public.events SET registered_count = COALESCE(registered_count, 0) + 1 WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_registration_id,
        'qr_token', v_qr_token,
        'message', 'Registration confirmed and digital entry pass issued!'
    );
END;
$$;
