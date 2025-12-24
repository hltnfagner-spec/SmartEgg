-- Script para tornar hiltonfag@gmail.com administrador
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar tabela de administradores (se ainda não existir)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;
CREATE POLICY "Admins can view all admin records"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert admin records" ON admin_users;
CREATE POLICY "Admins can insert admin records"
  ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- 5. Tornar hiltonfag@gmail.com administrador
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email = 'hiltonfag@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Verificar se funcionou
SELECT 
  u.email,
  u.created_at as "Conta criada em",
  a.created_at as "Admin desde",
  CASE 
    WHEN a.id IS NOT NULL THEN '✅ ADMINISTRADOR'
    ELSE '❌ Usuário Normal'
  END as "Status"
FROM auth.users u
LEFT JOIN admin_users a ON a.user_id = u.id
WHERE u.email = 'hiltonfag@gmail.com';

-- 7. Ativar sua assinatura por 365 dias (1 ano)
UPDATE subscriptions
SET 
  status = 'active',
  last_payment_at = NOW(),
  payment_due_date = NOW() + INTERVAL '365 days',
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'hiltonfag@gmail.com'
);

-- 8. Verificar assinatura
SELECT 
  u.email,
  s.status as "Status Assinatura",
  s.payment_due_date as "Vencimento",
  EXTRACT(DAY FROM (s.payment_due_date - NOW())) as "Dias Restantes"
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'hiltonfag@gmail.com';
