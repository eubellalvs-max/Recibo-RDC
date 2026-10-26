-- ==============================================================================
-- SCHEMA OFICIAL - SISTEMA CENTRALIZADO DE RECIBOS E RDC (ABEAS)
-- Compatível com Supabase, PostgreSQL e Vercel Postgres
-- ==============================================================================

-- 1. Tabela de Empresas (Emissoras, Destinatárias ou Ambas)
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY,
    tipo_pessoa TEXT DEFAULT 'PJ',
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    cpf TEXT,
    rg TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    endereco TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    cep TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('emissora', 'destinataria', 'ambas')),
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    excluida_logica BOOLEAN DEFAULT false,
    logo_url TEXT,
    proximo_recibo_num INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Usuários e Permissões
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    email TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'emissor')),
    empresa_id TEXT,
    empresas_permitidas JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Documentos (Recibos Comuns, Recibos Médicos e RDC)
CREATE TABLE IF NOT EXISTS public.documentos (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL,
    numero_sequencial INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('recibo', 'rdc', 'recibo_medico')),
    empresa_emissora_id TEXT NOT NULL,
    empresa_destinataria_id TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    valor_extenso TEXT NOT NULL,
    referente TEXT NOT NULL,
    competencia TEXT,
    data_emissao TEXT NOT NULL,
    cidade_emissao TEXT NOT NULL,
    observacoes TEXT,
    usuario_id TEXT NOT NULL,
    usuario_nome TEXT,
    status TEXT NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'cancelado')),
    logo_url TEXT,
    rdc_detalhes JSONB,
    recibo_medico_detalhes JSONB,
    data_cancelamento TIMESTAMPTZ,
    usuario_cancelamento_id TEXT,
    usuario_cancelamento_nome TEXT,
    motivo_cancelamento TEXT,
    updated_at TIMESTAMPTZ,
    usuario_edicao_id TEXT,
    usuario_edicao_nome TEXT,
    historico_edicoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices essenciais para consultas velozes e relatórios
CREATE INDEX IF NOT EXISTS idx_documentos_numero ON public.documentos(numero);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON public.documentos(status);
CREATE INDEX IF NOT EXISTS idx_documentos_emissora ON public.documentos(empresa_emissora_id);
CREATE INDEX IF NOT EXISTS idx_documentos_data ON public.documentos(data_emissao);

-- 4. Tabela de Modelos de Despesas Pré-configurados (RDC)
CREATE TABLE IF NOT EXISTS public.modelos_despesa (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    linha_gasto TEXT NOT NULL,
    local_partida_padrao TEXT,
    destino_padrao TEXT,
    setor_funcao_padrao TEXT,
    objetivo_padrao TEXT,
    valor_adiantamento_sugerido NUMERIC(12, 2),
    nome_banco_padrao TEXT,
    agencia_padrao TEXT,
    conta_padrao TEXT,
    tipo_conta_padrao TEXT,
    chave_pix_padrao TEXT,
    diretoria_direta_padrao TEXT,
    contabil_financeiro_padrao TEXT,
    itens_padrao JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 5. Tabela de Configurações Gerais do Sistema e Contadores Globais
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id TEXT PRIMARY KEY, -- 'global'
    config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- Permitindo leitura e escrita para operações da aplicação via API / Service Role
-- ==============================================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas públicas ou autenticadas via API do sistema
DROP POLICY IF EXISTS "Permitir leitura total para usuários autorizados" ON public.empresas;
CREATE POLICY "Permitir leitura total para usuários autorizados" ON public.empresas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escrita total para API" ON public.empresas;
CREATE POLICY "Permitir escrita total para API" ON public.empresas FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura de usuarios para API" ON public.usuarios;
CREATE POLICY "Permitir leitura de usuarios para API" ON public.usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escrita de usuarios para API" ON public.usuarios;
CREATE POLICY "Permitir escrita de usuarios para API" ON public.usuarios FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura de documentos" ON public.documentos;
CREATE POLICY "Permitir leitura de documentos" ON public.documentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir emissao e edicao de documentos" ON public.documentos;
CREATE POLICY "Permitir emissao e edicao de documentos" ON public.documentos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir modelos de despesa" ON public.modelos_despesa;
CREATE POLICY "Permitir modelos de despesa" ON public.modelos_despesa FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir configuracoes" ON public.configuracoes;
CREATE POLICY "Permitir configuracoes" ON public.configuracoes FOR ALL USING (true);
