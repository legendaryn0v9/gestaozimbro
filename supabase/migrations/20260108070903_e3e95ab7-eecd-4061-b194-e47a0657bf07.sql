-- Allow admins to delete stock movements
CREATE POLICY "Admins can delete movements"
ON public.stock_movements
FOR DELETE
USING (public.is_admin());

-- Allow admins to update stock movements (for potential future use)
CREATE POLICY "Admins can update movements"
ON public.stock_movements
FOR UPDATE
USING (public.is_admin());