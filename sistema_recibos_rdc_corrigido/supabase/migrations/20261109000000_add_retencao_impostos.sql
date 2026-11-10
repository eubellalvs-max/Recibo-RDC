-- ==============================================================================
-- MIGRAÇÃO: Suporte a Retenção de Imposto de Renda e Deduções em Recibos
-- ==============================================================================

ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS retencao_impostos JSONB;

-- Comentário explicativo na coluna para documentação do esquema
COMMENT ON COLUMN public.documentos.retencao_impostos IS 'Dados estruturados de retenção de IRRF e deduções no recibo comum';
