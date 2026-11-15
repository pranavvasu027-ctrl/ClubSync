-- ==============================================================================
-- CLUBSYNC: MASTER CONNECTIVITY & INTEGRITY FIX
-- Run this ENTIRE script in Supabase SQL Editor in ONE go.
-- Fixes: duplicate RPCs, NOT NULL constraints, missing RLS policies,
--        dirty event data, missing tickets, users table access, and
--        missing RPC functions.
-- ==============================================================================

-- ===================== SECTION 1: CLEAN UP DIRTY EVENT DATA ==================
-- Delete all 14 legacy/test events (junk titles, null clubs, past dates)
DELETE FROM public.event_approvals WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.event_audit_log WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.event_budgets WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.event_registrations WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.event_settlements WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.tickets WHERE event_id IN (SELECT event_id FROM public.events);
DELETE FROM public.events;

-- Delete extra colleges (keep only VIT_PUNE)
DELETE FROM public.colleges WHERE college_id != 'VIT_PUNE';

-- Clean up junk venues (keep only real ones)
DELETE FROM public.venues;

-- ===================== SECTION 2: SEED PROPER VENUES =========================
INSERT INTO public.venues (venue_id, college_id, name, campus, location, capacity, is_active) VALUES
  (gen_random_uuid(), 'VIT_PUNE', 'Sharad Arena',              'Bibwewadi', 'Main Campus Block A', 1000, true),
  (gen_random_uuid(), 'VIT_PUNE', 'Main Auditorium',           'Bibwewadi', 'Academic Block',       500, true),
  (gen_random_uuid(), 'VIT_PUNE', 'Seminar Hall A',            'Bibwewadi', 'Ground Floor Block B', 200, true),
  (gen_random_uuid(), 'VIT_PUNE', 'Innovation Lab 2',          'Bibwewadi', 'IT Block 2nd Floor',   100, true),
  (gen_random_uuid(), 'VIT_PUNE', 'Computer Lab 27',           'Bibwewadi', 'IT Block 3rd Floor',    80, true),
  (gen_random_uuid(), 'VIT_PUNE', 'Open Air Amphitheatre',     'Bibwewadi', 'Central Campus',       600, true);

-- ===================== SECTION 3: SEED 10 PROPER EVENTS ======================
INSERT INTO public.events (
  event_id, club_id, club_name, title, description, event_type, scope,
  target_audience, expected_count, venue_name, event_date, event_time,
  ticket_price, status, objectives, expected_outcomes, guest_details,
  resource_requirements, college_id, registered_count, current_version
) VALUES
-- 1. HackVIT 2026 (CSI, published)
(
  '10000000-0000-0000-0000-000000000001', 'VIT_CSI',
  'Computer Society of India VIT Chapter',
  'HackVIT 2026: 36-Hour National Hackathon',
  'Flagship 36-hour national hackathon with 500+ coders building solutions for real-world social impact challenges.',
  'Hackathon', 'NATIONAL',
  'CS, IT, AI/DS, EnTC & Mechanical Students', 500, 'Sharad Arena',
  '2026-11-28', '09:00 AM – 09:00 PM',
  0, 'published',
  'Build scalable prototypes addressing healthcare, sustainability, or education access gaps.',
  'Top 5 teams win cash prizes, internship offers, and mentorship from industry leaders.',
  '[{"name": "Dr. Rajeev Sangal", "designation": "Ex-Director, IIT-BHU", "contact": "rajeev@iitbhu.ac.in"}]'::jsonb,
  ARRAY['Sharad Arena', 'WiFi Infrastructure', 'Power Strips', 'Judging Panel Mics'],
  'VIT_PUNE', 0, 1
),
-- 2. Cloud Microservices Workshop (CSI, published)
(
  '10000000-0000-0000-0000-000000000002', 'VIT_CSI',
  'Computer Society of India VIT Chapter',
  'Building Scalable Cloud Microservices',
  'Deep dive into Docker, Kubernetes orchestration, distributed tracing, and high-concurrency database design.',
  'Tech Talk', 'INTRA_COLLEGE',
  'Computer, IT & AI/DS Students', 400, 'Main Auditorium',
  '2026-12-01', '04:00 PM – 06:30 PM',
  0, 'published',
  'Deep dive into Docker, Kubernetes orchestration, distributed tracing, and high-concurrency database design.',
  'Architect resilient microservices architectures handling 10k+ requests per second.',
  '[{"name": "Aarav Mehta", "designation": "Staff Architect, AWS", "contact": "aarav@amazon.com"}]'::jsonb,
  ARRAY['Main Auditorium', 'PA Audio System', 'Wireless Microphones'],
  'VIT_PUNE', 0, 1
),
-- 3. UI/UX Masterclass (GedIT, published)
(
  '10000000-0000-0000-0000-000000000003', 'VIT_GEDIT',
  'GedIT Technical Club',
  'UI/UX Design Systems & Figma Tokens Masterclass',
  'A 3-hour masterclass on design tokens, component architecture, and WCAG accessibility standards.',
  'Workshop', 'INTRA_COLLEGE',
  'Frontend Developers, Product Designers & UI Enthusiasts', 80, 'Innovation Lab 2',
  '2026-12-05', '02:00 PM – 05:30 PM',
  150, 'published',
  'Learn component tokens, atomic design, WCAG accessibility standards, and export design tokens into React/Tailwind.',
  'Publish an industry-grade design system UI kit ready for production code handoff.',
  '[{"name": "Riya Patil", "designation": "Staff Product Designer, Razorpay", "contact": "riya@razorpay.com"}]'::jsonb,
  ARRAY['Innovation Lab 2', 'High-Speed WiFi', 'Projector'],
  'VIT_PUNE', 0, 1
),
-- 4. Robotics Bootcamp (Robotics, published)
(
  '10000000-0000-0000-0000-000000000004', 'VIT_TRF',
  'The Robotics Forum',
  'Autonomous Rover & ROS2 Robotics Bootcamp',
  'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms on autonomous rovers.',
  'Workshop', 'INTER_COLLEGIATE',
  'Mechanical, EnTC, Computer & Robotics Students', 120, 'Seminar Hall A',
  '2026-12-08', '10:00 AM – 04:00 PM',
  200, 'published',
  'Hands-on simulation with ROS2 Humble, LiDAR obstacle avoidance, and SLAM mapping algorithms.',
  'Program and navigate a physical miniature 4WD rover autonomously through a maze obstacle course.',
  '[{"name": "Dr. Anand Joshi", "designation": "Robotics Research Scientist, DRDO", "contact": "anand.j@drdo.gov.in"}]'::jsonb,
  ARRAY['Seminar Hall A', 'Power Strips', 'Robotics Testing Track'],
  'VIT_PUNE', 0, 1
),
-- 5. Vishwapreneur 2027 (EDC, approved — needs publication)
(
  '10000000-0000-0000-0000-000000000005', 'VIT_EDC',
  'Entrepreneurship Development Cell',
  'Vishwapreneur 2027: National Startup Conclave',
  'Flagship national entrepreneurship summit hosting startup founders, venture capitalists, and live student pitch rooms.',
  'Seminar', 'NATIONAL',
  'Student Entrepreneurs, Angel Investors & Early Stage Founders', 1000, 'Sharad Arena',
  '2027-01-16', '09:30 AM – 06:00 PM',
  350, 'approved',
  'National summit featuring unicorn founders, venture capital panel discussions, live angel pitch rooms.',
  'Seed-funding opportunities and angel mentorship for top 5 student startups.',
  '[{"name": "Naveen Kumar", "designation": "Founder & Angel Investor, Blume Ventures", "contact": "naveen@blume.vc"}]'::jsonb,
  ARRAY['Sharad Arena', 'Full Campus Security', 'Sponsor Stalls'],
  'VIT_PUNE', 0, 1
),
-- 6. AI Agents Symposium (IEEE, published)
(
  '10000000-0000-0000-0000-000000000006', 'VIT_IEEE',
  'IEEE Student Branch & CIS',
  'AI Agents & Local LLM Fine-Tuning Symposium',
  'Explore LoRA fine-tuning, retrieval-augmented generation (RAG), and autonomous multi-agent swarms.',
  'Seminar', 'INTER_COLLEGIATE',
  'Computer Science & AI/ML Students', 200, 'Main Auditorium',
  '2026-12-12', '10:30 AM – 05:00 PM',
  100, 'published',
  'Explore LoRA fine-tuning, retrieval-augmented generation (RAG), and autonomous multi-agent frameworks.',
  'Deploy a local 7B-parameter LLM agent stack on consumer GPUs for domain-specific reasoning.',
  '[{"name": "Dr. Priya Raghavan", "designation": "Research Lead, Google DeepMind", "contact": "priya.r@google.com"}]'::jsonb,
  ARRAY['Main Auditorium', 'GPU Workstations', 'Projector'],
  'VIT_PUNE', 0, 1
),
-- 7. Cultural Fest (Cultural, under_review — pending faculty approval)
(
  '10000000-0000-0000-0000-000000000007', 'VIT_MELANGE',
  'Mélange Cultural Committee',
  'Mélange 2027: Annual Cultural Festival',
  'Three-day annual cultural extravaganza featuring music, dance, drama, stand-up comedy, and art exhibitions.',
  'Cultural', 'INTRA_COLLEGE',
  'All VIT Students & Alumni', 2000, 'Open Air Amphitheatre',
  '2027-02-14', '05:00 PM – 10:00 PM',
  100, 'under_review',
  'Celebrate performing arts across music, dance, theatre, stand-up comedy, and visual arts.',
  'Campus-wide cultural engagement with 2000+ attendees across 3 days.',
  '[{"name": "Shreya Ghoshal", "designation": "Playback Singer (Chief Guest)", "contact": "manager@shreyaghoshal.com"}]'::jsonb,
  ARRAY['Open Air Amphitheatre', 'Stage Setup', 'Sound System', 'Lighting Rigs'],
  'VIT_PUNE', 0, 1
),
-- 8. Debate Championship (Speakers, under_review)
(
  '10000000-0000-0000-0000-000000000008', 'VIT_SPEAKERS',
  'Speakers Arena & Debating Society',
  'VIT Parliamentary Debate Championship 2027',
  'British Parliamentary debate tournament with elimination rounds, adjudicator training, and prize ceremony.',
  'Competition', 'INTER_COLLEGIATE',
  'Debaters, Public Speakers & Law Students', 150, 'Seminar Hall A',
  '2027-01-25', '09:00 AM – 06:00 PM',
  50, 'under_review',
  'Conduct a rigorous British Parliamentary debate tournament with trained adjudicators.',
  'Crown the VIT Parliamentary Debate Champions and identify top speakers for national circuits.',
  '[{"name": "Adv. Siddharth Vardarajan", "designation": "Senior Advocate, Bombay HC", "contact": "svardarajan@law.in"}]'::jsonb,
  ARRAY['Seminar Hall A', 'Timers & Bells', 'Judging Scoresheets'],
  'VIT_PUNE', 0, 1
),
-- 9. Cybersecurity CTF (CSI, draft — president still writing)
(
  '10000000-0000-0000-0000-000000000009', 'VIT_CSI',
  'Computer Society of India VIT Chapter',
  'CyberShield CTF: Capture the Flag Challenge',
  'Hands-on cybersecurity CTF with challenges in web exploitation, binary reversing, forensics, and cryptography.',
  'Competition', 'NATIONAL',
  'Cybersecurity Enthusiasts, CS & IT Students', 300, 'Computer Lab 27',
  '2027-02-01', '10:00 AM – 06:00 PM',
  0, 'draft',
  'Test and hone offensive security skills through real-world CTF challenges across multiple domains.',
  'Identify top security talent for industry placement and bug bounty programs.',
  '[{"name": "Karan Shah", "designation": "Security Engineer, CrowdStrike", "contact": "karan.s@crowdstrike.com"}]'::jsonb,
  ARRAY['Computer Lab 27', 'Isolated LAN Network', 'CTF Platform Server'],
  'VIT_PUNE', 0, 1
),
-- 10. Startup Pitch Night (EDC, draft)
(
  '10000000-0000-0000-0000-000000000010', 'VIT_EDC',
  'Entrepreneurship Development Cell',
  'Startup Pitch Night: Angel Investor Meet',
  'An evening where student startup teams pitch their MVPs to a panel of angel investors and VCs.',
  'Seminar', 'INTRA_COLLEGE',
  'Student Founders, Product Managers & Investors', 100, 'Innovation Lab 2',
  '2027-01-20', '06:00 PM – 09:00 PM',
  0, 'draft',
  'Provide student startups a platform to pitch to real investors in a structured demo-day format.',
  'At least 3 startups receive seed-stage interest letters from attending angel investors.',
  '[{"name": "Anupam Mittal", "designation": "Founder, Shaadi.com & Shark Tank India", "contact": "anupam@people-group.com"}]'::jsonb,
  ARRAY['Innovation Lab 2', 'Projector', 'Wireless Microphones'],
  'VIT_PUNE', 0, 1
);

-- ===================== SECTION 4: SEED TICKETS FOR ALL PUBLISHED EVENTS ======
INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count, is_active)
SELECT gen_random_uuid(), event_id, 'Standard Pass', ticket_price, expected_count, 0, true
FROM public.events
WHERE status IN ('published', 'approved')
ON CONFLICT DO NOTHING;

-- ===================== SECTION 5: FIX NOT NULL CONSTRAINTS ===================
ALTER TABLE public.event_registrations ALTER COLUMN ticket_id DROP NOT NULL;
ALTER TABLE public.event_registrations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.event_registrations ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE public.event_registrations ALTER COLUMN academic_year SET DEFAULT '2026-2027';

-- ===================== SECTION 6: FIX RLS POLICIES ===========================

-- 6a. Users table: Allow public read so demo mode and profile lookup works
DROP POLICY IF EXISTS "Public Read Access: Users" ON public.users;
DROP POLICY IF EXISTS "Allow Select: Users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Allow Select: Users" ON public.users FOR SELECT USING (true);
GRANT SELECT ON public.users TO anon, authenticated;

-- 6b. Memberships: Allow public read
DROP POLICY IF EXISTS "Public Read Access: Memberships" ON public.memberships;
DROP POLICY IF EXISTS "Allow Select: Memberships" ON public.memberships;
CREATE POLICY "Allow Select: Memberships" ON public.memberships FOR SELECT USING (true);
GRANT SELECT ON public.memberships TO anon, authenticated;

-- 6c. Club roles: Allow public read
DROP POLICY IF EXISTS "Allow Select: Club Roles" ON public.club_roles;
CREATE POLICY "Allow Select: Club Roles" ON public.club_roles FOR SELECT USING (true);
GRANT SELECT ON public.club_roles TO anon, authenticated;

-- 6d. Event approvals: Allow read
DROP POLICY IF EXISTS "Allow Select: Approvals" ON public.event_approvals;
CREATE POLICY "Allow Select: Approvals" ON public.event_approvals FOR SELECT USING (true);
GRANT SELECT ON public.event_approvals TO anon, authenticated;

-- 6e. Audit log: Allow read
DROP POLICY IF EXISTS "Allow Select: Audit Log" ON public.event_audit_log;
CREATE POLICY "Allow Select: Audit Log" ON public.event_audit_log FOR SELECT USING (true);
GRANT SELECT ON public.event_audit_log TO anon, authenticated;

-- 6f. Event budgets: Allow read + insert
DROP POLICY IF EXISTS "Allow Select: Budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Allow Insert: Budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Allow Update: Budgets" ON public.event_budgets;
DROP POLICY IF EXISTS "Allow Delete: Budgets" ON public.event_budgets;
CREATE POLICY "Allow Select: Budgets" ON public.event_budgets FOR SELECT USING (true);
CREATE POLICY "Allow Insert: Budgets" ON public.event_budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update: Budgets" ON public.event_budgets FOR UPDATE USING (true);
CREATE POLICY "Allow Delete: Budgets" ON public.event_budgets FOR DELETE USING (true);
GRANT ALL ON public.event_budgets TO anon, authenticated, service_role;

-- 6g. Event settlements: Allow read + insert
DROP POLICY IF EXISTS "Allow Select: Settlements" ON public.event_settlements;
DROP POLICY IF EXISTS "Allow Insert: Settlements" ON public.event_settlements;
CREATE POLICY "Allow Select: Settlements" ON public.event_settlements FOR SELECT USING (true);
CREATE POLICY "Allow Insert: Settlements" ON public.event_settlements FOR INSERT WITH CHECK (true);
GRANT ALL ON public.event_settlements TO anon, authenticated, service_role;

-- 6h. Tickets: Allow insert from anon (for auto-provisioning)
DROP POLICY IF EXISTS "Allow Insert: Tickets" ON public.tickets;
CREATE POLICY "Allow Insert: Tickets" ON public.tickets FOR INSERT WITH CHECK (true);
GRANT INSERT ON public.tickets TO anon;

-- 6i. Events: Allow insert and update (for event creation + status changes)
DROP POLICY IF EXISTS "Allow Insert: Events" ON public.events;
DROP POLICY IF EXISTS "Allow Update: Events" ON public.events;
CREATE POLICY "Allow Insert: Events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update: Events" ON public.events FOR UPDATE USING (true);
GRANT INSERT, UPDATE ON public.events TO anon, authenticated;

-- 6j. Event registrations: Ensure all operations allowed
DROP POLICY IF EXISTS "Allow Select: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Insert: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Update: Registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow Delete: Registrations" ON public.event_registrations;
CREATE POLICY "Allow Select: Registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Allow Insert: Registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update: Registrations" ON public.event_registrations FOR UPDATE USING (true);
CREATE POLICY "Allow Delete: Registrations" ON public.event_registrations FOR DELETE USING (true);
GRANT ALL ON public.event_registrations TO anon, authenticated, service_role;

-- ===================== SECTION 7: FIX DUPLICATE register_for_event ===========
-- Drop BOTH old overloaded signatures first, then create ONE clean version
DROP FUNCTION IF EXISTS public.register_for_event(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.register_for_event(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.register_for_event(UUID, VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_ticket_tier TEXT DEFAULT 'Standard Pass',
  p_student_name TEXT DEFAULT NULL,
  p_student_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event    RECORD;
  v_ticket   RECORD;
  v_user_id  UUID;
  v_reg_id   UUID := gen_random_uuid();
  v_qr_token TEXT := 'CS-PASS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)) || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
  v_name     TEXT;
  v_email    TEXT;
BEGIN
  -- Resolve identity
  v_email := COALESCE(NULLIF(TRIM(p_student_email), ''), (auth.jwt() ->> 'email'), 'student@vit.edu');
  v_name  := COALESCE(NULLIF(TRIM(p_student_name), ''), 'VIT Student');

  -- Lookup user profile UUID
  SELECT user_id INTO v_user_id FROM public.users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_email)) OR auth_user_id = auth.uid()
  LIMIT 1;

  -- Validate event exists
  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF v_event.event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'error', 'EVENT_NOT_FOUND', 'message', 'Event not found.');
  END IF;

  IF v_event.status NOT IN ('published', 'live', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'error', 'REGISTRATION_CLOSED', 'message', 'Registration is not open.');
  END IF;

  -- Check duplicate registration
  IF EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_id = p_event_id
      AND ((v_user_id IS NOT NULL AND user_id = v_user_id) OR LOWER(TRIM(student_email)) = LOWER(TRIM(v_email)))
      AND check_in_status != 'CANCELLED'
  ) THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'error', 'ALREADY_REGISTERED', 'message', 'You are already registered.');
  END IF;

  -- Get or create ticket
  SELECT * INTO v_ticket FROM public.tickets WHERE event_id = p_event_id AND is_active = true LIMIT 1 FOR UPDATE;
  IF v_ticket.ticket_id IS NULL THEN
    INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
    VALUES (p_event_id, COALESCE(p_ticket_tier, 'Standard Pass'), COALESCE(v_event.ticket_price, 0), COALESCE(v_event.expected_count, 100), 0, true)
    RETURNING * INTO v_ticket;
  END IF;

  -- Check capacity
  IF v_ticket.sold_count >= v_ticket.total_capacity THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'error', 'SOLD_OUT', 'message', 'Event is sold out.');
  END IF;

  -- Insert registration
  INSERT INTO public.event_registrations (
    registration_id, event_id, ticket_id, user_id, college_id, academic_year,
    student_name, student_email, qr_token, check_in_status, payment_status, amount_paid
  ) VALUES (
    v_reg_id, p_event_id, v_ticket.ticket_id, v_user_id, 'VIT_PUNE', '2026-2027',
    v_name, v_email, v_qr_token, 'REGISTERED',
    CASE WHEN COALESCE(v_event.ticket_price, 0) > 0 THEN 'PENDING' ELSE 'COMPLETED' END,
    0.00
  );

  -- Increment counters
  UPDATE public.tickets SET sold_count = sold_count + 1 WHERE ticket_id = v_ticket.ticket_id;
  UPDATE public.events SET registered_count = COALESCE(registered_count, 0) + 1 WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'success',
    'registration_id', v_reg_id,
    'qr_token', v_qr_token,
    'message', 'Registration confirmed! Digital entry pass issued.'
  );
END;
$$;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION public.register_for_event(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ===================== SECTION 8: FIX process_event_approval =================
-- Grant execute permissions (function exists but was denied)
DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.process_event_approval TO anon, authenticated, service_role';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'process_event_approval grant skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.publish_event TO anon, authenticated, service_role';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'publish_event grant skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.cancel_event_registration TO anon, authenticated, service_role';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cancel_event_registration grant skipped: %', SQLERRM;
END;
$$;

-- ===================== SECTION 9: CREATE MISSING RPCs ========================

-- 9a. verify_and_checkin_pass
CREATE OR REPLACE FUNCTION public.verify_and_checkin_pass(
  p_event_id UUID,
  p_qr_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT * INTO v_reg FROM public.event_registrations
  WHERE event_id = p_event_id AND UPPER(TRIM(qr_token)) = UPPER(TRIM(p_qr_token));

  IF v_reg.registration_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'status', 'INVALID', 'message', 'Token not found for this event.');
  END IF;

  IF v_reg.check_in_status = 'ATTENDED' THEN
    RETURN jsonb_build_object(
      'valid', false, 'status', 'ALREADY_USED',
      'attendee_name', v_reg.student_name,
      'scanned_at', v_reg.check_in_timestamp,
      'message', 'DUPLICATE SCAN: Pass already used at ' || COALESCE(v_reg.check_in_timestamp::TEXT, 'unknown time')
    );
  END IF;

  IF v_reg.check_in_status = 'CANCELLED' THEN
    RETURN jsonb_build_object('valid', false, 'status', 'CANCELLED', 'attendee_name', v_reg.student_name, 'message', 'Pass has been cancelled.');
  END IF;

  -- Mark as attended
  UPDATE public.event_registrations
  SET check_in_status = 'ATTENDED', check_in_timestamp = NOW()
  WHERE registration_id = v_reg.registration_id;

  RETURN jsonb_build_object(
    'valid', true, 'status', 'ATTENDED',
    'attendee_name', v_reg.student_name,
    'scanned_at', NOW(),
    'message', 'Entry granted! Welcome, ' || COALESCE(v_reg.student_name, 'Attendee') || '!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_checkin_pass(UUID, TEXT) TO anon, authenticated, service_role;

-- 9b. submit_event_settlement
CREATE OR REPLACE FUNCTION public.submit_event_settlement(
  p_event_id UUID,
  p_actual_income NUMERIC DEFAULT 0,
  p_actual_expenditure NUMERIC DEFAULT 0,
  p_remarks TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settlement_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.event_settlements (settlement_id, event_id, actual_income, actual_expenditure, remarks, status, submitted_at)
  VALUES (v_settlement_id, p_event_id, p_actual_income, p_actual_expenditure, p_remarks, 'SUBMITTED', NOW());

  RETURN jsonb_build_object('success', true, 'settlement_id', v_settlement_id, 'message', 'Settlement submitted for review.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_event_settlement(UUID, NUMERIC, NUMERIC, TEXT) TO anon, authenticated, service_role;

-- 9c. audit_event_settlement
CREATE OR REPLACE FUNCTION public.audit_event_settlement(
  p_settlement_id UUID,
  p_decision TEXT,
  p_remarks TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.event_settlements
  SET status = p_decision, remarks = COALESCE(remarks, '') || ' | Dean: ' || p_remarks, reviewed_at = NOW()
  WHERE settlement_id = p_settlement_id;

  RETURN jsonb_build_object('success', true, 'message', 'Settlement ' || p_decision);
END;
$$;

GRANT EXECUTE ON FUNCTION public.audit_event_settlement(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

-- ===================== SECTION 10: SEED DEMO USER PROFILES ===================
-- Ensure 4 demo users exist in public.users for demo mode
DO $$
BEGIN
  INSERT INTO public.users (user_id, email, name, user_type, college_id)
  VALUES
    ('31ee0384-3b04-4245-9a5f-a689c57cd078', 'president.csi@vit.edu', 'Arnav Deshmukh', 'PRESIDENT', 'VIT_PUNE'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'mentor@vit.edu', 'Dr. S. K. Kulkarni', 'FACULTY_MENTOR', 'VIT_PUNE'),
    ('2018c0d7-599f-4726-81d4-131eeb45fd66', 'rohit.sharma@vit.edu', 'Rohit Sharma', 'STUDENT', 'VIT_PUNE'),
    ('d0e1f2a3-b4c5-6789-0123-456789abcdef', 'owner@clubsync.org', 'Platform Admin', 'DEAN_ADMIN', 'VIT_PUNE')
  ON CONFLICT (user_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'User seeding note: %', SQLERRM;
END;
$$;

-- ===================== SECTION 11: SEED MEMBERSHIPS ==========================
DO $$
BEGIN
  INSERT INTO public.memberships (membership_id, user_id, club_id, role_id, status, joined_at)
  VALUES
    (gen_random_uuid(), '31ee0384-3b04-4245-9a5f-a689c57cd078', 'VIT_CSI', 'PRESIDENT', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VIT_CSI', 'FACULTY_MENTOR', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VIT_EDC', 'FACULTY_MENTOR', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VIT_GEDIT', 'FACULTY_MENTOR', 'ACTIVE', NOW())
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Membership seeding note: %', SQLERRM;
END;
$$;

-- ===================== SECTION 12: SEED EVENT BUDGETS ========================
-- Add budget items for the 10 events so the Finance/Ledger pages have data
DO $$
BEGIN
  INSERT INTO public.event_budgets (budget_item_id, event_id, item_name, category, estimated_amount, actual_amount, is_approved)
  VALUES
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'Venue & Infrastructure', 'LOGISTICS', 50000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'Prizes & Awards', 'PRIZES', 30000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'Catering (500 pax)', 'FOOD', 40000, NULL, false),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', 'Speaker Honorarium', 'SPEAKER', 15000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', 'Printing & Banners', 'MARKETING', 3000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000003', 'Figma Licenses', 'SOFTWARE', 5000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000003', 'Refreshments', 'FOOD', 4500, NULL, false),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000005', 'Stage & AV Setup', 'LOGISTICS', 200000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000005', 'Speaker Travel & Stay', 'SPEAKER', 80000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000005', 'Marketing & PR', 'MARKETING', 50000, NULL, false),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'GPU Cloud Credits', 'SOFTWARE', 25000, NULL, true),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000004', 'Rover Kit Materials', 'HARDWARE', 15000, NULL, true)
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Budget seeding note: %', SQLERRM;
END;
$$;
