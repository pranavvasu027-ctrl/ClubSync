-- Fix for public.has_club_role strict typing issue
-- Drops the old VARCHAR[] signature and creates a TEXT[] signature

DROP FUNCTION IF EXISTS public.has_club_role(VARCHAR, VARCHAR[]);
DROP FUNCTION IF EXISTS public.has_club_role(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.has_club_role(target_club_id TEXT, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = target_club_id
      AND user_id = auth.uid()
      AND role = ANY(allowed_roles)
  );
$$;

-- Also fix platform role to take TEXT[] for consistency
DROP FUNCTION IF EXISTS public.has_platform_role(VARCHAR[]);
DROP FUNCTION IF EXISTS public.has_platform_role(TEXT[]);

CREATE OR REPLACE FUNCTION public.has_platform_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
      AND global_role = ANY(allowed_roles)
  );
$$;
