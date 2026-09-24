-- Migration: Step 3.5 Status Normalization
-- Idempotent script to migrate legacy status values to the new canonical set
-- draft, under_review, changes_requested, approved, published, rejected

-- 1. Drop the old check constraint FIRST (so we can insert 'under_review')
DO $$
DECLARE 
    con_name TEXT;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint 
    WHERE conrelid = 'public.events'::regclass 
      AND contype = 'c' 
      AND consrc ILIKE '%status%';
      
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.events DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

-- 2. Safely migrate existing legacy data (Bypass trigger using rpc_context)
BEGIN;
  SET LOCAL app.rpc_context = 'true';
  UPDATE public.events SET status = 'under_review' WHERE status = 'proposed';
  UPDATE public.events SET status = 'published' WHERE status IN ('live', 'upcoming');
COMMIT;

-- 3. Add the hardened check constraint with the exact requested valid statuses
-- plus legacy historical ones so we don't break old row updates
ALTER TABLE public.events
ADD CONSTRAINT events_status_check
CHECK (status IN (
  'draft', 
  'under_review', 
  'changes_requested', 
  'approved', 
  'published', 
  'rejected',
  -- Legacy/Historical/Future (preservation)
  'past', 'cancelled', 'completed', 'settled'
));

-- 4. Update the default value for new events to be 'draft' instead of 'upcoming'
ALTER TABLE public.events ALTER COLUMN status SET DEFAULT 'draft';

