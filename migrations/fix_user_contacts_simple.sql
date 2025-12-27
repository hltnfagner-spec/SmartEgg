-- SOLUÇÃO SIMPLES: Recriar tabela user_contacts do zero

-- 1. Dropar tabela se existir (cuidado: isso apaga os dados!)
DROP TABLE IF EXISTS user_contacts CASCADE;

-- 2. Criar tabela novamente
CREATE TABLE user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  farm_name TEXT,
  contact_type TEXT DEFAULT 'contact',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX idx_user_contacts_type ON user_contacts(contact_type);

-- 4. Habilitar RLS
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY "Users can view their own contacts"
  ON user_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON user_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON user_contacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON user_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_contacts_updated_at
  BEFORE UPDATE ON user_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. VERIFICAÇÃO: Testar se consegue inserir
-- Descomente as linhas abaixo para testar (substitua o UUID pelo seu user_id)
-- INSERT INTO user_contacts (user_id, name, role, phone, contact_type) 
-- VALUES ('551f37e0-fc12-4704-a3d7-94a770881550', 'Teste', 'Fornecedor', '123456789', 'contact');
-- SELECT * FROM user_contacts WHERE user_id = '551f37e0-fc12-4704-a3d7-94a770881550';
