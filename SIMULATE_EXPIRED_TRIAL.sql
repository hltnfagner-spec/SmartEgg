-- ========================================
-- SIMULAR USUÁRIO COM TRIAL EXPIRADO PARA TESTES
-- ========================================

-- 1. Criar um usuário de teste com trial expirado
-- (Substitua 'test@example.com' pelo email que deseja testar)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Buscar ID do usuário de teste (ou criar um novo)
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@example.com';
    
    -- Se não existir, mostrar mensagem
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Usuário test@example.com não encontrado. Use um email existente ou crie uma conta primeiro.';
        RETURN;
    END IF;
    
    -- Atualizar assinatura para trial expirado
    UPDATE subscriptions 
    SET 
        status = 'expired',
        payment_due_date = NOW() - INTERVAL '5 days',  -- Expirou há 5 dias
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
    
    RAISE NOTICE 'Usuário test@example.com agora tem trial expirado!';
END $$;

-- 2. Verificar resultado
SELECT 
    u.email,
    s.status,
    s.plan_name,
    TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
    TO_CHAR(s.trial_end, 'DD/MM/YYYY') as fim_trial,
    CASE 
        WHEN s.status = 'expired' THEN '⚠️ TRIAL EXPIRADO'
        WHEN s.status = 'trial' THEN '✅ Em trial'
        ELSE s.status
    END as situacao,
    CASE 
        WHEN s.payment_due_date < NOW() THEN 'EXPIRADO'
        WHEN s.payment_due_date > NOW() THEN 'ATIVO'
        ELSE 'HOJE'
    END as status_vencimento
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'test@example.com';

-- 3. Mostrar todos os usuários com status para comparação
SELECT 
    u.email,
    s.status,
    CASE 
        WHEN s.status = 'expired' THEN '⚠️ EXPIRADO'
        WHEN s.status = 'trial' THEN '🔄 TRIAL'
        WHEN s.status = 'active' THEN '✅ ATIVO'
        ELSE '❌ SEM STATUS'
    END as status_visual,
    TO_CHAR(s.payment_due_date, 'DD/MM/YYYY') as vencimento,
    CASE 
        WHEN s.payment_due_date < NOW() THEN 'VENCIDO'
        WHEN s.payment_due_date > NOW() THEN 'OK'
        ELSE 'HOJE'
    END as validade
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id
ORDER BY s.payment_due_date DESC NULLS LAST;
