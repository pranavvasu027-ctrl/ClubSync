-- =================================================================================
-- CLUBSYNC SECURITY POLICIES (Row Level Security)
-- Run this in your Supabase SQL Editor to lock down the database against hackers.
-- =================================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create a secure helper function to get the current user's role
-- (SECURITY DEFINER means it bypasses RLS to check the role internally)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT user_type FROM public.users WHERE user_id = auth.uid();
$$;


-- =================================================================================
-- POLICIES: PUBLIC DATA (Visible to anyone, even logged out students)
-- =================================================================================

-- Anyone can view the club landing page configuration
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.club_profiles FOR SELECT USING (true);

-- Anyone can view approved events
CREATE POLICY "Approved events are viewable by everyone." 
ON public.club_events FOR SELECT USING (status = 'approved');


-- =================================================================================
-- POLICIES: AUTHENTICATED USERS (Must be logged in)
-- =================================================================================

-- Logged in users can view all events, tasks, and users
CREATE POLICY "Logged in users can view users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Logged in users can view tasks" ON public.club_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Logged in users can view events" ON public.club_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Logged in users can view announcements" ON public.club_announcements FOR SELECT USING (auth.role() = 'authenticated');


-- =================================================================================
-- POLICIES: ROLE-BASED WRITE ACCESS (The core security)
-- =================================================================================

-- SECRETARY: Can edit the public club profile and social posts
CREATE POLICY "Secretaries can update club profiles" 
ON public.club_profiles FOR UPDATE 
USING (public.get_my_role() IN ('secretary', 'owner'));

CREATE POLICY "Secretaries manage social posts" 
ON public.social_posts FOR ALL 
USING (public.get_my_role() IN ('secretary', 'owner'));

-- EXECUTIVE: Can manage tasks and send announcements
CREATE POLICY "Executives can manage tasks" 
ON public.club_tasks FOR ALL 
USING (public.get_my_role() IN ('executive', 'president', 'owner'));

CREATE POLICY "Executives can send announcements" 
ON public.club_announcements FOR ALL 
USING (public.get_my_role() IN ('executive', 'owner'));

-- PRESIDENT: Can propose events and manage applicants
CREATE POLICY "Presidents can insert events" 
ON public.club_events FOR INSERT 
WITH CHECK (public.get_my_role() IN ('president', 'owner'));

CREATE POLICY "Presidents can update events" 
ON public.club_events FOR UPDATE 
USING (public.get_my_role() IN ('president', 'executive', 'owner'));

CREATE POLICY "Presidents manage applicants" 
ON public.club_applicants FOR ALL 
USING (public.get_my_role() IN ('president', 'owner'));

-- FACULTY: Can approve events and view the ledger
CREATE POLICY "Faculty can update event status (Approve/Reject)" 
ON public.club_events FOR UPDATE 
USING (public.get_my_role() IN ('faculty', 'owner'));

CREATE POLICY "Faculty and Presidents can view the ledger" 
ON public.club_ledger FOR SELECT 
USING (public.get_my_role() IN ('faculty', 'president', 'owner'));

-- LEDGER SECURITY: Only owners can delete or alter past financial records
CREATE POLICY "Only Owners can modify past ledger entries" 
ON public.club_ledger FOR UPDATE 
USING (public.get_my_role() = 'owner');

CREATE POLICY "Only Owners can delete ledger entries" 
ON public.club_ledger FOR DELETE 
USING (public.get_my_role() = 'owner');

CREATE POLICY "Presidents can insert new ledger entries" 
ON public.club_ledger FOR INSERT 
WITH CHECK (public.get_my_role() IN ('president', 'owner'));

-- USER SECURITY: Prevent users from changing their own role to 'owner'
CREATE POLICY "Users can update their own non-role data" 
ON public.users FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (user_type = (SELECT user_type FROM public.users WHERE user_id = auth.uid()));
