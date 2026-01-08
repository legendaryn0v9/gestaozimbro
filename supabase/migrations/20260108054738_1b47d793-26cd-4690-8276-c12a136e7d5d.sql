-- Add category column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN category TEXT;