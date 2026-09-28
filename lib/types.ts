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

export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
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
  logo_url?: string; // Logo da empresa (Data URL base64 ou URL de imagem)
  created_at: string;
}

export type TipoDocumento = 'recibo' | 'rdc';

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

export interface ItemGastoRdc {
  id: string;
  tipo_gasto: number; // Código do tipo de gasto (1, 2, 3, etc.)
  tipo_doc: string; // Sigla/código do tipo de documento ('Rec', 'Nf', etc.)
  descricao: string; // Fornecedor - observação das despesas - número documento
  valor: number;
}

export interface DadosRdc {
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
}

export interface SistemaConfig {
  nome_organizacao: string; // Ex: "ABEAS - Associação Brasileira de Educação Agrícola Superior"
  sigla_organizacao: string; // Ex: "ABEAS"
  cidade_padrao: string; // Ex: "Brasília/DF"
  ano_corrente: number;
  proximo_recibo_num: number;
  proximo_rdc_num: number;
  incluir_segunda_via: boolean;
  mensagem_rodape: string;
  tipos_gasto?: TipoGastoConfig[]; // Tipos / natureza de gastos configuráveis da RDC
  tipos_doc?: TipoDocConfig[]; // Tipos de documento configuráveis da RDC
}
