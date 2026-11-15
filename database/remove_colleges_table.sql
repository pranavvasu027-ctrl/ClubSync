-- ==============================================================================
-- CLUBSYNC: REMOVE REDUNDANT COLLEGES TABLE (SINGLE-CAMPUS VIT PUNE SCOPE)
-- Target: PostgreSQL 15 / Supabase
-- Purpose: ClubSync is institutionally dedicated to VIT Pune. Eliminating the
--          multi-tenancy colleges table removes redundant joins and reduces
--          schema complexity for the DBMS Course Project.
-- ==============================================================================

-- 1. Drop all foreign key constraints referencing colleges
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_college_id_fkey;
ALTER TABLE IF EXISTS public.clubs DROP CONSTRAINT IF EXISTS clubs_college_id_fkey;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_college_id_fkey;
ALTER TABLE IF EXISTS public.venues DROP CONSTRAINT IF EXISTS venues_college_id_fkey;
ALTER TABLE IF EXISTS public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_college_id_fkey;

-- 2. Drop RLS policies on colleges and drop the colleges table
DROP POLICY IF EXISTS "Public Read Access: Colleges" ON public.colleges;
DROP POLICY IF EXISTS "Public colleges read" ON public.colleges;
DROP POLICY IF EXISTS colleges_public_read ON public.colleges;

DROP TABLE IF EXISTS public.colleges CASCADE;

-- 3. Set institutional default 'VIT_PUNE' on entity tables
ALTER TABLE IF EXISTS public.users ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.clubs ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.events ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.venues ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.event_registrations ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';

UPDATE public.users SET college_id = 'VIT_PUNE' WHERE college_id IS NULL;
UPDATE public.clubs SET college_id = 'VIT_PUNE' WHERE college_id IS NULL;
UPDATE public.events SET college_id = 'VIT_PUNE' WHERE college_id IS NULL;
