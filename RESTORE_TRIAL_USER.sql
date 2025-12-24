-- ========================================
-- RESTAURAR TRIAL PARA xahik35771@gamintor.com
-- ========================================

-- Restaurar usuário para trial normal
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Buscar ID do usuário xahik35771@gamintor.com
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'xahik35771@gamintor.com';
    
    -- Se não existir, mostrar mensagem
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Usuário xahik35771@gamintor.com não encontrado.';
        RETURN;
    END IF;
    
    -- Restaurar assinatura para trial normal (15 dias)
    UPDATE subscriptions 
    SET 
        status = 'trial',
        payment_due_date = NOW() + INTERVAL '15 days',
        trial_end = NOW() + INTERVAL '15 days',
        updated_at = NOW()
    WHERE user_id = test_user_id;
    
    -- Se não tiver assinatura, criar uma nova
    IF NOT FOUND THEN
        INSERT INTO subscriptions (
            user_id,
            status,
            plan_name,
            payment_due_date,
            trial_end,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'trial',
            'Standard',
            NOW() + INTERVAL '15 days',
            NOW() + INTERVAL '15 days',
            NOW(),
            NOW()
        );
    END IF;
    
    RAISE NOTICE '✅ Usuário xahik35771@gamintor.com restaurado para TRIAL NORMAL!';
END $$;

-- Verificar resultado
SELECT 
    u.email,
    s.status,
    s.plan_name,
    TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
    TO_CHAR(s.trial_end, 'DD/MM/YYYY') as fim_trial,
    CASE 
        WHEN s.status = 'expired' THEN 'expired'
        WHEN s.status = 'trial' THEN 'trial'
        WHEN s.status = 'active' THEN 'active'
        ELSE s.status
    END as situacao,
    EXTRACT(DAY FROM s.payment_due_date - NOW())::integer || ' dias restantes' as dias
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'xahik35771@gamintor.com';
