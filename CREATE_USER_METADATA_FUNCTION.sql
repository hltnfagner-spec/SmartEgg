-- ========================================
-- CRIAR FUNÇÃO PARA ACESSAR USER_METADATA
-- Views não suportam políticas RLS, usaremos função
-- ========================================

-- Remover view antiga se existir
DROP VIEW IF EXISTS public.user_metadata_view;

-- Criar função para buscar user_metadata de forma segura
CREATE OR REPLACE FUNCTION public.get_user_metadata(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  metadata JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email,
    u.phone,
    u.raw_user_meta_data as metadata
  FROM auth.users u
  WHERE u.id = user_uuid
    AND (
      user_uuid = auth.uid() OR 
      auth.uid() IN (SELECT user_id FROM admin_users)
    );
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.get_user_metadata(UUID) TO authenticated;

-- Criar função para buscar todos os usuários (apenas para admins)
CREATE OR REPLACE FUNCTION public.get_all_users_metadata()
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email,
    u.phone,
    u.raw_user_meta_data as metadata,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE auth.uid() IN (SELECT user_id FROM admin_users);
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.get_all_users_metadata() TO authenticated;

-- Testar se as funções funcionam
SELECT 'get_all_users_metadata' as test, COUNT(*) as total FROM public.get_all_users_metadata();
