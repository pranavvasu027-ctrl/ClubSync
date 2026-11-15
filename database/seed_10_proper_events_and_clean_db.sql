-- ==============================================================================
-- CLUBSYNC: PURGE LEGACY JUNK EVENTS & SEED 10 CANONICAL CAMPUS EVENTS
-- DBMS Course Project (VIT Pune) - PostgreSQL 15 / Supabase Architecture
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP COLLEGES TABLE (Single Campus: VIT Pune)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.clubs DROP CONSTRAINT IF EXISTS clubs_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.venues DROP CONSTRAINT IF EXISTS venues_college_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_college_id_fkey CASCADE;

DROP TABLE IF EXISTS public.colleges CASCADE;

ALTER TABLE IF EXISTS public.users ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.clubs ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.events ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.venues ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.event_registrations ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';

-- ------------------------------------------------------------------------------
-- 2. PURGE ALL OLD / JUNK EVENT DATA & DEPENDENT RECORDS
-- ------------------------------------------------------------------------------
DELETE FROM public.event_registrations;
DELETE FROM public.event_settlements;
DELETE FROM public.event_approvals;
DELETE FROM public.tickets;
DELETE FROM public.events;

-- ------------------------------------------------------------------------------
-- 3. SEED STANDARDIZED CAMPUS VENUES (VIT PUNE)
-- ------------------------------------------------------------------------------
INSERT INTO public.venues (venue_id, name, building, capacity, venue_type) VALUES
('V_SHARAD_ARENA', 'Sharad Arena', 'Central Block', 1200, 'Auditorium'),
('V_MAIN_AUDITORIUM', 'Main Auditorium', 'Auditorium Complex', 800, 'Auditorium'),
('V_COMP_LABS', 'Computer Center Labs 1–4', 'IT Block 3rd Floor', 250, 'Computer Lab'),
('V_INNOVATION_LAB_2', 'Innovation Lab 2', 'Mechanical Building', 100, 'Seminar Hall'),
('V_SEMINAR_HALL_A', 'Seminar Hall A', 'Civil Engineering Block', 180, 'Seminar Hall'),
('V_AMPHITHEATRE', 'Campus Amphitheatre', 'Student Activity Center', 600, 'Open Air')
ON CONFLICT (name) DO UPDATE SET 
    building = EXCLUDED.building,
    capacity = EXCLUDED.capacity,
    venue_type = EXCLUDED.venue_type;

-- ------------------------------------------------------------------------------
-- 4. SEED VIT PUNE STUDENT CLUBS
-- ------------------------------------------------------------------------------
INSERT INTO public.clubs (club_id, club_no, college_id, name, short_name, vertical, faculty_mentor, president_name, official_email, logo_bg) VALUES
('VIT_CSI', 'CS/2026/001', 'VIT_PUNE', 'Computer Society of India (CSI)', 'CSI VIT Pune', 'Technical', 'Dr. S. K. Kulkarni', 'Arnav Deshmukh', 'csi@vit.edu', '#0C447C'),
('VIT_EDC', 'CS/2026/002', 'VIT_PUNE', 'Entrepreneurship Development Cell', 'EDC VIT Pune', 'Entrepreneurship', 'Dr. S. K. Kulkarni', 'Tanmay Joshi', 'edc@vit.edu', '#D97706'),
('VIT_GEDIT', 'CS/2026/003', 'VIT_PUNE', 'GedIT Technical Club', 'GedIT', 'Technical', 'Dr. S. K. Kulkarni', 'Riya Patil', 'gedit@vit.edu', '#12A37A'),
('VIT_ROBOTICS', 'CS/2026/004', 'VIT_PUNE', 'Robotics & Automation Society', 'VIT Robotics', 'Technical', 'Prof. V. M. Phadke', 'Aditya Kulkarni', 'robotics@vit.edu', '#7C3AED'),
('VIT_CULTURAL', 'CS/2026/005', 'VIT_PUNE', 'VIT Cultural Society', 'Cultural Club', 'Cultural', 'Dr. Anita Joshi', 'Siddharth Rao', 'cultural@vit.edu', '#F59E0B'),
('VIT_IEEE', 'CS/2026/006', 'VIT_PUNE', 'IEEE Student Branch', 'IEEE VIT', 'Technical', 'Dr. P. K. Shinde', 'Neha Kulkarni', 'ieee@vit.edu', '#2563EB'),
('VIT_ACM', 'CS/2026/007', 'VIT_PUNE', 'ACM Student Chapter', 'ACM VIT', 'Technical', 'Prof. A. S. Bhalerao', 'Varun Sen', 'acm@vit.edu', '#059669')
ON CONFLICT (club_id) DO UPDATE SET
    name = EXCLUDED.name,
    vertical = EXCLUDED.vertical,
    faculty_mentor = EXCLUDED.faculty_mentor,
    president_name = EXCLUDED.president_name;

-- ------------------------------------------------------------------------------
-- 5. INSERT 10 PROPER CAMPUS EVENTS (SHOWCASING COMPLETE DBMS LIFECYCLE)
-- ------------------------------------------------------------------------------

-- Event 1: Published National Hackathon
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000001', 'VIT_CSI', 'VIT_PUNE',
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
    'Approved. Labs 1-4 reserved with high-speed uplink and overnight security.', 'Dr. S. K. Kulkarni', 1
);

-- Event 2: Published Tech Talk
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000002', 'VIT_CSI', 'VIT_PUNE',
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
    'Approved. Excellent technical topic for third and final year students.', 'Dr. S. K. Kulkarni', 1
);

-- Event 3: Published Design Workshop
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000003', 'VIT_GEDIT', 'VIT_PUNE',
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
    'Approved. Innovation Lab 2 booked with projector and high-speed Wi-Fi.', 'Dr. S. K. Kulkarni', 1
);

-- Event 4: Published Robotics Workshop
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000004', 'VIT_ROBOTICS', 'VIT_PUNE',
    'Autonomous Rover & ROS2 Robotics Bootcamp',
    'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms on autonomous rovers.',
    'Workshop', 'INTER_COLLEGIATE',
    '2026-12-08', '10:00 AM – 04:00 PM', 'Seminar Hall A',
    'Mechanical, EnTC, Computer & Robotics Students', 120, 74,
    200.00, 'published',
    'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms on autonomous rovers.',
    'Program and navigate a physical miniature 4WD rover autonomously through a maze obstacle course.',
    '[{"name": "Dr. Anand Joshi", "designation": "Robotics Research Scientist, DRDO", "contact": "anand.j@drdo.gov.in"}]'::JSONB,
    '{"income": 24000, "expenditure": 21000, "source_of_funds": "Delegate Fees & Robotics Kit Sponsorship"}'::JSONB,
    'Sanctioned. Hardware demonstration safety protocol verified.', 'Prof. V. M. Phadke', 1
);

-- Event 5: Approved National Summit (Ready for President to Publish)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000005', 'VIT_EDC', 'VIT_PUNE',
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
    'Sanctioned by Faculty Dean. Coordinate with campus security for VIP escort and parking logistics.', 'Dr. S. K. Kulkarni', 1
);

-- Event 6: Under Review Proposal (In Faculty Approval Queue)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000006', 'VIT_IEEE', 'VIT_PUNE',
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
    NULL, NULL, 1
);

-- Event 7: Under Review Proposal (In Faculty Approval Queue)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000007', 'VIT_ACM', 'VIT_PUNE',
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
    NULL, NULL, 1
);

-- Event 8: Changes Requested (Demonstrates Feedback Workflow)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000008', 'VIT_CULTURAL', 'VIT_PUNE',
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
    'Budget expenditure exceeds projected sponsorship by ₹20,000. Please revise sound vendor estimates and resubmit.', 'Dr. Anita Joshi', 1
);

-- Event 9: Completed Event (With Financial Settlement Audit)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000009', 'VIT_CSI', 'VIT_PUNE',
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
    'Event successfully conducted. 118 students attended with verified practical submissions.', 'Dr. S. K. Kulkarni', 1
);

-- Event 10: Draft Event (Work in Progress by President)
INSERT INTO public.events (
    event_id, club_id, college_id, title, description, event_type, scope,
    event_date, event_time, venue_name, target_audience, expected_count, registered_count,
    ticket_price, status, objectives, expected_outcomes, guest_details, budget,
    faculty_remarks, faculty_name, current_version
) VALUES (
    '10000000-0000-0000-0000-000000000010', 'VIT_CSI', 'VIT_PUNE',
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
    NULL, NULL, 1
);

-- ------------------------------------------------------------------------------
-- 6. SEED TICKET INVENTORY TIERS (FOR PUBLISHED EVENTS)
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
-- 7. SEED CANONICAL STUDENT DIGITAL ENTRY PASS (FOR GATE SCANNER DEMO)
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
-- 8. SEED FACULTY APPROVAL AUDIT LOG RECORDS
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
-- 9. SEED POST-EVENT FINANCIAL AUDIT RECORD (FOR COMPLETED EVENT)
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
-- 10. CONFIGURE ROW LEVEL SECURITY POLICIES (RLS) FOR EVALUATION & DEMO
-- ------------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting restrictive policies
DROP POLICY IF EXISTS "Public Read Access: Events" ON public.events;
DROP POLICY IF EXISTS "Public Read Access: Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public Read Access: Approvals" ON public.event_approvals;
DROP POLICY IF EXISTS "Public Read Access: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Public Read Access: Settlements" ON public.event_settlements;
DROP POLICY IF EXISTS "Public Read Access: Venues" ON public.venues;
DROP POLICY IF EXISTS "Public Read Access: Clubs" ON public.clubs;
DROP POLICY IF EXISTS "Public Read Access: Users" ON public.users;

DROP POLICY IF EXISTS "Allow All Operations: Events" ON public.events;
DROP POLICY IF EXISTS "Allow All Operations: Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow All Operations: Approvals" ON public.event_approvals;
DROP POLICY IF EXISTS "Allow All Operations: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow All Operations: Settlements" ON public.event_settlements;
DROP POLICY IF EXISTS "Allow All Operations: Venues" ON public.venues;
DROP POLICY IF EXISTS "Allow All Operations: Clubs" ON public.clubs;
DROP POLICY IF EXISTS "Allow All Operations: Users" ON public.users;

-- Public READ for transparent evaluation
CREATE POLICY "Public Read Access: Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Approvals" ON public.event_approvals FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Settlements" ON public.event_settlements FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Users" ON public.users FOR SELECT USING (true);

-- Permissive write for authenticated demonstration roles
CREATE POLICY "Allow All Operations: Events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Tickets" ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Approvals" ON public.event_approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Registrations" ON public.event_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations: Settlements" ON public.event_settlements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant privileges to authenticated and service_role
GRANT ALL ON public.events TO authenticated, service_role;
GRANT ALL ON public.tickets TO authenticated, service_role;
GRANT ALL ON public.event_approvals TO authenticated, service_role;
GRANT ALL ON public.event_registrations TO authenticated, service_role;
GRANT ALL ON public.event_settlements TO authenticated, service_role;
GRANT ALL ON public.venues TO authenticated, service_role;
GRANT ALL ON public.clubs TO authenticated, service_role;
GRANT ALL ON public.users TO authenticated, service_role;
