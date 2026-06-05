-- Schema para a tabela de funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  valor DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Schema para a tabela de configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid() UNIQUE,
  empresa_nome TEXT,
  nome_fantasia TEXT,
  empresa_cnpj TEXT,
  inscricao_estadual TEXT,
  telefone TEXT,
  email TEXT,
  rua TEXT,
  numero TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  farmaceutico_resp TEXT,
  crf_rs TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  coleta_razao_social TEXT,
  coleta_cnpj TEXT,
  coleta_endereco TEXT,
  coleta_cidade_uf TEXT,
  coleta_cep TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração: Remover colunas antigas (caso você já as tenha criado no Supabase)
-- Se você rodar este bloco no SQL Editor, as colunas antigas serão excluídas.
-- ALTER TABLE configuracoes DROP COLUMN IF EXISTS endereco;
-- ALTER TABLE configuracoes DROP COLUMN IF EXISTS cidade_uf;

-- Migração: Adicionar NOVA coluna de permissão
-- ALTER TABLE permissoes_usuarios ADD COLUMN IF NOT EXISTS pode_acessar_sicredi BOOLEAN DEFAULT true;

-- Schema para a tabela de permissoes_usuarios
CREATE TABLE IF NOT EXISTS permissoes_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  pode_acessar_premio BOOLEAN DEFAULT true,
  pode_acessar_config BOOLEAN DEFAULT false,
  pode_acessar_sicredi BOOLEAN DEFAULT true,
  pode_acessar_manuais BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para Manuais e POPs
CREATE TABLE IF NOT EXISTS manuais_pops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pop', 'manual')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração: Adicionar NOVA coluna de descrição
ALTER TABLE manuais_pops ADD COLUMN IF NOT EXISTS descricao TEXT;


-- Habilitar RLS (Row Level Security)
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Migração: Adicionar NOVA coluna de validade
ALTER TABLE manuais_pops ADD COLUMN IF NOT EXISTS validade DATE;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuais_pops ENABLE ROW LEVEL SECURITY;

-- Políticas para Manuais e POPs
DROP POLICY IF EXISTS "Usuários podem ver manuais" ON manuais_pops;
CREATE POLICY "Usuários podem ver manuais" ON manuais_pops
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários com permissão podem inserir manuais" ON manuais_pops;
CREATE POLICY "Usuários com permissão podem inserir manuais" ON manuais_pops
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND (pode_acessar_manuais = true OR is_admin = true)));

DROP POLICY IF EXISTS "Usuários com permissão podem atualizar manuais" ON manuais_pops;
CREATE POLICY "Usuários com permissão podem atualizar manuais" ON manuais_pops
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND (pode_acessar_manuais = true OR is_admin = true)));

DROP POLICY IF EXISTS "Usuários com permissão podem deletar manuais" ON manuais_pops;
CREATE POLICY "Usuários com permissão podem deletar manuais" ON manuais_pops
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND (pode_acessar_manuais = true OR is_admin = true)));


-- Políticas para usuários autenticados (Acesso Global)
CREATE POLICY "Usuários podem ver todos funcionários" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND pode_acessar_premio = true));

CREATE POLICY "Usuários podem inserir funcionários" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND pode_acessar_premio = true));

CREATE POLICY "Usuários podem atualizar funcionários" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND pode_acessar_premio = true));

CREATE POLICY "Usuários podem deletar funcionários" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND (pode_acessar_premio = true OR is_admin = true)));

CREATE POLICY "Usuários podem ver todas configurações" ON configuracoes
  FOR SELECT
  TO authenticated
  USING (true); -- Configs basicas como nome da empresa todo mundo vê

CREATE POLICY "Usuários podem inserir configurações" ON configuracoes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND pode_acessar_config = true));

CREATE POLICY "Usuários podem atualizar configurações" ON configuracoes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM permissoes_usuarios WHERE email = auth.jwt()->>'email' AND pode_acessar_config = true));

-- Permissões de Usuários
DROP POLICY IF EXISTS "Qualquer usuário logado pode ver as permissões" ON permissoes_usuarios;
CREATE POLICY "Qualquer usuário logado pode ver as permissões" ON permissoes_usuarios
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem auto-inserir sua permissão" ON permissoes_usuarios;
CREATE POLICY "Usuários podem auto-inserir sua permissão" ON permissoes_usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Apenas admin pode alterar permissões" ON permissoes_usuarios;
CREATE POLICY "Apenas admin pode alterar permissões" ON permissoes_usuarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuarios p WHERE p.email = auth.jwt()->>'email' AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Apenas admin pode deletar permissões" ON permissoes_usuarios;
CREATE POLICY "Apenas admin pode deletar permissões" ON permissoes_usuarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuarios p WHERE p.email = auth.jwt()->>'email' AND p.is_admin = true
    )
  );

-- Inserir o primeiro admin (você)
INSERT INTO permissoes_usuarios (email, pode_acessar_premio, pode_acessar_config, pode_acessar_sicredi, is_admin)
VALUES ('joaovitormachry@gmail.com', true, true, true, true)
ON CONFLICT (email) DO UPDATE SET 
  is_admin = true,
  pode_acessar_premio = true,
  pode_acessar_config = true,
  pode_acessar_sicredi = true;
