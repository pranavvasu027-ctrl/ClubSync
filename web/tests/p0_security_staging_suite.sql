-- ==============================================================================
-- CLUBSYNC P0 SECURITY STAGING VERIFICATION SUITE
-- File: web/tests/p0_security_staging_suite.sql
-- Workstream: Database (Chat 3)
-- Status: Executable against Disposable PostgreSQL / Supabase Staging Instance
-- Version: 2.0 (Phase 2D Comprehensive Coverage)
-- Safety: Never uses catch-all WHEN OTHERS. Traps explicit SQLSTATEs.
--         Asserts fixture existence prior to test execution.
--         Verifies database state post-conditions.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- FIXTURE SETUP (Isolated Disposable Sandbox)
-- ------------------------------------------------------------------------------
-- 1. Test Institution & Two Isolated Clubs
INSERT INTO public.colleges (college_id, name, short_name, email_domain)
VALUES ('VIT_TEST', 'Vishwakarma Institute of Technology (Test)', 'VIT Test', 'test.vit.edu')
ON CONFLICT (college_id) DO NOTHING;

INSERT INTO public.clubs (club_id, college_id, name, short_name, vertical, status)
VALUES 
('CLUB_ALPHA', 'VIT_TEST', 'Alpha Tech Club', 'Alpha', 'Technical', 'ACTIVE'),
('CLUB_BETA', 'VIT_TEST', 'Beta Cultural Club', 'Beta', 'Cultural', 'ACTIVE')
ON CONFLICT (club_id) DO NOTHING;

-- 2. Test Users & Authentication Identifiers
-- Identity Mapping:
-- - Student 1 (Regular):  user_id = aaaaaaaa-1111..., auth_user_id = 00000000-0000-...-0001
-- - President Alpha:     user_id = aaaaaaaa-2222..., auth_user_id = 00000000-0000-...-0002
-- - Faculty Alpha:       user_id = aaaaaaaa-3333..., auth_user_id = 00000000-0000-...-0003
-- - Faculty Beta:        user_id = aaaaaaaa-4444..., auth_user_id = 00000000-0000-...-0004
-- - Platform Admin:      user_id = aaaaaaaa-5555..., auth_user_id = 00000000-0000-...-0005
INSERT INTO public.users (user_id, auth_user_id, college_id, name, email, user_type, cgpa, prn_or_roll, phone) VALUES
('aaaaaaaa-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'VIT_TEST', 'Test Student 1', 'student.test@vit.edu', 'STUDENT', 8.50, 'PRN_STU_01', '+919999999991'),
('aaaaaaaa-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'VIT_TEST', 'President Alpha', 'pres.alpha@vit.edu', 'STUDENT', 9.10, 'PRN_PRE_02', '+919999999992'),
('aaaaaaaa-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'VIT_TEST', 'Prof. Faculty Alpha', 'faculty.alpha@vit.edu', 'FACULTY_MENTOR', 10.0, 'FAC_03', '+919999999993'),
('aaaaaaaa-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000004', 'VIT_TEST', 'Prof. Faculty Beta', 'faculty.beta@vit.edu', 'FACULTY_MENTOR', 10.0, 'FAC_04', '+919999999994'),
('aaaaaaaa-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000005', 'VIT_TEST', 'Platform SuperAdmin', 'admin@vit.edu', 'SUPER_ADMIN', 10.0, 'ADM_05', '+919999999995')
ON CONFLICT (email) DO NOTHING;

-- 3. Test Memberships
INSERT INTO public.memberships (membership_id, club_id, user_id, role_id, status) VALUES
('bbbbbbbb-1111-1111-1111-111111111111', 'CLUB_ALPHA', 'aaaaaaaa-2222-2222-2222-222222222222', 'President', 'ACTIVE'),
('bbbbbbbb-2222-2222-2222-222222222222', 'CLUB_ALPHA', 'aaaaaaaa-3333-3333-3333-333333333333', 'Faculty_Advisor', 'ACTIVE'),
('bbbbbbbb-3333-3333-3333-333333333333', 'CLUB_BETA', 'aaaaaaaa-4444-4444-4444-444444444444', 'Faculty_Advisor', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 4. Test Events for CLUB_ALPHA
INSERT INTO public.events (event_id, club_id, college_id, title, event_type, event_date, event_time, status) VALUES
('cccccccc-1111-1111-1111-111111111111', 'CLUB_ALPHA', 'VIT_TEST', 'Alpha Annual Hackathon (Draft)', 'Hackathon', '2026-11-15', '10:00 AM', 'draft'),
('cccccccc-2222-2222-2222-222222222222', 'CLUB_ALPHA', 'VIT_TEST', 'Alpha Review Event (Review)', 'Seminar', '2026-11-20', '02:00 PM', 'under_review'),
('cccccccc-3333-3333-3333-333333333333', 'CLUB_ALPHA', 'VIT_TEST', 'Alpha Approved Event (Approved)', 'Workshop', '2026-11-25', '11:00 AM', 'approved')
ON CONFLICT DO NOTHING;

-- 5. Test Recruitment Drive & Application
INSERT INTO public.recruitment_drives (drive_id, club_id, title, deadline_date, status) VALUES
('dddddddd-1111-1111-1111-111111111111', 'CLUB_ALPHA', 'Alpha Core Team Hiring 2026', '2026-12-01', 'OPEN')
ON CONFLICT DO NOTHING;

INSERT INTO public.applications (application_id, drive_id, club_id, applicant_id, applicant_name, applicant_email, applicant_prn, applied_role, status) VALUES
('eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111', 'CLUB_ALPHA', 'aaaaaaaa-1111-1111-1111-111111111111', 'Test Student 1', 'student.test@vit.edu', 'PRN_STU_01', 'Developer', 'APPLIED')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- PRE-CHECK: VERIFY TEST FIXTURE EXISTENCE
-- Fail fast if test harness setup was incomplete.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = 'aaaaaaaa-1111-1111-1111-111111111111') THEN
    RAISE EXCEPTION 'TEST SETUP FAILED: Student fixture missing.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE event_id = 'cccccccc-1111-1111-1111-111111111111') THEN
    RAISE EXCEPTION 'TEST SETUP FAILED: Event fixture missing.';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 1: PRIVILEGE ESCALATION SHIELD (Negative)
-- Assert student cannot modify user_type to SUPER_ADMIN.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_caught_error BOOLEAN := FALSE;
  v_user_type VARCHAR;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.users 
    SET user_type = 'SUPER_ADMIN' 
    WHERE auth_user_id = '00000000-0000-0000-0000-000000000001';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught_error := TRUE;
  END;

  IF NOT v_caught_error THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-01]: Student was able to modify user_type without SQLSTATE 42501!';
  END IF;

  SELECT user_type INTO v_user_type FROM public.users WHERE auth_user_id = '00000000-0000-0000-0000-000000000001';
  IF v_user_type != 'STUDENT' THEN
    RAISE EXCEPTION 'STATE CORRUPTED [T-01]: user_type is % instead of STUDENT!', v_user_type;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-01: Privilege escalation strictly rejected with SQLSTATE 42501.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 2: ANONYMOUS PII HARVESTING BLOCK (Negative)
-- Assert anonymous caller cannot perform direct SELECT on public.users.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_caught_anon_error BOOLEAN := FALSE;
  v_row_count INT;
BEGIN
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);

  BEGIN
    SELECT COUNT(*) INTO v_row_count FROM public.users;
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught_anon_error := TRUE;
  END;

  IF NOT v_caught_anon_error THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-02]: Anonymous user was granted direct SELECT on public.users!';
  END IF;

  RAISE NOTICE '✅ [PASSED] T-02: Direct public.users SELECT rejected for anonymous role.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 3: PEER PRIVATE PII MASKING (Negative)
-- Assert student can read own record but RLS returns 0 rows for peer private PII.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_own_phone VARCHAR;
  v_peer_phone VARCHAR;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- 1. Read own phone (Must succeed)
  SELECT phone INTO v_own_phone FROM public.users WHERE user_id = 'aaaaaaaa-1111-1111-1111-111111111111';
  IF v_own_phone IS NULL THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-03A]: Student could not read own phone number!';
  END IF;

  -- 2. Attempt to query peer president's phone
  SELECT phone INTO v_peer_phone FROM public.users WHERE user_id = 'aaaaaaaa-2222-2222-2222-222222222222';
  IF v_peer_phone IS NOT NULL THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-03B]: Student was able to read peer phone (%!)', v_peer_phone;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-03: Student can read own profile; peer private profile PII masked by RLS.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 4: SANITIZED DIRECTORY VIEW ACCESS (Positive)
-- Assert student can read peer public portfolio fields from v_public_user_profiles.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_peer_name VARCHAR;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT name INTO v_peer_name 
  FROM public.v_public_user_profiles 
  WHERE user_id = 'aaaaaaaa-2222-2222-2222-222222222222';

  IF v_peer_name IS NULL OR v_peer_name != 'President Alpha' THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-04]: Student could not read peer name from public profile view!';
  END IF;

  RAISE NOTICE '✅ [PASSED] T-04: Sanitized public profile view safely exposes permitted portfolio data.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 5: ANONYMOUS DRAFT/UNDER_REVIEW EVENT LEAK SHIELD (Negative)
-- Assert anonymous users cannot query draft or under-review events (GAP-01 fix).
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_draft_count INT;
BEGIN
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);

  SELECT COUNT(*) INTO v_draft_count 
  FROM public.events 
  WHERE event_id IN ('cccccccc-1111-1111-1111-111111111111', 'cccccccc-2222-2222-2222-222222222222');

  IF v_draft_count > 0 THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-05]: Anonymous caller was able to view % unapproved events!', v_draft_count;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-05: Draft and under-review events completely hidden from anonymous users.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 6: CROSS-CLUB EVENT INSERTION ISOLATION (Negative)
-- Assert President Alpha cannot create events for Club Beta.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_caught_check_error BOOLEAN := FALSE;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    INSERT INTO public.events (club_id, college_id, title, event_type, event_date, event_time, status)
    VALUES ('CLUB_BETA', 'VIT_TEST', 'Unauthorized Cross-Club Proposal', 'Workshop', '2026-12-01', '10:00 AM', 'draft');
  EXCEPTION 
    WHEN check_violation OR insufficient_privilege THEN
      v_caught_check_error := TRUE;
  END;

  IF NOT v_caught_check_error THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-06]: President Alpha inserted event into Club Beta!';
  END IF;

  RAISE NOTICE '✅ [PASSED] T-06: Cross-club event insertion rejected by RLS WITH CHECK.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 7: PROHIBITED EVENT STATE TRANSITION (Negative)
-- Assert President Alpha cannot bypass faculty review and publish directly from draft.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_caught_publish_error BOOLEAN := FALSE;
  v_status VARCHAR;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.events 
    SET status = 'published' 
    WHERE event_id = 'cccccccc-1111-1111-1111-111111111111';
  EXCEPTION 
    WHEN check_violation OR insufficient_privilege THEN
      v_caught_publish_error := TRUE;
  END;

  IF NOT v_caught_publish_error THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-07]: President directly published unapproved draft event!';
  END IF;

  SELECT status INTO v_status FROM public.events WHERE event_id = 'cccccccc-1111-1111-1111-111111111111';
  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'STATE CORRUPTED [T-07]: Event status mutated to %!', v_status;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-07: Direct publication from draft strictly blocked by WITH CHECK.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 8: AUTHORIZED EVENT PUBLISHING (Positive)
-- Assert President Alpha CAN publish an event whose status is already 'approved'.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_new_status VARCHAR;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Event cccccccc-3333 is in 'approved' status
  UPDATE public.events 
  SET status = 'published' 
  WHERE event_id = 'cccccccc-3333-3333-3333-333333333333';

  SELECT status INTO v_new_status FROM public.events WHERE event_id = 'cccccccc-3333-3333-3333-333333333333';
  IF v_new_status != 'published' THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-08]: President could not publish approved event (status: %)!', v_new_status;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-08: Authorized President published approved event successfully.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 9: FACULTY PURVIEW ISOLATION ON APPROVALS (Positive & Negative)
-- Assert Faculty Beta CANNOT approve Club Alpha event, but Faculty Alpha CAN.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_caught_purview_error BOOLEAN := FALSE;
  v_approval_res JSONB;
BEGIN
  -- 1. Faculty Beta attempts to approve Club Alpha event (Must Fail)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000004", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.process_event_approval(
      'cccccccc-2222-2222-2222-222222222222',
      'FACULTY_MENTOR',
      'APPROVED',
      'Unauthorized cross-club approval attempt'
    );
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught_purview_error := TRUE;
  END;

  IF NOT v_caught_purview_error THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-09A]: Faculty Beta approved event for Club Alpha!';
  END IF;

  -- 2. Faculty Alpha approves Club Alpha event (Must Succeed)
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  v_approval_res := public.process_event_approval(
    'cccccccc-2222-2222-2222-222222222222',
    'FACULTY_MENTOR',
    'APPROVED',
    'Legitimate faculty mentor approval'
  );

  IF (v_approval_res->>'success')::BOOLEAN != TRUE OR (v_approval_res->>'new_status') != 'approved' THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-09B]: Faculty Alpha legitimate approval failed: %', v_approval_res;
  END IF;

  RAISE NOTICE '✅ [PASSED] T-09: Faculty purview isolation strictly enforced across supervised clubs.';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 10: RECRUITMENT & APPLICATION PRIVACY (Positive & Negative)
-- Assert applicant reads own application, recruiter reads candidate, but applicant cannot read evaluations.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_app_id UUID;
  v_eval_count INT;
BEGIN
  -- Insert interview evaluation as service_role
  SET LOCAL ROLE service_role;
  INSERT INTO public.interview_evaluations (evaluation_id, application_id, interviewer_id, score, remarks)
  VALUES ('ffffffff-1111-1111-1111-111111111111', 'eeeeeeee-1111-1111-1111-111111111111', 'aaaaaaaa-2222-2222-2222-222222222222', 9.50, 'Outstanding candidate')
  ON CONFLICT DO NOTHING;

  -- 1. Recruiter Alpha views applicant (Must Succeed)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT application_id INTO v_app_id 
  FROM public.applications 
  WHERE application_id = 'eeeeeeee-1111-1111-1111-111111111111';

  IF v_app_id IS NULL THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-10A]: Recruiter Alpha could not view club candidate application!';
  END IF;

  -- 2. Applicant attempts to read confidential evaluation notes (Must Fail / Return 0 rows)
  PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT COUNT(*) INTO v_eval_count 
  FROM public.interview_evaluations 
  WHERE application_id = 'eeeeeeee-1111-1111-1111-111111111111';

  IF v_eval_count > 0 THEN
    RAISE EXCEPTION 'ASSERTION FAILED [T-10B]: Candidate was able to view confidential interview evaluations!';
  END IF;

  RAISE NOTICE '✅ [PASSED] T-10: Recruiter access enabled; confidential evaluation notes hidden from applicant.';
END $$;

-- ------------------------------------------------------------------------------
-- CLEANUP TEST FIXTURES & ROLLBACK
-- ------------------------------------------------------------------------------
SET LOCAL ROLE service_role;
DELETE FROM public.interview_evaluations WHERE evaluation_id = 'ffffffff-1111-1111-1111-111111111111';
DELETE FROM public.applications WHERE application_id = 'eeeeeeee-1111-1111-1111-111111111111';
DELETE FROM public.recruitment_drives WHERE drive_id = 'dddddddd-1111-1111-1111-111111111111';
DELETE FROM public.event_approvals WHERE event_id IN ('cccccccc-1111-1111-1111-111111111111', 'cccccccc-2222-2222-2222-222222222222', 'cccccccc-3333-3333-3333-333333333333');
DELETE FROM public.events WHERE event_id IN ('cccccccc-1111-1111-1111-111111111111', 'cccccccc-2222-2222-2222-222222222222', 'cccccccc-3333-3333-3333-333333333333');
DELETE FROM public.memberships WHERE club_id IN ('CLUB_ALPHA', 'CLUB_BETA');
DELETE FROM public.users WHERE user_id IN (
  'aaaaaaaa-1111-1111-1111-111111111111',
  'aaaaaaaa-2222-2222-2222-222222222222',
  'aaaaaaaa-3333-3333-3333-333333333333',
  'aaaaaaaa-4444-4444-4444-444444444444',
  'aaaaaaaa-5555-5555-5555-555555555555'
);
DELETE FROM public.clubs WHERE club_id IN ('CLUB_ALPHA', 'CLUB_BETA');
DELETE FROM public.colleges WHERE college_id = 'VIT_TEST';

RAISE NOTICE '🎉 ALL 10 P0 SECURITY TEST ASSERTIONS PASSED DETERMINISTICALLY.';

ROLLBACK;
