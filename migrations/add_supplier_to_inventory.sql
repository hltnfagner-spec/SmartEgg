-- Adicionar coluna supplier_id na tabela inventory para vincular fornecedores

-- 1. Adicionar coluna se não existir
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- 2. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- 3. Adicionar foreign key para user_contacts (opcional, mas recomendado)
-- Descomente a linha abaixo se quiser garantir integridade referencial
-- ALTER TABLE inventory ADD CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES user_contacts(id) ON DELETE SET NULL;
