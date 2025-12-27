-- Criar tabela user_contacts para gerenciar fornecedores e contatos
CREATE TABLE IF NOT EXISTS user_contacts (
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

-- Criar índice para melhorar performance de queries por user_id
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);

-- Criar índice para busca por tipo de contato
CREATE INDEX IF NOT EXISTS idx_user_contacts_type ON user_contacts(contact_type);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own contacts" ON user_contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON user_contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON user_contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON user_contacts;

-- Política para SELECT: usuários podem ver apenas seus próprios contatos
CREATE POLICY "Users can view their own contacts"
  ON user_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seus próprios contatos
CREATE POLICY "Users can create their own contacts"
  ON user_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas seus próprios contatos
CREATE POLICY "Users can update their own contacts"
  ON user_contacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas seus próprios contatos
CREATE POLICY "Users can delete their own contacts"
  ON user_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
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
