-- Primeiro, vamos apagar as tabelas antigas/com nome estranho (caso já tenha criado na Supabase)
DROP TABLE IF EXISTS public.medicamentos_orcamento CASCADE;
DROP TABLE IF EXISTS public.orcamentos_orcamento CASCADE;
DROP TABLE IF EXISTS public.pacientes_orcamento CASCADE;

-- 1. Tabela para armazenar os pacientes específicos
CREATE TABLE public.paciente_orcamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela principal de orçamentos (para não ficar orcamento_orcamento)
CREATE TABLE public.orcamentos_judiciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.paciente_orcamento(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela para armazenar os itens (medicamentos) de cada orçamento
CREATE TABLE public.medicamento_orcamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos_judiciais(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  principio TEXT,
  quantidade NUMERIC,
  preco NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.paciente_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_judiciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamento_orcamento ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir acesso total paciente_orcamento" ON public.paciente_orcamento FOR ALL USING (true);
CREATE POLICY "Permitir acesso total orcamentos_judiciais" ON public.orcamentos_judiciais FOR ALL USING (true);
CREATE POLICY "Permitir acesso total medicamento_orcamento" ON public.medicamento_orcamento FOR ALL USING (true);
