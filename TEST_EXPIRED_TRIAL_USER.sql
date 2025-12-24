-- ========================================
-- SIMULAR TRIAL EXPIRADO PARA xahik35771@gamintor.com
-- ========================================

-- 1. Transformar usuário em trial expirado
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
        RAISE NOTICE 'Usuário xahik35771@gamintor.com não encontrado. Verifique o email.';
        RETURN;
    END IF;
    
    -- Atualizar assinatura para trial expirado (expirou há 5 dias)
    UPDATE subscriptions 
    SET 
        status = 'expired',
        payment_due_date = NOW() - INTERVAL '5 days',
        trial_end = NOW() - INTERVAL '5 days',
        updated_at = NOW()
    WHERE user_id = test_user_id;
    
    -- Se não tiver assinatura, criar uma expirada
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
            'expired',
            'Standard',
            NOW() - INTERVAL '5 days',  -- Expirou há 5 dias
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '20 days', -- Criado há 20 dias
            NOW()
        );
    END IF;
    
    RAISE NOTICE '✅ Usuário xahik35771@gamintor.com agora tem TRIAL EXPIRADO!';
END $$;

-- 2. Verificar resultado
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
    CASE 
        WHEN s.payment_due_date < NOW() THEN 'EXPIRADO'
        WHEN s.payment_due_date > NOW() THEN 'ATIVO'
        ELSE 'HOJE'
    END as status_vencimento,
    CASE 
        WHEN s.payment_due_date < NOW() THEN 
            EXTRACT(DAY FROM NOW() - s.payment_due_date)::integer || ' dias expirado'
        ELSE 
            EXTRACT(DAY FROM s.payment_due_date - NOW())::integer || ' dias restantes'
    END as dias
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'xahik35771@gamintor.com';

-- 3. Mostrar este usuário no contexto de todos
SELECT 
    u.email,
    s.status,
    CASE 
        WHEN s.status = 'expired' THEN 'expired'
        WHEN s.status = 'trial' THEN 'trial'
        WHEN s.status = 'active' THEN 'active'
        ELSE 'unknown'
    END as status_visual,
    TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
    CASE 
        WHEN s.payment_due_date < NOW() THEN 'VENCIDO'
        WHEN s.payment_due_date > NOW() THEN 'OK'
        ELSE 'HOJE'
    END as validade
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'xahik35771@gamintor.com' OR s.status = 'expired'
ORDER BY s.payment_due_date DESC NULLS LAST;
