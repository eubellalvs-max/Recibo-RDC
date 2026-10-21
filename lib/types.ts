export type UserRole = 'admin' | 'emissor';

export type UserStatus = 'ativo' | 'inativo';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  senha: string;
  email: string;
  perfil: UserRole;
  empresa_id?: string;
  empresas_permitidas?: string[]; // IDs de empresas autorizadas para emissão
  status: UserStatus;
  created_at: string;
}

export type TipoEmpresa = 'emissora' | 'destinataria' | 'ambas';

export type StatusEmpresa = 'ativa' | 'inativa';

export type TipoPessoa = 'PJ' | 'PF';

export interface Empresa {
  id: string;
  tipo_pessoa?: TipoPessoa; // 'PJ' (Pessoa Jurídica) ou 'PF' (Pessoa Física)
  razao_social: string; // Razão Social se PJ ou Nome Completo se PF
  nome_fantasia: string; // Nome Fantasia se PJ ou Apelido/Nome Social se PF
  cnpj: string; // CNPJ (14 dígitos) ou CPF (11 dígitos) com máscara
  cpf?: string; // CPF espelhado quando tipo_pessoa === 'PF'
  rg?: string; // RG opcional para PF
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
  tipo: TipoEmpresa;
  status: StatusEmpresa;
  excluida_logica?: boolean; // Marcação de inativação/exclusão lógica para proteger histórico fiscal
  logo_url?: string; // Logo da empresa (Data URL base64 ou URL de imagem)
  proximo_recibo_num?: number; // Próximo sequencial individual de recibos para este fornecedor (inicia em 1)
  created_at: string;
}

export type TipoDocumento = 'recibo' | 'rdc' | 'recibo_medico';

export type StatusDocumento = 'emitido' | 'cancelado';

export type NaturezaGastoId = number;

export interface TipoGastoConfig {
  id: string;
  codigo: number; // Ex: 1, 2, 3...
  nome: string; // Ex: "Alimentação", "Combustível", "Condução"
  descricao?: string;
}

export interface TipoDocConfig {
  id: string;
  codigo: string; // Ex: 'Rec', 'Nf', 'CF', 'Fat'
  nome: string; // Ex: 'Recibo', 'Nota Fiscal', 'Cupom Fiscal'
  descricao?: string;
}

export interface DadosReciboMedico {
  // Dados do Pagador
  pagador_nome: string;
  pagador_documento: string; // CPF ou CNPJ
  pagador_telefone?: string;
  pagador_endereco?: string;

  // Dados do Paciente
  paciente_nome: string;
  paciente_cpf: string;
  paciente_telefone?: string;
  paciente_endereco?: string;

  // Detalhes do Atendimento
  servico_prestado: string;
  medico_assistente: string;
  crm: string;
  data_atendimento: string; // YYYY-MM-DD ou DD/MM/AAAA
  forma_pagamento: string; // Pix, Dinheiro, Cartão de Crédito, Cartão de Débito, Transferência

  // Local e Data
  cidade: string;
  uf: string;
}

export interface ItemGastoRdc {
  id: string;
  data?: string; // Data individual do dia de cada despesa (ex: YYYY-MM-DD)
  tipo_gasto: number; // Código do tipo de gasto (1, 2, 3, etc.)
  tipo_doc: string; // Sigla/código do tipo de documento ('Rec', 'Nf', etc.)
  descricao: string; // Fornecedor - observação das despesas - número documento
  valor: number;
}

export interface ItemModeloDespesa {
  id: string;
  data?: string; // Data da despesa
  tipo_gasto: number;
  tipo_doc: string;
  descricao: string;
  valor: number;
}

export interface ModeloDespesa {
  id: string;
  nome: string; // Ex: 'Viagem Técnica e Auditoria Institucional'
  descricao?: string;
  linha_gasto: 'viagem' | 'corporativa' | 'ambas';
  local_partida_padrao?: string;
  destino_padrao?: string;
  setor_funcao_padrao?: string;
  objetivo_padrao?: string;
  valor_adiantamento_sugerido?: number;
  nome_banco_padrao?: string;
  agencia_padrao?: string;
  conta_padrao?: string;
  tipo_conta_padrao?: string;
  chave_pix_padrao?: string;
  diretoria_direta_padrao?: string;
  contabil_financeiro_padrao?: string;
  itens_padrao: ItemModeloDespesa[];
  created_at: string;
  updated_at?: string;
}

export interface DadosRdc {
  // Modelo de Despesa de Origem
  modelo_despesa_id?: string;
  modelo_despesa_nome?: string;

  // Linha de despesa / gastos
  linha_gasto?: 'viagem' | 'corporativa' | 'ambas'; // Viagem ou Despesas Corporativas

  // Informações do Solicitante (Viagem ou Despesas Corporativas)
  data_pedido: string;
  numero_pedido: string;
  local_partida: string;
  destino: string;
  nome_solicitante: string;
  cpf_solicitante: string;
  setor_funcao: string;
  objetivo_viagem: string;

  // Informações bancária e financeira
  valor_solicitado: number; // Valor solicitado de adiantamento
  nome_banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  chave_pix: string;

  // Descrição dos gastos
  data_entrega_rdc: string;
  itens: ItemGastoRdc[];

  // Totais calculados
  total_despesas: number;
  valor_adiantamento: number;
  saldo_devolucao_ressarcimento: number; // Saldo negativo, a receber. Saldo positivo, devolver
  valor_ressarcir_solicitante: number; // Valor a ressarcir na conta do solicitante

  // Assinaturas
  assinatura_profissional?: string;
  diretoria_direta?: string;
  contabil_financeiro?: string;
}

export interface Documento {
  id: string;
  numero: string; // Ex: "000125/2026"
  numero_sequencial: number;
  tipo: TipoDocumento;
  empresa_emissora_id: string;
  empresa_destinataria_id: string;
  valor: number;
  valor_extenso: string;
  referente: string;
  competencia?: string; // Ex: "Setembro / 2026"
  data_emissao: string; // YYYY-MM-DD
  cidade_emissao: string; // Ex: "Brasília/DF"
  observacoes?: string;
  usuario_id: string;
  usuario_nome?: string;
  status: StatusDocumento;
  created_at: string;
  logo_url?: string; // Logo específico da empresa emissora vinculado ao documento
  rdc_detalhes?: DadosRdc; // Dados estruturados da RDC oficial
  recibo_medico_detalhes?: DadosReciboMedico; // Dados específicos do Recibo Médico
  data_cancelamento?: string; // Data ISO de quando o documento foi cancelado
  usuario_cancelamento_id?: string; // ID do usuário que efetuou o cancelamento
  usuario_cancelamento_nome?: string; // Nome do usuário que cancelou
  motivo_cancelamento?: string; // Justificativa obrigatória do cancelamento
  updated_at?: string; // Data ISO da última alteração/edição
  usuario_edicao_id?: string; // ID do usuário que realizou a última edição
  usuario_edicao_nome?: string; // Nome do usuário que realizou a última edição
  historico_edicoes?: {
    data: string;
    usuario_nome: string;
    detalhes?: string;
  }[];
}

export interface SistemaConfig {
  nome_organizacao: string; // Ex: "ABEAS - Associação Brasileira de Educação Agrícola Superior"
  sigla_organizacao: string; // Ex: "ABEAS"
  cidade_padrao: string; // Ex: "Brasília/DF"
  ano_corrente: number;
  proximo_recibo_num: number;
  proximo_rdc_num: number;
  proximo_recibo_medico_num?: number; // Próximo sequencial para recibo médico (Ex: 1 -> 001/2026)
  incluir_segunda_via: boolean;
  mensagem_rodape: string;
  tipos_gasto?: TipoGastoConfig[]; // Tipos / natureza de gastos configuráveis da RDC
  tipos_doc?: TipoDocConfig[]; // Tipos de documento configuráveis da RDC
  numeracao_fornecedores?: Record<string, number>; // Controle de numeração sequencial independente por fornecedor (empresa_id -> próximo_número)
}
