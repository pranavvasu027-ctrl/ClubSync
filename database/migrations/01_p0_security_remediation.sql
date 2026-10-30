-- ==============================================================================
-- CLUBSYNC DATABASE MIGRATION
-- Migration: 01_p0_security_remediation.sql
-- Workstream: Database (Chat 3)
-- Version: 2.0 (Phase 2D Corrected Baseline)
-- Target: PostgreSQL / Supabase
-- Status: STAGED FOR LOCAL/STAGING EXECUTION — NOT APPLIED TO PRODUCTION
-- Description: Comprehensive remediation for all P0 security vulnerabilities:
--              1. Drops all surviving permissive bypass policies (including "Public events read").
--              2. Deploys atomic process_event_approval stored procedure.
--              3. Enforces strict state-machine WITH CHECK on events and authorized publishing.
--              4. Restricts public.users direct SELECT, protecting student PII.
--              5. Provides sanitized v_public_user_profiles view for peer discovery.
--              6. Deploys anti-escalation trigger with SQLSTATE 42501 on users.
--              7. Deploys SECURITY DEFINER identity and club purview helpers.
--              8. Unblocks recruiter access via club-scoped applications policy.
--              9. Idempotent role seeds without overwriting existing configurations.
--              10. Locks event_approvals, finance, and interview evaluations.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- PRECONDITION CHECKS
-- Verify that required canonical tables and columns exist before proceeding.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: public.users table missing from schema.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'role_id') THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: memberships.role_id column missing from schema.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'status') THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: memberships.status column missing from schema.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: public.applications table missing from schema.';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. SEED DEFAULT CLUB ROLES (Idempotent: DO NOTHING on conflict)
-- ------------------------------------------------------------------------------
INSERT INTO public.club_roles (role_id, role_name, hierarchy_rank, is_core_position) VALUES
('Faculty_Advisor', 'Faculty Advisor / Mentor', 1, TRUE),
('President', 'Club President', 2, TRUE),
('Vice_President', 'Vice President', 3, TRUE),
('Secretary', 'General Secretary', 4, TRUE),
('Executive', 'Executive Department Head', 5, TRUE),
('Treasurer', 'Treasurer / Finance Lead', 6, TRUE),
('Lead', 'Technical / Vertical Lead', 7, FALSE),
('Member', 'General Member', 10, FALSE),
('Volunteer', 'Event Volunteer', 12, FALSE)
ON CONFLICT (role_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. DEPLOY IDENTITY & PERMISSION HELPER FUNCTIONS
-- Fixed search_path = public, pg_temp; STABLE; restricted execution grants.
-- ------------------------------------------------------------------------------

-- Helper: Map Supabase Auth UID to internal public.users user_id
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT user_id 
  FROM public.users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: Check if current user has a platform-level account type
CREATE OR REPLACE FUNCTION public.has_platform_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE auth_user_id = auth.uid()
      AND user_type = ANY(allowed_roles)
      AND is_archived = FALSE
  );
$$;

-- Helper: Check if current user has an active club-specific role
CREATE OR REPLACE FUNCTION public.has_club_role(target_club_id VARCHAR, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.status = 'ACTIVE'
      AND m.role_id = ANY(allowed_roles)
  );
$$;

-- Helper: Check if current user is an active member of target club
CREATE OR REPLACE FUNCTION public.is_club_member(target_club_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.status = 'ACTIVE'
  );
$$;

-- Helper: Check if current user is the faculty mentor for target club
CREATE OR REPLACE FUNCTION public.is_faculty_mentor_for_club(target_club_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.status = 'ACTIVE'
      AND (
        m.role_id IN ('Faculty_Advisor', 'Faculty_Mentor', 'FACULTY_MENTOR')
        OR u.user_type = 'FACULTY_MENTOR'
      )
  );
$$;

-- Restrict execution permissions on helper functions
REVOKE ALL ON FUNCTION public.get_my_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_platform_role(TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_club_role(VARCHAR, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_club_member(VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_faculty_mentor_for_club(VARCHAR) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_platform_role(TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_club_role(VARCHAR, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_club_member(VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_faculty_mentor_for_club(VARCHAR) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. TRANSACTIONAL EVENT APPROVAL RPC
-- Provides atomic, secure approval workflow without permitting direct table writes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_event_approval(
  p_event_id UUID, 
  p_level VARCHAR, 
  p_decision VARCHAR, 
  p_remarks TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_club_id VARCHAR;
  v_current_status VARCHAR;
  v_caller_user_id UUID;
BEGIN
  -- Authenticate caller
  v_caller_user_id := public.get_my_user_id();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated: Valid profile required.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate event existence and current status
  SELECT club_id, status INTO v_club_id, v_current_status
  FROM public.events 
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_current_status != 'under_review' THEN
    RAISE EXCEPTION 'Invalid State: Event must be in under_review status for approvals (current: %)', v_current_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Validate authorization according to approver level
  IF p_level = 'FACULTY_MENTOR' THEN
    IF NOT (public.is_faculty_mentor_for_club(v_club_id) OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])) THEN
      RAISE EXCEPTION 'Unauthorized: Only the assigned faculty mentor can approve at FACULTY_MENTOR stage.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF p_level IN ('RESOURCE_INCHARGE', 'VERTICAL_COORDINATOR', 'DEAN_ADMIN') THEN
    IF NOT public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN', p_level]) THEN
      RAISE EXCEPTION 'Unauthorized: Caller lacks administrative authority for % approval stage.', p_level
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid approval level: %', p_level USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Record the approval decision (upsert on event_id + approver_level)
  INSERT INTO public.event_approvals (
    event_id, approver_id, approver_level, decision, remarks, decision_timestamp
  ) VALUES (
    p_event_id, v_caller_user_id, p_level, p_decision, p_remarks, CURRENT_TIMESTAMP
  )
  ON CONFLICT (event_id, approver_level) 
  DO UPDATE SET 
    decision = EXCLUDED.decision,
    remarks = EXCLUDED.remarks,
    approver_id = EXCLUDED.approver_id,
    decision_timestamp = CURRENT_TIMESTAMP;

  -- State machine transition based on decision
  IF p_decision = 'REJECTED' THEN
    UPDATE public.events SET status = 'rejected' WHERE event_id = p_event_id;
  ELSIF p_decision = 'CHANGES_REQUESTED' THEN
    UPDATE public.events SET status = 'changes_requested' WHERE event_id = p_event_id;
  ELSIF p_decision IN ('APPROVED', 'CONDITIONAL_APPROVAL') THEN
    -- In single-tier (MVP) or final approval stage, move status to 'approved'
    -- Decision 2.3.1: Approval sets status = 'approved'; does NOT auto-publish.
    UPDATE public.events SET status = 'approved' WHERE event_id = p_event_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'event_id', p_event_id,
    'decision', p_decision,
    'new_status', (SELECT status FROM public.events WHERE event_id = p_event_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_event_approval(UUID, VARCHAR, VARCHAR, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_event_approval(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. USER PROFILE INTEGRITY & PRIVILEGE ESCALATION SHIELD (TRIGGER)
-- Emits genuine SQLSTATE 42501 (insufficient_privilege) on unauthorized changes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_enforce_user_profile_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Service role and super administrators can update all fields
  IF auth.role() = 'service_role' OR public.has_platform_role(ARRAY['SUPER_ADMIN']) THEN
    RETURN NEW;
  END IF;

  -- Block unauthorized modification of protected columns by account holders
  IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    RAISE EXCEPTION 'Privilege Escalation Blocked: user_type is immutable by account holder'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.cgpa IS DISTINCT FROM OLD.cgpa THEN
    RAISE EXCEPTION 'Integrity Violation: cgpa cannot be modified by account holder'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.prn_or_roll IS DISTINCT FROM OLD.prn_or_roll THEN
    RAISE EXCEPTION 'Integrity Violation: prn_or_roll cannot be modified by account holder'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'Integrity Violation: college_id cannot be modified by account holder'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
    RAISE EXCEPTION 'Integrity Violation: auth_user_id is immutable'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.is_archived IS DISTINCT FROM OLD.is_archived THEN
    RAISE EXCEPTION 'Integrity Violation: is_archived cannot be modified by account holder'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile ON public.users;
CREATE TRIGGER trg_protect_user_profile
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trg_enforce_user_profile_integrity();

-- ------------------------------------------------------------------------------
-- 5. ENABLE RLS ON ALL SENSITIVE DOMAIN TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. DROP PERMISSIVE AND CONFLICTING POLICIES
-- Complete purge of legacy and bypass policies.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public users read" ON public.users;
DROP POLICY IF EXISTS "Users can insert/update own profile" ON public.users;
DROP POLICY IF EXISTS "Public clubs read" ON public.clubs;
DROP POLICY IF EXISTS "Public events read" ON public.events; -- Critical fix for GAP-01
DROP POLICY IF EXISTS "Events can be created and managed" ON public.events;
DROP POLICY IF EXISTS "Finance can be managed" ON public.finance_transactions;
DROP POLICY IF EXISTS "Event Budgets can be managed" ON public.event_budgets;
DROP POLICY IF EXISTS "Event Tasks can be managed" ON public.event_tasks;
DROP POLICY IF EXISTS "Event Teams can be managed" ON public.event_teams;
DROP POLICY IF EXISTS "Event Feedback can be managed" ON public.event_feedback;
DROP POLICY IF EXISTS "Competitions can be created and managed" ON public.competitions;
DROP POLICY IF EXISTS "Team members can be managed" ON public.team_members;
DROP POLICY IF EXISTS "Applications can be created and reviewed" ON public.applications; -- Critical fix for GAP-02

-- ------------------------------------------------------------------------------
-- 7. DEPLOY LEAST-PRIVILEGE RLS POLICIES
-- ------------------------------------------------------------------------------

-- [TABLE: public.users]
REVOKE ALL ON public.users FROM anon;

CREATE POLICY "Users view own full profile" ON public.users
FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Platform admins view all profiles" ON public.users
FOR SELECT USING (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']));

CREATE POLICY "Faculty mentors and reviewers view user profiles" ON public.users
FOR SELECT USING (public.has_platform_role(ARRAY['FACULTY_MENTOR']));

CREATE POLICY "Authorized recruiters view applicant profiles" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.applicant_id = users.user_id
      AND (
        public.has_club_role(a.club_id, ARRAY['President', 'Executive', 'Faculty_Advisor'])
        OR public.has_platform_role(ARRAY['SUPER_ADMIN'])
      )
  )
);

CREATE POLICY "Users insert own profile on signup" ON public.users
FOR INSERT WITH CHECK (
  auth_user_id = auth.uid() 
  AND user_type = 'STUDENT'
  AND is_archived = FALSE
);

CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- [TABLE: public.clubs]
-- Authenticated discovery only (Decision 2.2.1)
CREATE POLICY "Authenticated users view clubs" ON public.clubs
FOR SELECT USING (auth.role() = 'authenticated');

-- [TABLE: public.club_roles]
CREATE POLICY "Authenticated users read club roles" ON public.club_roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage club roles" ON public.club_roles
FOR ALL USING (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']));

-- [TABLE: public.memberships]
CREATE POLICY "Authenticated users read active club rosters" ON public.memberships
FOR SELECT USING (auth.role() = 'authenticated' AND status = 'ACTIVE');

CREATE POLICY "Users read own memberships" ON public.memberships
FOR SELECT USING (user_id = public.get_my_user_id());

CREATE POLICY "Club leads view all club memberships" ON public.memberships
FOR SELECT USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Club leaders insert club memberships" ON public.memberships
FOR INSERT WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Club leaders update club memberships" ON public.memberships
FOR UPDATE USING (
  public.has_club_role(club_id, ARRAY['President', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Admins delete memberships" ON public.memberships
FOR DELETE USING (public.has_platform_role(ARRAY['SUPER_ADMIN']));

-- [TABLE: public.events]
CREATE POLICY "Authenticated users view published events" ON public.events
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND status IN ('published', 'live', 'past', 'completed', 'upcoming')
);

CREATE POLICY "Club members view all club events" ON public.events
FOR SELECT USING (
  public.is_club_member(club_id)
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Faculty mentors view supervised club events" ON public.events
FOR SELECT USING (public.is_faculty_mentor_for_club(club_id));

CREATE POLICY "Club executives insert proposals" ON public.events
FOR INSERT WITH CHECK (
  (public.has_club_role(club_id, ARRAY['President', 'Executive']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  AND status IN ('draft', 'under_review')
);

-- Club executives can only update proposal details while unapproved
CREATE POLICY "Club executives update draft proposals" ON public.events
FOR UPDATE USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  AND status IN ('draft', 'under_review', 'changes_requested')
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  AND status IN ('draft', 'under_review', 'changes_requested')
);

-- Club executives can publish events ONLY when status is already 'approved' (Decision 2.3.1)
CREATE POLICY "Club executives publish approved events" ON public.events
FOR UPDATE USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  AND status = 'approved'
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Executive']) 
  AND status = 'published'
);

CREATE POLICY "Admins update all events" ON public.events
FOR UPDATE USING (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']))
WITH CHECK (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']));

-- [TABLE: public.event_approvals]
-- Direct client mutations locked out; must invoke process_event_approval RPC.
CREATE POLICY "Authorized members view event approvals" ON public.event_approvals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_approvals.event_id 
      AND (
        public.is_club_member(e.club_id)
        OR public.is_faculty_mentor_for_club(e.club_id)
        OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
      )
  )
);

CREATE POLICY "Block direct client insert on approvals" ON public.event_approvals
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Block direct client update on approvals" ON public.event_approvals
FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Block direct delete on approvals" ON public.event_approvals
FOR DELETE USING (auth.role() = 'service_role');

-- [TABLE: public.applications]
CREATE POLICY "Applicants view and manage own applications" ON public.applications
FOR ALL USING (
  applicant_id = public.get_my_user_id()
) WITH CHECK (
  applicant_id = public.get_my_user_id()
);

CREATE POLICY "Club leaders view club applications" ON public.applications
FOR SELECT USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Club leaders update club application status" ON public.applications
FOR UPDATE USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Executive', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

-- [TABLE: public.finance_transactions]
REVOKE ALL ON public.finance_transactions FROM anon;

CREATE POLICY "Authorized club leaders view finance ledger" ON public.finance_transactions
FOR SELECT USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive', 'Treasurer', 'Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Club leaders insert pending finance transactions" ON public.finance_transactions
FOR INSERT WITH CHECK (
  (public.has_club_role(club_id, ARRAY['President', 'Executive', 'Treasurer']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  AND added_by_user_id = public.get_my_user_id()
  AND status = 'PENDING'
);

CREATE POLICY "Faculty and Admins approve finance transactions" ON public.finance_transactions
FOR UPDATE USING (
  public.has_club_role(club_id, ARRAY['Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['Faculty_Advisor'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

-- [TABLE: public.event_budgets]
REVOKE ALL ON public.event_budgets FROM anon;

CREATE POLICY "Club members view event budgets" ON public.event_budgets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.is_club_member(e.club_id) OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']))
  )
);

CREATE POLICY "Club leaders manage unapproved event budgets" ON public.event_budgets
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Executive', 'Treasurer']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
);

CREATE POLICY "Club leaders update unapproved budget items" ON public.event_budgets
FOR UPDATE USING (
  is_approved = FALSE
  AND EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Executive', 'Treasurer']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
) WITH CHECK (
  is_approved = FALSE
  AND EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Executive', 'Treasurer']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
);

CREATE POLICY "Club leaders delete unapproved budget items" ON public.event_budgets
FOR DELETE USING (
  is_approved = FALSE
  AND EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.event_id = event_budgets.event_id 
      AND (public.has_club_role(e.club_id, ARRAY['President', 'Executive', 'Treasurer']) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
);

-- [TABLE: public.recruitment_drives & interview_evaluations]
CREATE POLICY "Authenticated users view open recruitment drives" ON public.recruitment_drives
FOR SELECT USING (auth.role() = 'authenticated' AND status = 'OPEN');

CREATE POLICY "Club members view club recruitment drives" ON public.recruitment_drives
FOR SELECT USING (
  public.is_club_member(club_id)
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

CREATE POLICY "Club leaders manage recruitment drives" ON public.recruitment_drives
FOR ALL USING (
  public.has_club_role(club_id, ARRAY['President', 'Executive'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
) WITH CHECK (
  public.has_club_role(club_id, ARRAY['President', 'Executive'])
  OR public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN'])
);

-- Interview evaluations are strictly private to interviewers and club leads; applicants CANNOT read.
REVOKE ALL ON public.interview_evaluations FROM anon;

CREATE POLICY "Interviewers view evaluations" ON public.interview_evaluations
FOR SELECT USING (
  interviewer_id = public.get_my_user_id()
  OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.application_id = interview_evaluations.application_id
      AND (
        public.has_club_role(a.club_id, ARRAY['President', 'Executive', 'Faculty_Advisor']) 
        OR public.has_platform_role(ARRAY['SUPER_ADMIN'])
      )
  )
);

CREATE POLICY "Interviewers insert evaluations" ON public.interview_evaluations
FOR INSERT WITH CHECK (
  interviewer_id = public.get_my_user_id()
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.application_id = interview_evaluations.application_id
      AND (public.is_club_member(a.club_id) OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
);

-- [TABLE: public.competitions & team_members]
CREATE POLICY "Authenticated users view competitions" ON public.competitions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage competitions" ON public.competitions
FOR ALL USING (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']))
WITH CHECK (public.has_platform_role(ARRAY['SUPER_ADMIN', 'DEAN_ADMIN']));

CREATE POLICY "Team members view team roster" ON public.team_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.team_id = team_members.team_id 
      AND (
        t.lead_user_id = public.get_my_user_id() 
        OR team_members.user_id = public.get_my_user_id() 
        OR public.has_platform_role(ARRAY['SUPER_ADMIN'])
      )
  )
);

CREATE POLICY "Team leads manage team members" ON public.team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.team_id = team_members.team_id 
      AND (t.lead_user_id = public.get_my_user_id() OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.team_id = team_members.team_id 
      AND (t.lead_user_id = public.get_my_user_id() OR public.has_platform_role(ARRAY['SUPER_ADMIN']))
  )
);

-- ------------------------------------------------------------------------------
-- 8. SANITIZED PUBLIC PROFILES VIEW (Protects Student PII)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_public_user_profiles 
WITH (security_invoker = false) AS
SELECT 
    user_id,
    name,
    college_id,
    college_name,
    year_of_study,
    branch,
    bio,
    skills,
    interests,
    github_handle,
    linkedin_handle,
    avatar_url
FROM public.users
WHERE is_archived = FALSE;

REVOKE ALL ON public.v_public_user_profiles FROM PUBLIC;
GRANT SELECT ON public.v_public_user_profiles TO authenticated;

-- ------------------------------------------------------------------------------
-- POSTCONDITION VALIDATION
-- Ensure all critical tables have RLS enabled before committing.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_missing_rls TEXT;
BEGIN
  SELECT string_agg(relname, ', ') INTO v_missing_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('users', 'memberships', 'club_roles', 'event_approvals', 'interview_evaluations', 'recruitment_drives', 'events', 'finance_transactions', 'applications')
    AND c.relrowsecurity = FALSE;

  IF v_missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'POSTCONDITION FAILED: Tables lack RLS: %', v_missing_rls;
  END IF;
END $$;

COMMIT;
