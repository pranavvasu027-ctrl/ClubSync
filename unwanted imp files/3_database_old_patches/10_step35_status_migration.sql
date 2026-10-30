-- Migration: Step 3.5 Status Normalization
-- Idempotent script to migrate legacy status values to the new canonical set
-- draft, under_review, changes_requested, approved, published, rejected

-- 1. Drop the old check constraint directly (consrc removed in PG15+)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- 2. Safely migrate existing legacy data (Bypass trigger using rpc_context)
BEGIN;
  SET LOCAL app.rpc_context = 'true';
  UPDATE public.events SET status = 'under_review' WHERE status = 'proposed';
  UPDATE public.events SET status = 'published' WHERE status IN ('live', 'upcoming');
COMMIT;

-- 3. Add the hardened check constraint with the exact requested valid statuses
ALTER TABLE public.events
ADD CONSTRAINT events_status_check
CHECK (status IN (
  'draft', 
  'under_review', 
  'changes_requested', 
  'approved', 
  'published', 
  'rejected',
  'past', 'cancelled', 'completed', 'settled'
));

-- 4. Update the default value for new events to be 'draft' instead of 'upcoming'
ALTER TABLE public.events ALTER COLUMN status SET DEFAULT 'draft';
