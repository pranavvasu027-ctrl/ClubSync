-- Add the exact signature Postgres is looking for: (VARCHAR, TEXT[])
CREATE OR REPLACE FUNCTION public.has_club_role(target_club_id VARCHAR, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.users u ON m.user_id = u.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.club_id = target_club_id
      AND m.role = ANY(allowed_roles)
  );
$$;
