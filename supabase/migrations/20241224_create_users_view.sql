-- Criar view para expor dados básicos dos usuários para admins
-- Esta view permite que admins vejam emails dos usuários sem expor dados sensíveis

CREATE OR REPLACE VIEW public.users_view AS
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at
FROM auth.users;

-- Permitir que apenas admins vejam esta view
ALTER VIEW public.users_view OWNER TO postgres;

-- Criar política RLS
ALTER TABLE public.users_view SET (security_invoker = on);

-- Conceder acesso apenas para usuários autenticados
GRANT SELECT ON public.users_view TO authenticated;

-- Criar política para que apenas admins possam ver
CREATE POLICY "Only admins can view users"
  ON public.users_view
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );
