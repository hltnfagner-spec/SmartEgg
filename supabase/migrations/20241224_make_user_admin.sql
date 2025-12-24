-- Script para tornar um usuário administrador
-- Execute este script no SQL Editor do Supabase Dashboard
-- Substitua 'SEU_EMAIL@exemplo.com' pelo seu email real

-- Inserir usuário como admin (substitua o email)
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email = 'SEU_EMAIL@exemplo.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verificar se funcionou
SELECT 
  u.email,
  u.created_at,
  CASE 
    WHEN a.id IS NOT NULL THEN 'Admin'
    ELSE 'Usuário Normal'
  END as role
FROM auth.users u
LEFT JOIN admin_users a ON a.user_id = u.id
WHERE u.email = 'SEU_EMAIL@exemplo.com';
