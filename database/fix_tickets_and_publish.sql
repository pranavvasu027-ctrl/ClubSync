-- ==============================================================================
-- CLUBSYNC: FINAL SUPABASE TICKET TIER, REMOVE COLLEGES & PUBLISH HOTFIX
-- Run this single script in Supabase SQL Editor (or prompt ChatGPT to execute it).
-- ==============================================================================

-- 0. Remove Redundant 'colleges' table (System is institutionally scoped to VIT Pune)
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_college_id_fkey;
ALTER TABLE IF EXISTS public.clubs DROP CONSTRAINT IF EXISTS clubs_college_id_fkey;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_college_id_fkey;
ALTER TABLE IF EXISTS public.venues DROP CONSTRAINT IF EXISTS venues_college_id_fkey;
ALTER TABLE IF EXISTS public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_college_id_fkey;

DROP POLICY IF EXISTS "Public Read Access: Colleges" ON public.colleges;
DROP POLICY IF EXISTS "Public colleges read" ON public.colleges;
DROP POLICY IF EXISTS colleges_public_read ON public.colleges;
DROP TABLE IF EXISTS public.colleges CASCADE;

ALTER TABLE IF EXISTS public.users ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.clubs ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';
ALTER TABLE IF EXISTS public.events ALTER COLUMN college_id SET DEFAULT 'VIT_PUNE';

-- 1. Grant Authenticated Users & Presidents Ability to Manage Ticket Tiers
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

DROP POLICY IF EXISTS tickets_manage_policy ON public.tickets;
CREATE POLICY tickets_manage_policy ON public.tickets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Upgrade publish_event to auto-provision default ticket tier if none exists
CREATE OR REPLACE FUNCTION public.publish_event(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_capacity INT;
  v_price NUMERIC;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE event_id = p_event_id;
  IF v_event.event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
  END IF;

  IF v_event.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Only faculty-approved events can be published.');
  END IF;

  IF v_event.event_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot publish an event with a past date (' || v_event.event_date::text || ').');
  END IF;

  -- Transition event to published
  UPDATE public.events 
  SET status = 'published', updated_at = CURRENT_TIMESTAMP 
  WHERE event_id = p_event_id;

  -- Ensure default ticket tier exists
  v_capacity := GREATEST(10, COALESCE(v_event.expected_count, 100));
  v_price := GREATEST(0.00, COALESCE(v_event.ticket_price, 0.00));

  INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
  VALUES (p_event_id, 'Standard Pass', v_price, v_capacity, 0, true)
  ON CONFLICT (event_id, tier_name) DO UPDATE SET
    price = EXCLUDED.price,
    total_capacity = GREATEST(public.tickets.sold_count, EXCLUDED.total_capacity),
    is_active = true;

  RETURN jsonb_build_object(
    'success', true, 
    'status', 'published', 
    'event_id', p_event_id, 
    'message', 'Event published successfully to student portal.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_event(uuid) TO anon;

-- 3. Seed / Publish HackVIT 2026 Ticket & Set to Published
INSERT INTO public.tickets (event_id, tier_name, price, total_capacity, sold_count, is_active)
VALUES ('45173628-28a4-4d08-8b94-ce39ab4f7d29', 'Standard Pass', 0, 300, 0, true)
ON CONFLICT DO NOTHING;

UPDATE public.events
SET status = 'published', updated_at = now()
WHERE event_id = '45173628-28a4-4d08-8b94-ce39ab4f7d29';

-- 4. Seed Canonical Published Demo Event: "Building Scalable Web Apps"
INSERT INTO public.events (
  event_id, club_id, college_id, title, description, event_type, scope, event_date, event_time,
  venue_name, target_audience, expected_count, registered_count, ticket_price, status,
  faculty_remarks, created_by
) VALUES (
  'a0000000-0000-0000-0000-000000000001', 'VIT_CSI', 'VIT_PUNE',
  'Building Scalable Web Apps', 'Full-stack architecture, microservices, and high-concurrency caching in cloud databases.',
  'Workshop', 'INTRA_COLLEGE', '2026-11-25', '4:00 PM – 6:00 PM', 'Sharad Arena',
  'Computer Engineering and IT students', 150, 0, 0, 'published',
  'Official Sanction Granted by Faculty Mentor.', '31ee0384-3b04-4245-9a5f-a689c57cd078'
) ON CONFLICT (event_id) DO UPDATE SET status = 'published';

INSERT INTO public.tickets (ticket_id, event_id, tier_name, price, total_capacity, sold_count, is_active)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Pass', 0, 150, 0, true)
ON CONFLICT (ticket_id) DO NOTHING;
