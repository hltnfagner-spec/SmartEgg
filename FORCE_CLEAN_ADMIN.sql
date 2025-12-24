-- ========================================
-- SCRIPT DE LIMPEZA FORÇADA TOTAL
-- Remove TODAS as políticas possíveis e recria do zero
-- ========================================

-- 1. REMOVER TODAS as políticas de admin_users (todas as variações)
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin records" ON admin_users;
DROP POLICY IF EXISTS "Anyone can view admin records" ON admin_users;
DROP POLICY IF EXISTS "Public read access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;

-- 2. REMOVER TODAS as políticas de subscriptions (todas as variações)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;

-- 3. REMOVER TODAS as políticas de company_settings (todas as variações)
DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins view all company settings" ON company_settings;
DROP POLICY IF EXISTS "company_settings_select_policy" ON company_settings;

-- 4. REMOVER TODAS as políticas de auth.users (todas as variações)
DROP POLICY IF EXISTS "Admins can view all auth users" ON auth.users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON auth.users;
DROP POLICY IF EXISTS "auth_users_select_policy" ON auth.users;

-- 5. Criar tabela admin_users (se não existir)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas com nomes ÚNICOS para evitar conflitos
CREATE POLICY "admin_users_read_all"
  ON admin_users FOR SELECT
  USING (true);

CREATE POLICY "subscriptions_admin_read"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "subscriptions_admin_update"
  ON subscriptions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "company_settings_admin_read"
  ON company_settings FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Criar users_view para expor auth.users via REST API
DROP VIEW IF EXISTS public.users_view;

CREATE VIEW public.users_view AS
SELECT 
  id,
  email,
  phone,
  created_at,
  last_sign_in_at,
  updated_at
FROM auth.users;

ALTER VIEW public.users_view SET (security_barrier = true);

CREATE POLICY "users_view_admin_read"
  ON public.users_view FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- 7. Tornar AMBOS os emails administradores
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 8. Ativar assinaturas PERPÉTUAS (100 anos)
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

-- 9. VERIFICAR RESULTADO
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

-- 10. Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd 
FROM pg_policies 
WHERE tablename IN ('admin_users', 'subscriptions', 'company_settings', 'users_view')
ORDER BY tablename, policyname;

-- 11. Testar se users_view funciona
SELECT COUNT(*) as "Total Users in View" FROM public.users_view;
