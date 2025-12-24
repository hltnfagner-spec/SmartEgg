-- ========================================
-- CRIAR VIEW PARA ACESSAR USER_METADATA
-- Permite buscar dados cadastrados pelos usuários via REST API
-- ========================================

-- Remover view se existir
DROP VIEW IF EXISTS public.user_metadata_view;

-- Criar view para expor user_metadata de forma segura
CREATE OR REPLACE VIEW public.user_metadata_view AS
SELECT 
  u.id,
  u.email,
  u.phone,
  u.created_at,
  u.last_sign_in_at,
  u.updated_at,
  u.raw_user_meta_data as metadata
FROM auth.users u;

-- Garantir permissões na view
GRANT SELECT ON public.user_metadata_view TO authenticated;

-- Criar política para a view (se necessário)
DROP POLICY IF EXISTS "user_metadata_view_policy" ON public.user_metadata_view;

CREATE POLICY "user_metadata_view_policy"
  ON public.user_metadata_view FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Testar se a view funciona
SELECT COUNT(*) as "Total Users" FROM public.user_metadata_view;

-- Verificar estrutura da view
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_metadata_view' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
