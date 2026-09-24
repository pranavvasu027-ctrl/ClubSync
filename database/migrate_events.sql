-- =================================================================================
-- CLUBSYNC EVENT PROPOSAL WORKFLOW — MIGRATION SCRIPT (FINAL)
-- =================================================================================
-- Your live DB has:
--   users.user_id (PK), clubs.club_id (PK), colleges.college_id (PK)
-- =================================================================================

-- Clean up any partial tables from previous failed attempts
DROP TABLE IF EXISTS public.event_budgets CASCADE;
DROP TABLE IF EXISTS public.event_approvals CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- 1. EVENTS table
CREATE TABLE public.events (
    event_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id VARCHAR(50) REFERENCES public.clubs(club_id),
    club_name VARCHAR(150),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'Workshop',
    scope VARCHAR(30) DEFAULT 'INTRA_COLLEGE',
    target_audience VARCHAR(100),
    expected_count INT DEFAULT 100,
    venue_name VARCHAR(150),
    event_date VARCHAR(50) NOT NULL DEFAULT '',
    event_time VARCHAR(50) DEFAULT '',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    ticket_price NUMERIC(10, 2) DEFAULT 0.00,
    banner_image_url TEXT,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'published', 'live', 'past', 'cancelled')),
    objectives TEXT,
    expected_outcomes TEXT,
    guest_details JSONB,
    resource_requirements TEXT[],
    compliance_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EVENT_APPROVALS table
CREATE TABLE public.event_approvals (
    approval_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.users(user_id),
    approver_level VARCHAR(50) NOT NULL DEFAULT 'FACULTY_MENTOR' CHECK (approver_level IN ('FACULTY_MENTOR', 'RESOURCE_INCHARGE', 'VERTICAL_COORDINATOR', 'CAMPUS_MANAGER', 'DEAN_ADMIN')),
    decision VARCHAR(30) DEFAULT 'PENDING' CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL')),
    remarks TEXT,
    decision_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, approver_level)
);

-- 3. EVENT_BUDGETS table
CREATE TABLE public.event_budgets (
    budget_item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    description TEXT NOT NULL DEFAULT '',
    estimated_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_club ON public.events(club_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_approvals_event ON public.event_approvals(event_id);
CREATE INDEX idx_approvals_decision ON public.event_approvals(decision);
