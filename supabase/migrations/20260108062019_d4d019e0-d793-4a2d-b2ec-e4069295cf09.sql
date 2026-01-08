-- Adicionar coluna de imagem aos itens do inventário
ALTER TABLE public.inventory_items 
ADD COLUMN image_url TEXT;