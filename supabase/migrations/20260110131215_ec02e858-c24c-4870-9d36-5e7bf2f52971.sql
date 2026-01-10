-- Adicionar campo sector e phone na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sector text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.sector IS 'Setor do funcionário: bar, cozinha, ou NULL para admins/todos';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do funcionário para identificação';

-- Criar política para admins atualizarem qualquer perfil
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());