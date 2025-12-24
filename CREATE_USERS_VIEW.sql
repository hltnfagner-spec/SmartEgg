-- ========================================
-- CRIAR VIEW PARA ACESSAR USUÁRIOS VIA REST API
-- Cria uma view no schema public para expor auth.users
-- ========================================

-- Remover view se existir
DROP VIEW IF EXISTS public.users_view;

-- Criar view para expor dados básicos dos usuários
CREATE VIEW public.users_view AS
SELECT 
  id,
  email,
  phone,
  created_at,
  last_sign_in_at,
  updated_at
FROM auth.users;

-- Habilitar RLS na view
ALTER VIEW public.users_view SET (security_barrier = true);

-- Criar política para a view
DROP POLICY IF EXISTS "users_view_admin_read" ON public.users_view;

CREATE POLICY "users_view_admin_read"
  ON public.users_view FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Verificar se a view foi criada
SELECT * FROM public.users_view LIMIT 1;

-- Listar políticas da view
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd 
FROM pg_policies 
WHERE tablename = 'users_view' AND schemaname = 'public';
