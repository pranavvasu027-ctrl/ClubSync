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
