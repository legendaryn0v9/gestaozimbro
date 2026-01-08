-- Add price column to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN price NUMERIC NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.inventory_items.price IS 'Unit price of the item in BRL';