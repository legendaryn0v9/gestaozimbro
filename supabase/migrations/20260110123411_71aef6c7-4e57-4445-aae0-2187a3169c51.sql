-- Add DELETE policy for profiles table (only admins can delete)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin());

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;