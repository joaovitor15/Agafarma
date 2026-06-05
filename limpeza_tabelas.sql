-- Limpeza das tabelas duplicadas ou não padronizadas no banco de dados

-- Remover tabelas antigas se existirem e suas dependências (cascade)
DROP TABLE IF EXISTS public.medicamentos_orcamento CASCADE;
DROP TABLE IF EXISTS public.orcamentos CASCADE;
DROP TABLE IF EXISTS public.orcamento_itens CASCADE;
DROP TABLE IF EXISTS public.orcamentos_orcamento CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.pacientes_orcamento CASCADE;

-- As tabelas que DEVEM permanecer (já criadas no passo anterior):
-- 1. public.paciente_orcamento
-- 2. public.orcamentos_judiciais
-- 3. public.medicamento_orcamento
