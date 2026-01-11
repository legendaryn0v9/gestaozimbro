-- Add 'edicao' to movement_type enum to track product edits
ALTER TYPE movement_type ADD VALUE IF NOT EXISTS 'edicao';

-- Create a table to track product edit history
CREATE TABLE IF NOT EXISTS public.product_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  item_name_snapshot TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_edit_history ENABLE ROW LEVEL SECURITY;

-- Policies for product_edit_history
CREATE POLICY "Authenticated users can view edit history"
ON public.product_edit_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert edit history"
ON public.product_edit_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_product_edit_history_item_id ON public.product_edit_history(item_id);
CREATE INDEX idx_product_edit_history_created_at ON public.product_edit_history(created_at DESC);