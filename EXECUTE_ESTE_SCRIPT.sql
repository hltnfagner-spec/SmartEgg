-- ========================================
-- SCRIPT DE CONFIGURAÇÃO ADMINISTRATIVA
-- Execute este script no Supabase Dashboard
-- ========================================

-- 1. Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de segurança (SEM recursão)
-- Permitir que todos vejam admin_users (a segurança está em quem pode inserir)
DROP POLICY IF EXISTS "Anyone can view admin records" ON admin_users;
CREATE POLICY "Anyone can view admin records"
  ON admin_users FOR SELECT
  USING (true);

-- Políticas para admins verem todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Políticas para admins verem todas as configurações
DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
CREATE POLICY "Admins can view all company settings"
  ON company_settings FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- 3. Tornar AMBOS os emails administradores
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Ativar assinaturas PERPÉTUAS (sem vencimento) para contas admin
UPDATE subscriptions
SET 
  status = 'active',
  last_payment_at = NOW(),
  payment_due_date = NOW() + INTERVAL '100 years', -- Acesso perpétuo
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
);

-- 5. VERIFICAR RESULTADO
SELECT 
  u.email,
  CASE WHEN a.id IS NOT NULL THEN '✅ ADMIN' ELSE '❌ Normal' END as "Permissão",
  s.status as "Assinatura",
  TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as "Vencimento",
  EXTRACT(DAY FROM (s.payment_due_date - NOW()))::INTEGER as "Dias Restantes"
FROM auth.users u
LEFT JOIN admin_users a ON a.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ORDER BY u.email;
