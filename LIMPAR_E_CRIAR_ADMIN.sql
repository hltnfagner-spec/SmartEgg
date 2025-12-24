-- ========================================
-- SCRIPT COMPLETO: LIMPAR TUDO E RECRIAR
-- Execute este script para limpar e recriar do zero
-- ========================================

-- 1. REMOVER TODAS as políticas antigas (todas as variações possíveis)
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin records" ON admin_users;
DROP POLICY IF EXISTS "Anyone can view admin records" ON admin_users;
DROP POLICY IF EXISTS "Public read access to admin_users" ON admin_users;

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins update all subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins view all company settings" ON company_settings;

-- 2. Criar tabela admin_users (se não existir)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Criar NOVA política para admin_users (leitura pública)
CREATE POLICY "admin_users_select_policy"
  ON admin_users FOR SELECT
  USING (true);

-- 4. Criar NOVAS políticas para subscriptions
CREATE POLICY "subscriptions_select_policy"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "subscriptions_update_policy"
  ON subscriptions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- 5. Criar NOVAS políticas para company_settings
CREATE POLICY "company_settings_select_policy"
  ON company_settings FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- 6. Criar política para auth.users (permitir admins verem todos os usuários)
CREATE POLICY "admin_users_select_policy"
  ON auth.users FOR SELECT
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

-- 8. VERIFICAR RESULTADO
SELECT 
  u.email,
  CASE WHEN a.id IS NOT NULL THEN '✅ ADMIN FULL' ELSE '❌ Normal' END as "Status",
  s.status as "Assinatura",
  TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as "Vencimento"
FROM auth.users u
LEFT JOIN admin_users a ON a.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ORDER BY u.email;

-- 9. Testar se admin_users funciona
SELECT COUNT(*) as "Total Admins" FROM admin_users;
