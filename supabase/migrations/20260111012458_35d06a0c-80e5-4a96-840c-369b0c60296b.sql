-- First, add a column to preserve item information when item is deleted
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS item_name_snapshot text;

-- Add columns to preserve other item info for reports
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS item_sector text;

ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS item_unit text;

ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS item_price numeric;

-- Update existing movements with current item data
UPDATE public.stock_movements sm
SET 
  item_name_snapshot = ii.name,
  item_sector = ii.sector::text,
  item_unit = ii.unit::text,
  item_price = ii.price
FROM public.inventory_items ii
WHERE sm.item_id = ii.id AND sm.item_name_snapshot IS NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_item_id_fkey;

-- Re-create it with SET NULL instead of CASCADE
ALTER TABLE public.stock_movements 
ADD CONSTRAINT stock_movements_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES public.inventory_items(id) 
ON DELETE SET NULL;

-- Make item_id nullable now that we preserve data separately
ALTER TABLE public.stock_movements 
ALTER COLUMN item_id DROP NOT NULL;

-- Create a trigger to automatically save item info when movement is created
CREATE OR REPLACE FUNCTION public.save_item_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  SELECT name, sector::text, unit::text, price
  INTO NEW.item_name_snapshot, NEW.item_sector, NEW.item_unit, NEW.item_price
  FROM public.inventory_items
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS save_item_snapshot_trigger ON public.stock_movements;

CREATE TRIGGER save_item_snapshot_trigger
BEFORE INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.save_item_snapshot();