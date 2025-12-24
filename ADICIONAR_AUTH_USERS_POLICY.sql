-- ========================================
-- ADICIONAR POLÍTICA PARA auth.users
-- Permite que administradores vejam todos os usuários cadastrados
-- ========================================

-- Habilitar RLS na auth.users (se não estiver)
-- NOTA: auth.users geralmente já tem RLS habilitado por padrão

-- Criar política para admins verem todos os usuários
DROP POLICY IF EXISTS "Admins can view all auth users" ON auth.users;

CREATE POLICY "Admins can view all auth users"
  ON auth.users FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- VERIFICAR se a política foi criada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'auth';
