-- ========================================
-- CRIAR TRIALS AUTOMÁTICOS PARA USUÁRIOS SEM ASSINATURA
-- Corrige usuários antigos que aparecem "Sem assinatura"
-- ========================================

-- 1. Verificar quantos usuários não têm assinatura
SELECT 
  'Usuários sem assinatura' as status,
  COUNT(*) as total
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
);

-- 2. Criar assinaturas trial para usuários que não têm
INSERT INTO subscriptions (
  user_id,
  status,
  plan_name,
  payment_due_date,
  trial_end,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'trial',
  'Standard',
  NOW() + INTERVAL '15 days',  -- 15 dias de trial
  NOW() + INTERVAL '15 days',  -- trial_end
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
AND u.email NOT IN ('hltnfagner@gmail.com', 'hiltonfag@gmail.com');  -- Não criar trial para admins

-- 3. Verificar resultado após criação
SELECT 
  'Usuários com assinatura após correção' as status,
  COUNT(*) as total
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
);

-- 4. Mostrar detalhes das novas assinaturas criadas
SELECT 
  u.email,
  s.status,
  s.plan_name,
  TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
  TO_CHAR(s.trial_end, 'DD/MM/YYYY') as fim_trial,
  CASE 
    WHEN s.status = 'trial' THEN '✅ Trial criado'
    ELSE s.status
  END as situacao
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.created_at > NOW() - INTERVAL '1 hour'  -- Assinaturas criadas recentemente
ORDER BY s.created_at DESC;

-- 5. Estatísticas finais
SELECT 
  'Total de usuários' as tipo,
  COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
  'Com assinatura' as tipo,
  COUNT(*)
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
UNION ALL
SELECT 
  'Sem assinatura (deveria ser 0)' as tipo,
  COUNT(*)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
);
