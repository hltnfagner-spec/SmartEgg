-- Adicionar coluna supplier_id na tabela expenses para vincular fornecedores

-- 1. Adicionar coluna se não existir
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- 2. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);

-- 3. Adicionar foreign key para user_contacts (opcional, mas recomendado)
-- Descomente a linha abaixo se quiser garantir integridade referencial
-- ALTER TABLE expenses ADD CONSTRAINT fk_expenses_supplier FOREIGN KEY (supplier_id) REFERENCES user_contacts(id) ON DELETE SET NULL;

-- 4. Verificação: Listar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;
