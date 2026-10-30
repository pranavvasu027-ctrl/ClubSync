-- =============================================
-- Step 3.5 Transition Verification Tests
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check current constraint is in place
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.events'::regclass AND contype = 'c' AND conname ILIKE '%status%';

-- 2. Check current default
SELECT column_default FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'status';

-- 3. Check all current event statuses in the database
SELECT status, COUNT(*) FROM public.events GROUP BY status ORDER BY status;

-- 4. Verify NO legacy 'proposed', 'live', or 'upcoming' rows remain
SELECT event_id, title, status FROM public.events 
WHERE status IN ('proposed', 'live', 'upcoming');

-- 5. Verify the trigger exists
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'public.events'::regclass AND tgname = 'enforce_event_status_workflow';

-- 6. Verify RPCs exist
SELECT proname FROM pg_proc 
WHERE proname IN ('submit_event_for_approval', 'process_event_approval', 'publish_event')
ORDER BY proname;
