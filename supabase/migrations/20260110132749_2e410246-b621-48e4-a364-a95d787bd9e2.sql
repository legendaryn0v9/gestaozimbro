-- Tighten RLS policies (security hardening)

-- PROFILES: remove public read access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());

-- Allow admins to update any profile (if not already present)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- USER_ROLES: users can only read their own role (admins can read all)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- INVENTORY_ITEMS: only admins can write; all authenticated can read
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can view all items" ON public.inventory_items;

CREATE POLICY "Authenticated users can view all items"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert items"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update items"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete items"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (is_admin());

-- Function hardening: set immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;