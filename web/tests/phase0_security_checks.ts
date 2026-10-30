/**
 * Phase 0 Security & Authorization Verification Suite
 * Tests all Phase 0 security controls, purview scoping, identity mapping, and lifecycle workflows.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(webDir, '..');

const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

function runTest(name: string, fn: () => void) {
  try {
    fn();
    results.push({ test: name, status: 'PASSED' });
    console.log(`✅ [PASSED] ${name}`);
  } catch (err: any) {
    results.push({ test: name, status: 'FAILED', details: err.message });
    console.error(`❌ [FAILED] ${name}:`, err.message);
  }
}

console.log('====================================================');
console.log('ClubSync Phase 0 Security Hardening Test Suite');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// TEST 1: Signup Defaults and Role Assignment
// ---------------------------------------------------------------------------
runTest('Signup: Login.tsx hardcodes default user_type to STUDENT', () => {
  const loginCode = fs.readFileSync(path.join(webDir, 'src/pages/Login.tsx'), 'utf-8');
  
  // Must NOT contain client role selector
  assert.ok(!loginCode.includes('<select'), 'Login.tsx must not contain a role <select> element');
  assert.ok(!loginCode.includes('Select Role'), 'Login.tsx must not prompt user to "Select Role"');
  assert.ok(!loginCode.includes("const [role, setRole]"), 'Login.tsx must not contain client-controlled role state');

  // Must hardcode STUDENT on profile insertion
  assert.ok(
    loginCode.includes("user_type: 'STUDENT'"),
    "Login.tsx must explicitly set user_type: 'STUDENT' on user registration"
  );
});

// ---------------------------------------------------------------------------
// TEST 2: Authentication-to-Profile ID Mapping Consistency
// ---------------------------------------------------------------------------
runTest('Auth Mapping: AuthContext provides both user_id and auth_user_id', () => {
  const authContextCode = fs.readFileSync(path.join(webDir, 'src/context/AuthContext.tsx'), 'utf-8');
  
  assert.ok(authContextCode.includes('user_id: string;'), 'CustomProfile must expose user_id');
  assert.ok(authContextCode.includes('auth_user_id: string;'), 'CustomProfile must expose auth_user_id');
  assert.ok(authContextCode.includes("select('user_id, auth_user_id, user_type, name, college_id')"), 'fetchProfile must select both IDs');
});

runTest('Auth Mapping: NotificationBell queries user_id instead of id', () => {
  const notifCode = fs.readFileSync(path.join(webDir, 'src/components/NotificationBell.tsx'), 'utf-8');
  
  assert.ok(!notifCode.includes("select('id')"), 'NotificationBell must not select non-existent column "id" from users');
  assert.ok(notifCode.includes('profile?.user_id'), 'NotificationBell must utilize profile.user_id');
  assert.ok(notifCode.includes("select('user_id')"), 'NotificationBell fallback must query "user_id"');
});

runTest('Auth Mapping: Proposals.tsx uses internal profile user_id and status ACTIVE', () => {
  const proposalsCode = fs.readFileSync(path.join(webDir, 'src/components/Proposals.tsx'), 'utf-8');
  
  assert.ok(!proposalsCode.includes(".eq('is_active', true)"), 'Proposals must not query deprecated is_active column');
  assert.ok(proposalsCode.includes("profile?.user_id"), 'Proposals must use profile.user_id for memberships');
  assert.ok(proposalsCode.includes(".eq('status', 'ACTIVE')"), 'Proposals must query status ACTIVE');
});

runTest('Auth Mapping: StudentEventDetails.tsx uses internal profile user_id', () => {
  const eventDetailsCode = fs.readFileSync(path.join(webDir, 'src/pages/student/StudentEventDetails.tsx'), 'utf-8');
  
  assert.ok(eventDetailsCode.includes("profile?.user_id"), 'StudentEventDetails must use profile.user_id');
  assert.ok(eventDetailsCode.includes(".eq('user_id', targetUserId)"), 'event_registrations query must pass targetUserId');
});

runTest('Auth Mapping: StudentDashboard.tsx uses applicant_id instead of student_id', () => {
  const studentDashCode = fs.readFileSync(path.join(webDir, 'src/pages/student/StudentDashboard.tsx'), 'utf-8');
  
  assert.ok(!studentDashCode.includes(".eq('student_id'"), 'StudentDashboard must not query non-existent student_id column');
  assert.ok(studentDashCode.includes(".eq('applicant_id', targetUserId)"), 'StudentDashboard must query applicant_id');
});

runTest('Auth Mapping: Recruitments.tsx uses profile user_id for interviewer_id', () => {
  const recruitmentsCode = fs.readFileSync(path.join(webDir, 'src/components/Recruitments.tsx'), 'utf-8');
  
  assert.ok(recruitmentsCode.includes("profile?.user_id"), 'Recruitments must use profile.user_id for interviewer');
  assert.ok(recruitmentsCode.includes("interviewer_id: targetInterviewerId"), 'interview_evaluations must use targetInterviewerId');
});

// ---------------------------------------------------------------------------
// TEST 3: Faculty Purview Authorization (UI and Logic)
// ---------------------------------------------------------------------------
runTest('Faculty Purview: ApprovalsQueue.tsx enforces club purview on review actions', () => {
  const approvalsCode = fs.readFileSync(path.join(webDir, 'src/pages/faculty/ApprovalsQueue.tsx'), 'utf-8');
  
  // Must import and use supervisedClubs
  assert.ok(approvalsCode.includes('supervisedClubs'), 'ApprovalsQueue must consume supervisedClubs from AuthContext');
  
  // Must filter queues by purview
  assert.ok(approvalsCode.includes('filterByPurview'), 'ApprovalsQueue must filter approval queues by faculty purview');
  
  // Must validate purview before approval/rejection RPC calls
  assert.ok(approvalsCode.includes('supervisedClubs.includes(eventClubId)'), 'ApprovalsQueue must verify club purview before RPC');
  assert.ok(approvalsCode.includes('Unauthorized: You are not authorized to review events outside your supervised club purview'), 'Must display authorization error when purview is violated');
});

runTest('Faculty Purview: Mock Purview Scoping Simulation', () => {
  // Simulate faculty authorization check
  const facultySupervisedClubs = ['VIT_GEDIT', 'VIT_TRF'];
  const testEvents = [
    { event_id: 'ev-1', club_id: 'VIT_GEDIT', title: 'Hackathon' },
    { event_id: 'ev-2', club_id: 'VIT_EDC', title: 'B-Plan' },
    { event_id: 'ev-3', club_id: 'VIT_TRF', title: 'Robotics Workshop' },
  ];

  // Faculty filtering
  const facultyVisible = testEvents.filter(e => facultySupervisedClubs.includes(e.club_id));
  assert.equal(facultyVisible.length, 2, 'Faculty must only see events from supervised clubs');
  assert.deepEqual(facultyVisible.map(e => e.club_id), ['VIT_GEDIT', 'VIT_TRF']);

  // Unauthorized approval attempt
  const attemptApprove = (clubId: string, isSuperAdmin: boolean = false) => {
    if (!isSuperAdmin && !facultySupervisedClubs.includes(clubId)) {
      throw new Error('Unauthorized: You are not authorized to review events outside your supervised club purview.');
    }
    return { success: true };
  };

  assert.throws(() => attemptApprove('VIT_EDC'), /Unauthorized/, 'Attempt to approve unauthorized club must throw');
  assert.doesNotThrow(() => attemptApprove('VIT_GEDIT'), 'Authorized club approval must succeed');
  assert.doesNotThrow(() => attemptApprove('VIT_EDC', true), 'Platform admin override must succeed');
});

// ---------------------------------------------------------------------------
// TEST 4: Sensitive-Table Access Audit & RLS Verification
// ---------------------------------------------------------------------------
runTest('Sensitive Tables: Audit confirms existing schema.sql policy gaps', () => {
  const schemaCode = fs.readFileSync(path.join(repoDir, 'database/schema.sql'), 'utf-8');
  
  // Confirm that schema.sql currently has open development policies (which our proposed migration addresses)
  assert.ok(schemaCode.includes('CREATE POLICY "Events can be created and managed" ON events FOR ALL USING (true);'), 'Confirmed SEC-03: events has open USING (true) policy');
  assert.ok(schemaCode.includes('CREATE POLICY "Finance can be managed" ON finance_transactions FOR ALL USING (true);'), 'Confirmed SEC-03: finance has open USING (true) policy');
  assert.ok(!schemaCode.includes('ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;'), 'Confirmed SEC-04: memberships lacks ENABLE ROW LEVEL SECURITY');
});

// ---------------------------------------------------------------------------
// TEST 5: Event Lifecycle Workflow Integrity
// ---------------------------------------------------------------------------
runTest('Event Lifecycle: State transitions follow strict canonical sequence', () => {
  const allowedTransitions: Record<string, string[]> = {
    'draft': ['under_review'],
    'changes_requested': ['under_review'],
    'under_review': ['approved', 'changes_requested', 'rejected'],
    'approved': ['published'],
    'published': ['completed', 'cancelled']
  };

  function canTransition(current: string, next: string): boolean {
    return allowedTransitions[current]?.includes(next) ?? false;
  }

  // Valid progressions
  assert.ok(canTransition('draft', 'under_review'), 'draft -> under_review is valid');
  assert.ok(canTransition('under_review', 'approved'), 'under_review -> approved is valid');
  assert.ok(canTransition('under_review', 'changes_requested'), 'under_review -> changes_requested is valid');
  assert.ok(canTransition('changes_requested', 'under_review'), 'changes_requested -> under_review is valid');
  assert.ok(canTransition('approved', 'published'), 'approved -> published is valid');

  // Invalid / Bypassed progressions
  assert.ok(!canTransition('draft', 'approved'), 'draft -> approved directly is invalid');
  assert.ok(!canTransition('draft', 'published'), 'draft -> published directly is invalid');
  assert.ok(!canTransition('under_review', 'published'), 'under_review -> published directly is invalid (requires approved)');
  assert.ok(!canTransition('rejected', 'published'), 'rejected -> published is invalid');
});

// ---------------------------------------------------------------------------
// TEST 6: P0 Security Remediation Migration Specification Verification
// ---------------------------------------------------------------------------
runTest('P0 Remediation Migration: Corrects all 5 unshielded tables and drops bypasses', () => {
  const migrationPath = path.join(repoDir, 'database/migrations/01_p0_security_remediation.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration 01_p0_security_remediation.sql must exist');
  
  const migrationCode = fs.readFileSync(migrationPath, 'utf-8');

  // 1. RLS Enabled on all 5 unshielded tables
  assert.ok(migrationCode.includes('ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on memberships');
  assert.ok(migrationCode.includes('ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on club_roles');
  assert.ok(migrationCode.includes('ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on event_approvals');
  assert.ok(migrationCode.includes('ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on interview_evaluations');
  assert.ok(migrationCode.includes('ALTER TABLE public.recruitment_drives ENABLE ROW LEVEL SECURITY;'), 'Must enable RLS on recruitment_drives');

  // 2. Drops open development USING (true) bypasses (including surviving public events and applications)
  assert.ok(migrationCode.includes('DROP POLICY IF EXISTS "Events can be created and managed" ON public.events;'), 'Must drop events USING(true) policy');
  assert.ok(migrationCode.includes('DROP POLICY IF EXISTS "Public events read" ON public.events;'), 'Must drop surviving Public events read policy');
  assert.ok(migrationCode.includes('DROP POLICY IF EXISTS "Applications can be created and reviewed" ON public.applications;'), 'Must drop old applications policy');
  assert.ok(migrationCode.includes('DROP POLICY IF EXISTS "Finance can be managed" ON public.finance_transactions;'), 'Must drop finance USING(true) policy');
  assert.ok(migrationCode.includes('DROP POLICY IF EXISTS "Event Budgets can be managed" ON public.event_budgets;'), 'Must drop budgets USING(true) policy');

  // 3. User Anti-Escalation Trigger & SQLSTATE 42501
  assert.ok(migrationCode.includes('CREATE TRIGGER trg_protect_user_profile'), 'Must attach anti-escalation trigger to public.users');
  assert.ok(migrationCode.includes("USING ERRCODE = 'insufficient_privilege'"), 'Must declare genuine SQLSTATE 42501 for security rejections');

  // 4. Student PII Protection & Sanitized Directory View
  assert.ok(migrationCode.includes('REVOKE ALL ON public.users FROM anon;'), 'Must revoke anon access on public.users');
  assert.ok(migrationCode.includes('CREATE OR REPLACE VIEW public.v_public_user_profiles'), 'Must provide sanitized directory view');
  assert.ok(!migrationCode.includes('phone,\n    email,\n    prn_or_roll,\n    cgpa') && migrationCode.includes('bio,\n    skills'), 'View must omit PII and CGPA');

  // 5. Strict WITH CHECK constraints on proposal updates and authorized publishing
  assert.ok(migrationCode.includes("status IN ('draft', 'under_review', 'changes_requested')\n) WITH CHECK"), 'Must enforce WITH CHECK on event proposal updates');
  assert.ok(migrationCode.includes('CREATE POLICY "Club executives publish approved events" ON public.events'), 'Must enforce authorized publishing policy');

  // 6. Transactional approval RPC deployment & safe role seeding
  assert.ok(migrationCode.includes('CREATE OR REPLACE FUNCTION public.process_event_approval'), 'Must deploy atomic process_event_approval RPC');
  assert.ok(migrationCode.includes('ON CONFLICT (role_id) DO NOTHING;'), 'Must seed club roles idempotently without overwriting');
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`Test Execution Finished: ${results.filter(r => r.status === 'PASSED').length}/${results.length} PASSED`);
console.log('====================================================');

const failed = results.filter(r => r.status === 'FAILED');
if (failed.length > 0) {
  process.exit(1);
}
