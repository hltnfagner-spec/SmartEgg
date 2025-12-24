-- ========================================
-- CORRIGIR POLÍTICAS RLS DE SUBSCRIPTIONS
-- Remove políticas conflitantes e cria apenas as necessárias
-- ========================================

-- 1. REMOVER TODAS as políticas de subscriptions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscriptions';
    END LOOP;
END $$;

-- 2. REMOVER TODAS as políticas de admin_users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON admin_users';
    END LOOP;
END $$;

-- 3. REMOVER TODAS as políticas de company_settings
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'company_settings' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON company_settings';
    END LOOP;
END $$;

-- 4. Criar tabela admin_users se não existir
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Criar APENAS as políticas necessárias

-- admin_users: leitura pública
CREATE POLICY "admin_users_public_select"
  ON admin_users FOR SELECT
  USING (true);

-- subscriptions: usuário vê sua própria assinatura OU admin vê todas
CREATE POLICY "subscriptions_user_select"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- subscriptions: usuário atualiza sua própria assinatura OU admin atualiza todas
CREATE POLICY "subscriptions_user_update"
  ON subscriptions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- subscriptions: permitir INSERT para novos usuários
CREATE POLICY "subscriptions_user_insert"
  ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- company_settings: usuário vê suas próprias configurações OU admin vê todas
CREATE POLICY "company_settings_user_select"
  ON company_settings FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- company_settings: usuário atualiza suas próprias configurações
CREATE POLICY "company_settings_user_update"
  ON company_settings FOR UPDATE
  USING (user_id = auth.uid());

-- company_settings: permitir INSERT para novos usuários
CREATE POLICY "company_settings_user_insert"
  ON company_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 6. Tornar administradores
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 7. Ativar assinaturas perpétuas para admins
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

-- 8. VERIFICAR políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('subscriptions', 'admin_users', 'company_settings')
ORDER BY tablename, policyname;

-- 9. Testar acesso
SELECT 
  'Subscriptions' as tabela,
  COUNT(*) as total
FROM subscriptions
UNION ALL
SELECT 
  'Company Settings' as tabela,
  COUNT(*) as total
FROM company_settings
UNION ALL
SELECT 
  'Admin Users' as tabela,
  COUNT(*) as total
FROM admin_users;
