-- SQL para criar as tabelas de Notas Fiscais de Medicamentos Vencidos no Supabase
CREATE TABLE IF NOT EXISTS notas_fiscais_vencidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  valor_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS itens_vencidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_fiscal_id UUID REFERENCES notas_fiscais_vencidos(id) ON DELETE CASCADE,
  data_item DATE NOT NULL,
  codigo TEXT,
  medicamento TEXT NOT NULL,
  lote TEXT,
  ncm TEXT,
  cest TEXT,
  cfop TEXT,
  quantidade DECIMAL(10, 2) NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  preco_final DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE notas_fiscais_vencidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_vencidos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para notas_fiscais_vencidos
DROP POLICY IF EXISTS "Usuários podem ver suas NFs vencidos" ON notas_fiscais_vencidos;
CREATE POLICY "Usuários podem ver suas NFs vencidos" ON notas_fiscais_vencidos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir suas NFs vencidos" ON notas_fiscais_vencidos;
CREATE POLICY "Usuários podem inserir suas NFs vencidos" ON notas_fiscais_vencidos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem atualizar suas NFs vencidos" ON notas_fiscais_vencidos;
CREATE POLICY "Usuários podem atualizar suas NFs vencidos" ON notas_fiscais_vencidos
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem deletar suas NFs vencidos" ON notas_fiscais_vencidos;
CREATE POLICY "Usuários podem deletar suas NFs vencidos" ON notas_fiscais_vencidos
  FOR DELETE TO authenticated USING (true);

-- Políticas de acesso para itens_vencidos
DROP POLICY IF EXISTS "Usuários podem ver seus itens de vencidos" ON itens_vencidos;
CREATE POLICY "Usuários podem ver seus itens de vencidos" ON itens_vencidos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir seus itens de vencidos" ON itens_vencidos;
CREATE POLICY "Usuários podem inserir seus itens de vencidos" ON itens_vencidos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seus itens de vencidos" ON itens_vencidos;
CREATE POLICY "Usuários podem atualizar seus itens de vencidos" ON itens_vencidos
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuários podem deletar seus itens de vencidos" ON itens_vencidos;
CREATE POLICY "Usuários podem deletar seus itens de vencidos" ON itens_vencidos
  FOR DELETE TO authenticated USING (true);
