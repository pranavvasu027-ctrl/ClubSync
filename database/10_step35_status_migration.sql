-- Migration: Step 3.5 Status Normalization
-- Idempotent script to migrate legacy status values to the new canonical set
-- draft, under_review, changes_requested, approved, published, rejected

-- 1. Safely migrate existing legacy data
UPDATE public.events SET status = 'under_review' WHERE status = 'proposed';
UPDATE public.events SET status = 'published' WHERE status IN ('live', 'upcoming');

-- Note: We are keeping 'completed', 'past', 'cancelled', 'settled' if they exist,
-- but the main Step 1-5 pipeline now strictly uses the canonical vocab.

-- 2. Drop the old check constraint (safely finding its name first)
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

