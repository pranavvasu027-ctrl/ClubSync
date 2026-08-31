-- =================================================================================
-- CLUBSYNC SUPABASE INITIALIZATION SCRIPT
-- Run this script in your Supabase SQL Editor to initialize the database tables
-- =================================================================================

-- 1. Club Tasks (Executive & President)
CREATE TABLE IF NOT EXISTS public.club_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    due_date DATE,
    assignee_initials TEXT,
    priority TEXT CHECK (priority IN ('low', 'mid', 'high')),
    status TEXT DEFAULT 'todo'
);

-- 2. Club Events (President, Faculty, Executive)
CREATE TABLE IF NOT EXISTS public.club_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    budget_allocated INTEGER DEFAULT 0,
    expected_users INTEGER DEFAULT 0,
    status TEXT DEFAULT 'submitted', -- 'submitted', 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Club Ledger (President & Faculty)
CREATE TABLE IF NOT EXISTS public.club_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('in', 'out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Club Applicants (President)
CREATE TABLE IF NOT EXISTS public.club_applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    stage TEXT DEFAULT 'applied' -- 'applied', 'screening', 'interview', 'selected'
);

-- 5. Club Announcements (Executive)
CREATE TABLE IF NOT EXISTS public.club_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    audience TEXT NOT NULL,
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivered INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    open_rate TEXT DEFAULT '0%',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Social Posts (Secretary)
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    post_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Club Profiles (Secretary Landing Page Builder JSON)
CREATE TABLE IF NOT EXISTS public.club_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_id TEXT NOT NULL DEFAULT 'default_college',
    page_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================================
-- DUMMY DATA SEEDING
-- =================================================================================

INSERT INTO public.club_tasks (title, due_date, assignee_initials, priority, status) VALUES
('Design hackathon poster', '2026-08-24', 'SK', 'high', 'todo'),
('Setup registration portal', '2026-08-25', 'AJ', 'high', 'todo'),
('Book auditorium', '2026-08-26', 'SD', 'mid', 'todo'),
('Review poster designs', '2026-08-20', 'AJ', 'high', 'in-progress'),
('Final poster approval', '2026-08-19', 'AJ', 'high', 'review');

INSERT INTO public.club_events (title, event_date, location, budget_allocated, expected_users, status) VALUES
('Pune TechFest Hackathon 2026', '2026-08-28', 'Auditorium', 150000, 300, 'submitted'),
('Code Sprint Weekend', '2026-09-05', 'Lab 401', 15000, 80, 'submitted'),
('Web3 Workshop Series', '2026-09-10', 'Seminar Hall', 50000, 120, 'pending'),
('AI/ML Bootcamp', '2026-09-20', 'Auditorium', 100000, 150, 'approved');

INSERT INTO public.club_ledger (txn_date, description, amount, type) VALUES
('2026-08-01', 'Annual College Grant', 350000, 'in'),
('2026-08-05', 'Sponsorship - TechCorp', 100000, 'in'),
('2026-08-10', 'Venue Booking (Hackathon)', 45000, 'out'),
('2026-08-12', 'Merchandise Advance', 25000, 'out');

INSERT INTO public.club_applicants (name, role, department, stage) VALUES
('Rahul Sharma', 'Frontend Dev', 'Computer Science', 'applied'),
('Ananya Patel', 'UI Designer', 'Design', 'screening'),
('Vikram Singh', 'Marketing Exec', 'BBA', 'interview'),
('Priya Desai', 'Backend Dev', 'Information Tech', 'selected');

INSERT INTO public.club_announcements (title, audience, sent_date, delivered, read_count, open_rate) VALUES
('Hackathon Registration Open!', 'All Members', '2026-08-22', 180, 142, '78.9%'),
('Team Meeting This Friday', 'Core Team', '2026-08-20', 42, 38, '90.5%');

INSERT INTO public.club_profiles (college_id, page_data) VALUES (
    'default_college',
    '{
      "name": "EDC — Entrepreneurship Development Cell",
      "sub": "Inspire. Innovate. Inform.",
      "about": "The Entrepreneurship Development Cell (EDC) aims to produce successful entrepreneurs...",
      "achievements": [
        "Smart India Hackathon Winners 2025",
        "Best Technical Club Award 2024"
      ],
      "coreTeam": [
        { "id": "1", "name": "Rohan Sharma", "role": "President", "avatar": "RS" },
        { "id": "2", "name": "Priya Sharma", "role": "Secretary", "avatar": "PS" }
      ],
      "socials": {
        "email": "edc@college.edu",
        "instagram": "instagram.com/edc",
        "linkedin": "linkedin.com/company/edc"
      }
    }'::jsonb
);

-- =================================================================================
-- RECRUITMENT CYCLE SYSTEM — NEW TABLES
-- Run after the initial setup above
-- =================================================================================

-- 8. Users (auth bridge — links Supabase auth to custom profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    user_type TEXT NOT NULL DEFAULT 'student',
    -- user_type values: student, recruiter, admin, president, executive, secretary, faculty, owner
    college_name TEXT,
    cgpa DECIMAL(3,2),
    branch TEXT,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

-- 9. Recruitment Cycles
CREATE TABLE IF NOT EXISTS public.recruitment_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    club_name TEXT NOT NULL,
    description TEXT,
    eligibility_cgpa DECIMAL(3,2) DEFAULT 0.00,
    eligibility_year TEXT DEFAULT 'any',  -- 'any', '1', '2', '3', '4'
    eligibility_branch TEXT DEFAULT 'any',
    application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'complete')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recruitment_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open cycles" ON public.recruitment_cycles FOR SELECT USING (true);
CREATE POLICY "Admins can insert cycles" ON public.recruitment_cycles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update cycles" ON public.recruitment_cycles FOR UPDATE USING (true);
CREATE POLICY "Admins can delete cycles" ON public.recruitment_cycles FOR DELETE USING (true);

-- 10. Recruitment Roles (roles within a cycle)
CREATE TABLE IF NOT EXISTS public.recruitment_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID REFERENCES public.recruitment_cycles(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    department TEXT NOT NULL,
    vacancies INTEGER DEFAULT 1,
    description TEXT
);

ALTER TABLE public.recruitment_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view roles" ON public.recruitment_roles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert roles" ON public.recruitment_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update roles" ON public.recruitment_roles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete roles" ON public.recruitment_roles FOR DELETE USING (true);

-- 11. Applications
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID REFERENCES public.recruitment_cycles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.recruitment_roles(id),
    student_id UUID REFERENCES public.users(id),
    student_name TEXT NOT NULL,
    student_email TEXT,
    cgpa DECIMAL(3,2),
    branch TEXT,
    year INTEGER,
    skills TEXT,
    portfolio_url TEXT,
    why_join TEXT,
    status TEXT DEFAULT 'applied' CHECK (status IN (
        'applied', 'shortlisted', 'interview_scheduled',
        'selected', 'waitlisted', 'rejected', 'onboarded'
    )),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

-- 12. Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES public.users(id),
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    meet_link TEXT,
    instructions TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view interviews" ON public.interviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert interviews" ON public.interviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update interviews" ON public.interviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete interviews" ON public.interviews FOR DELETE USING (true);

-- 13. Evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id),
    communication INTEGER CHECK (communication BETWEEN 1 AND 10),
    technical INTEGER CHECK (technical BETWEEN 1 AND 10),
    creativity INTEGER CHECK (creativity BETWEEN 1 AND 10),
    teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 10),
    commitment INTEGER CHECK (commitment BETWEEN 1 AND 10),
    overall INTEGER CHECK (overall BETWEEN 1 AND 10),
    remarks TEXT,
    verdict TEXT CHECK (verdict IN ('selected', 'waitlisted', 'rejected')),
    evaluated_by UUID REFERENCES public.users(id),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evaluations" ON public.evaluations FOR UPDATE USING (true);

-- 14. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (true);

-- 15. Club Members (onboarded students)
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    application_id UUID REFERENCES public.applications(id),
    club_name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view members" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert members" ON public.club_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update members" ON public.club_members FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete members" ON public.club_members FOR DELETE USING (true);

-- =================================================================================
-- RECRUITMENT SEED DATA
-- =================================================================================

-- Note: Seed users must match real Supabase auth UIDs in production.
-- Below are example placeholder UUIDs for local testing only.
-- Replace with real auth_user_ids after signing up via the app.

-- Sample Recruitment Cycle (open)
INSERT INTO public.recruitment_cycles (title, club_name, description, eligibility_cgpa, eligibility_year, eligibility_branch, application_deadline, status)
VALUES (
    'GedIT Technical Club — Recruitment 2026-27',
    'GedIT Technical Club',
    'Join the most active technical club on campus! We are looking for passionate students in development, design, and management.',
    6.50,
    'any',
    'any',
    NOW() + INTERVAL '30 days',
    'open'
);

-- Sample Roles for that cycle
INSERT INTO public.recruitment_roles (cycle_id, role_name, department, vacancies, description)
SELECT id, 'Frontend Developer', 'Engineering', 3, 'Build beautiful web interfaces using React and modern CSS.'
FROM public.recruitment_cycles WHERE title LIKE 'GedIT%' LIMIT 1;

INSERT INTO public.recruitment_roles (cycle_id, role_name, department, vacancies, description)
SELECT id, 'UI/UX Designer', 'Design', 2, 'Create stunning user experiences and design systems.'
FROM public.recruitment_cycles WHERE title LIKE 'GedIT%' LIMIT 1;

INSERT INTO public.recruitment_roles (cycle_id, role_name, department, vacancies, description)
SELECT id, 'Social Media Manager', 'Marketing', 2, 'Manage our Instagram, LinkedIn, and other social platforms.'
FROM public.recruitment_cycles WHERE title LIKE 'GedIT%' LIMIT 1;

INSERT INTO public.recruitment_roles (cycle_id, role_name, department, vacancies, description)
SELECT id, 'Backend Developer', 'Engineering', 2, 'Build scalable APIs and manage our cloud infrastructure.'
FROM public.recruitment_cycles WHERE title LIKE 'GedIT%' LIMIT 1;
