-- SQL para adicionar as novas colunas de Coleta na tabela de configuracoes
ALTER TABLE configuracoes
ADD COLUMN IF NOT EXISTS coleta_razao_social text,
ADD COLUMN IF NOT EXISTS coleta_cnpj text,
ADD COLUMN IF NOT EXISTS coleta_endereco text,
ADD COLUMN IF NOT EXISTS coleta_cidade_uf text,
ADD COLUMN IF NOT EXISTS coleta_cep text;
