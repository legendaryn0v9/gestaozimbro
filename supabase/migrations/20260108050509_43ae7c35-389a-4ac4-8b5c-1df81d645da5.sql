-- Enum para setor (Bar ou Cozinha)
CREATE TYPE public.sector_type AS ENUM ('bar', 'cozinha');

-- Enum para tipo de movimentação
CREATE TYPE public.movement_type AS ENUM ('entrada', 'saida');

-- Enum para unidade de medida
CREATE TYPE public.unit_type AS ENUM ('unidade', 'kg', 'litro', 'caixa', 'pacote');

-- Tabela de perfis de funcionários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de itens do estoque
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sector sector_type NOT NULL,
  unit unit_type NOT NULL DEFAULT 'unidade',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de movimentações do estoque
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para inventory_items (todos podem ver e editar)
CREATE POLICY "Authenticated users can view all items"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert items"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete items"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para stock_movements
CREATE POLICY "Authenticated users can view all movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Habilitar realtime para movimentações
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;