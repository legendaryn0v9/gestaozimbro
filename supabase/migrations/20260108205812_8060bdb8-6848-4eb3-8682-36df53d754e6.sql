-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all movements" ON public.stock_movements;

-- Create new SELECT policy: Admins see all, employees see only their own
CREATE POLICY "Users can view movements based on role"
ON public.stock_movements
FOR SELECT
USING (
  is_admin() OR auth.uid() = user_id
);