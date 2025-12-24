-- Adicionar políticas RLS para que administradores possam ver todas as assinaturas e configurações

-- Política para admins verem todas as assinaturas
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Política para admins verem todas as configurações de empresas
CREATE POLICY "Admins can view all company settings"
  ON company_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Política para admins atualizarem assinaturas
CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );
