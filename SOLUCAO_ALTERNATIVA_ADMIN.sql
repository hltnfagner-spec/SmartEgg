-- ========================================
-- SOLUÇÃO ALTERNATIVA - auth.users não é acessível via REST API
-- Vamos usar apenas company_settings e subscriptions
-- ========================================

-- 1. REMOVER TODAS as políticas antigas
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin records" ON admin_users;
DROP POLICY IF EXISTS "Anyone can view admin records" ON admin_users;
DROP POLICY IF EXISTS "Public read access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_read_all" ON admin_users;
DROP POLICY IF EXISTS "admin_users_read_all_2024" ON admin_users;
DROP POLICY IF EXISTS "admin_users_public_read" ON admin_users;

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_read" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_read_2024" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_owner_and_admin_read" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_update_2024" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_owner_and_admin_update" ON subscriptions;

DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
DROP POLICY IF EXISTS "company_settings_select_policy" ON company_settings;
DROP POLICY IF EXISTS "company_settings_admin_read" ON company_settings;
DROP POLICY IF EXISTS "company_settings_admin_read_2024" ON company_settings;
DROP POLICY IF EXISTS "company_settings_owner_and_admin_read" ON company_settings;

-- 2. Remover view antiga
DROP VIEW IF EXISTS public.users_view;

-- 3. Criar tabela admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas finais
CREATE POLICY "admin_users_anyone_read"
  ON admin_users FOR SELECT
  USING (true);

CREATE POLICY "subscriptions_all_read"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "subscriptions_all_update"
  ON subscriptions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "company_settings_all_read"
  ON company_settings FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- 5. Tornar AMBOS os emails administradores
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 6. Ativar assinaturas PERPÉTUAS (100 anos)
UPDATE subscriptions
SET 
  status = 'active',
  last_payment_at = NOW(),
  payment_due_date = NOW() + INTERVAL '100 years',
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
);

-- 7. VERIFICAR RESULTADO
SELECT 
  u.email,
  CASE WHEN a.id IS NOT NULL THEN '✅ ADMIN' ELSE '❌ Normal' END as "Status",
  s.status as "Assinatura",
  TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as "Vencimento"
FROM auth.users u
LEFT JOIN admin_users a ON a.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ORDER BY u.email;

-- 8. Verificar company_settings
SELECT COUNT(*) as "Total Company Settings" FROM company_settings;

-- 9. Listar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd 
FROM pg_policies 
WHERE tablename IN ('admin_users', 'subscriptions', 'company_settings')
ORDER BY tablename, policyname;
