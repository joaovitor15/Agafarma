-- Remover políticas antigas se existirem para evitar duplicidade
DROP POLICY IF EXISTS "Apenas admin pode inserir permissões" ON permissoes_usuarios;

-- O Administrador do sistema pode inserir qualquer permissão (pré-aprovar usuários)
CREATE POLICY "Apenas admin pode inserir permissões" ON permissoes_usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permissoes_usuarios p WHERE p.email = auth.jwt()->>'email' AND p.is_admin = true
    )
  );

-- Garantir que a política de auto-inserção continue existindo (para quando não usar trigger)
DROP POLICY IF EXISTS "Usuários podem auto-inserir sua permissão" ON permissoes_usuarios;
CREATE POLICY "Usuários podem auto-inserir sua permissão" ON permissoes_usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.jwt()->>'email');

-- Criar a função que será chamada pelo Trigger do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.permissoes_usuarios (email)
  VALUES (new.email)
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o Trigger na tabela auth.users do Supabase
-- Usamos um bloco DO para evitar erros se o trigger já existir (embora CREATE TRIGGER não tenha IF NOT EXISTS com facilidade, dropamos antes)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
