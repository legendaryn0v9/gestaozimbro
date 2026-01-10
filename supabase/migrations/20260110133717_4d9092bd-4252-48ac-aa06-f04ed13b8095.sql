-- Create table for dynamic categories (main categories like "Destilados", "Carnes")
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL CHECK (sector IN ('bar', 'cozinha')),
  icon TEXT DEFAULT 'Package',
  gradient TEXT DEFAULT 'from-amber-500 to-orange-600',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, sector)
);

-- Create table for subcategories (subcategories within main categories)
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Categories policies - everyone authenticated can read, only admins can write
CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (is_admin());

-- Subcategories policies
CREATE POLICY "Authenticated users can view subcategories"
ON public.subcategories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert subcategories"
ON public.subcategories
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update subcategories"
ON public.subcategories
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete subcategories"
ON public.subcategories
FOR DELETE
TO authenticated
USING (is_admin());

-- Trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();