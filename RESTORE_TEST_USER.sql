-- ========================================
-- RESTAURAR USUÁRIO DE TESTE APÓS TESTES
-- ========================================

-- Restaurar usuário de teste para trial normal
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Buscar ID do usuário de teste
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@example.com';
    
    -- Se não existir, mostrar mensagem
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Usuário test@example.com não encontrado.';
        RETURN;
    END IF;
    
    -- Restaurar assinatura para trial normal
    UPDATE subscriptions 
    SET 
        status = 'trial',
        payment_due_date = NOW() + INTERVAL '15 days',
        trial_end = NOW() + INTERVAL '15 days',
        updated_at = NOW()
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Usuário test@example.com restaurado para trial normal!';
END $$;

-- Verificar resultado
SELECT 
    u.email,
    s.status,
    s.plan_name,
    TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
    CASE 
        WHEN s.status = 'expired' THEN '⚠️ EXPIRADO'
        WHEN s.status = 'trial' THEN '✅ TRIAL RESTAURADO'
        ELSE s.status
    END as situacao
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'test@example.com';
