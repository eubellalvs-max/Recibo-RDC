import {
  Empresa,
  Usuario,
  Documento,
  SistemaConfig,
  TipoDocumento,
  DadosRdc,
  DadosReciboMedico,
  TipoGastoConfig,
  TipoDocConfig,
  ModeloDespesa,
} from './types';
import { valorPorExtenso } from './extenso';

export const ABEAS_FIXA = {
  razao_social: 'ABEAS - Associação Brasileira de Entidades de Assistência Social',
  cnpj: '04.547.278/0005-68',
  texto_declaracao:
    'A empresa ABEAS - Associação Brasileira de Entidades de Assistência Social, inscrita no CNPJ sob o nº 04.547.278/0005-68, declara que recebeu de:',
  texto_final:
    'Para maior clareza e para os devidos fins de direito, firmamos o presente recibo.',
  cidade_padrao: 'Itapuranga',
  uf_padrao: 'GO',
};

const STORAGE_KEYS = {
  USUARIOS: 'recibos_rdc_usuarios_v1',
  EMPRESAS: 'recibos_rdc_empresas_v1',
  DOCUMENTOS: 'recibos_rdc_documentos_v1',
  CONFIG: 'recibos_rdc_config_v1',
  CURRENT_USER: 'recibos_rdc_current_user_v1',
  MODELOS_DESPESA: 'recibos_rdc_modelos_despesa_v1',
};

export const DEFAULT_TIPOS_GASTO: TipoGastoConfig[] = [
  { id: 'tg-1', codigo: 1, nome: 'Alimentação', descricao: 'Despesas com refeições, almoço, jantar e lanches' },
  { id: 'tg-2', codigo: 2, nome: 'Combustível', descricao: 'Abastecimento de veículos oficiais ou locados' },
  { id: 'tg-3', codigo: 3, nome: 'Condução', descricao: 'Táxi, Uber, 99, transporte público e estacionamento' },
  { id: 'tg-4', codigo: 4, nome: 'Hospedagem', descricao: 'Diárias de hotel, pousada e taxas de turismo' },
  { id: 'tg-5', codigo: 5, nome: 'Passagens', descricao: 'Passagens aéreas, terrestres e taxas de embarque' },
  { id: 'tg-6', codigo: 6, nome: 'Outros gastos', descricao: 'Material de escritório, cópias, encadernações e taxas diversas' },
];

export const DEFAULT_TIPOS_DOC: TipoDocConfig[] = [
  { id: 'td-1', codigo: 'Rec', nome: 'Recibo', descricao: 'Recibo de pagamento ou quitação' },
  { id: 'td-2', codigo: 'NF', nome: 'Nota Fiscal', descricao: 'Nota fiscal eletrônica (NFe, NFCe ou NFSe)' },
  { id: 'td-3', codigo: 'CF', nome: 'Cupom Fiscal', descricao: 'Cupom fiscal / SAT' },
];

export const INITIAL_CONFIG: SistemaConfig = {
  nome_organizacao: 'ABEAS - Associação Brasileira de Educação Agrícola Superior',
  sigla_organizacao: 'ABEAS',
  cidade_padrao: 'Brasília/DF',
  ano_corrente: 2026,
  proximo_recibo_num: 126,
  proximo_rdc_num: 125,
  proximo_recibo_medico_num: 2,
  incluir_segunda_via: true,
  mensagem_rodape: 'Documento emitido eletronicamente pelo Sistema Oficial de Recibos e RDC.',
  tipos_gasto: DEFAULT_TIPOS_GASTO,
  tipos_doc: DEFAULT_TIPOS_DOC,
  numeracao_fornecedores: {
    'emp-2': 126, // Alpha Tech possui doc-125 emitido
  },
};

export const INITIAL_EMPRESAS: Empresa[] = [
  {
    id: 'emp-abeas-medico',
    razao_social: 'ABEAS - Associação Brasileira de Entidades de Assistência Social',
    nome_fantasia: 'ABEAS - Assistência Social',
    cnpj: '04.547.278/0005-68',
    inscricao_estadual: 'ISENTO',
    inscricao_municipal: 'ISENTO',
    endereco: 'Rua das Flores',
    numero: '100',
    complemento: 'Unidade de Atendimento',
    bairro: 'Centro',
    cidade: 'Itapuranga',
    uf: 'GO',
    cep: '76680-000',
    email: 'atendimento@abeas.org.br',
    telefone: '(62) 3312-1000',
    tipo: 'ambas',
    status: 'ativa',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'emp-1',
    razao_social: 'ABEAS - Associação Brasileira de Educação Agrícola Superior',
    nome_fantasia: 'ABEAS',
    cnpj: '00.334.821/0001-44',
    inscricao_estadual: 'ISENTO',
    inscricao_municipal: '07.123.456/001-90',
    endereco: 'SCS Quadra 04, Bloco A, Edifício Planalto',
    numero: '120',
    complemento: 'Salas 501 a 504',
    bairro: 'Asa Sul',
    cidade: 'Brasília',
    uf: 'DF',
    cep: '70304-900',
    email: 'financeiro@abeas.org.br',
    telefone: '(61) 3321-4500',
    tipo: 'ambas',
    status: 'ativa',
    created_at: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'emp-2',
    razao_social: 'Alpha Tech Soluções e Serviços em TI Ltda',
    nome_fantasia: 'Alpha Tech',
    cnpj: '14.283.910/0001-52',
    inscricao_estadual: '112.334.455.667',
    inscricao_municipal: '987.654-3',
    endereco: 'Avenida Paulista',
    numero: '1842',
    complemento: '14º Andar - Cj 142',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-200',
    email: 'contato@alphatech.com.br',
    telefone: '(11) 3145-8800',
    tipo: 'emissora',
    status: 'ativa',
    created_at: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'emp-3',
    razao_social: 'Condomínio do Edifício Solar das Flores',
    nome_fantasia: 'Edifício Solar das Flores',
    cnpj: '22.849.123/0001-90',
    inscricao_estadual: 'ISENTO',
    inscricao_municipal: '334.889-1',
    endereco: 'SQN 214, Bloco K',
    numero: 'S/N',
    complemento: 'Administração Predial',
    bairro: 'Asa Norte',
    cidade: 'Brasília',
    uf: 'DF',
    cep: '70873-110',
    email: 'sindico@solardasflores.com.br',
    telefone: '(61) 3447-9090',
    tipo: 'emissora',
    status: 'ativa',
    created_at: '2026-02-01T11:00:00.000Z',
  },
  {
    id: 'emp-4',
    razao_social: 'Construtora e Incorporadora Metrópole S.A.',
    nome_fantasia: 'Metrópole Engenharia',
    cnpj: '03.112.445/0001-08',
    inscricao_estadual: '87.654.321',
    inscricao_municipal: '554.321-0',
    endereco: 'Avenida Rio Branco',
    numero: '156',
    complemento: '28º andar',
    bairro: 'Centro',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    cep: '20040-006',
    email: 'contabilidade@metropolecorp.com.br',
    telefone: '(21) 2533-7000',
    tipo: 'destinataria',
    status: 'ativa',
    created_at: '2026-02-10T14:15:00.000Z',
  },
  {
    id: 'emp-5',
    razao_social: 'Beta Logística e Transportes Integrados Ltda',
    nome_fantasia: 'Beta Logística',
    cnpj: '18.992.331/0001-77',
    inscricao_estadual: '908.123.456-78',
    inscricao_municipal: '112.990-4',
    endereco: 'Rua Marechal Deodoro',
    numero: '630',
    complemento: 'Conjunto 802',
    bairro: 'Centro',
    cidade: 'Curitiba',
    uf: 'PR',
    cep: '80010-010',
    email: 'financeiro@betalog.com.br',
    telefone: '(41) 3022-4411',
    tipo: 'destinataria',
    status: 'ativa',
    created_at: '2026-02-18T16:00:00.000Z',
  },
  {
    id: 'emp-6',
    razao_social: 'Clínica Médica e Diagnóstico Santa Luzia Ltda',
    nome_fantasia: 'Clínica Santa Luzia',
    cnpj: '07.654.321/0001-19',
    inscricao_estadual: 'ISENTO',
    inscricao_municipal: '445.678-2',
    endereco: 'Avenida do Contorno',
    numero: '4520',
    complemento: 'Térreo e 1º andar',
    bairro: 'Funcionários',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cep: '30110-028',
    email: 'adm@santaluziaclinica.med.br',
    telefone: '(31) 3280-9900',
    tipo: 'ambas',
    status: 'ativa',
    created_at: '2026-02-25T10:00:00.000Z',
  },
  {
    id: 'emp-pf-1',
    tipo_pessoa: 'PF',
    razao_social: 'Roberto Moreira de Castro',
    nome_fantasia: 'Roberto Castro Consultoria',
    cnpj: '584.921.830-49',
    cpf: '584.921.830-49',
    rg: 'SSP/DF 2.458.910',
    endereco: 'Rua das Palmeiras, Quadra 12',
    numero: '45',
    bairro: 'Setor de Mansões',
    cidade: 'Brasília',
    uf: 'DF',
    cep: '71540-100',
    email: 'roberto.castro@gmail.com',
    telefone: '(61) 98112-3344',
    tipo: 'ambas',
    status: 'ativa',
    created_at: '2026-02-28T11:00:00.000Z',
  },
];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr-admin',
    nome: 'Carlos Eduardo Silva',
    login: 'admin',
    senha: '123',
    email: 'carlos.admin@abeas.org.br',
    perfil: 'admin',
    empresa_id: 'emp-1',
    status: 'ativo',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-lucas',
    nome: 'Lucas Oliveira',
    login: 'lucas',
    senha: '123',
    email: 'lucas.oliveira@abeas.org.br',
    perfil: 'emissor',
    empresa_id: 'emp-1',
    empresas_permitidas: ['emp-1', 'emp-2', 'emp-3', 'emp-6'],
    status: 'ativo',
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'usr-mariana',
    nome: 'Mariana Santos',
    login: 'mariana',
    senha: '123',
    email: 'mariana.santos@abeas.org.br',
    perfil: 'emissor',
    empresa_id: 'emp-2',
    empresas_permitidas: ['emp-2', 'emp-6'],
    status: 'ativo',
    created_at: '2026-02-01T00:00:00.000Z',
  },
];

export const INITIAL_DOCUMENTOS: Documento[] = [
  {
    id: 'doc-med-001',
    numero: '001/2026',
    numero_sequencial: 1,
    tipo: 'recibo_medico',
    empresa_emissora_id: 'emp-abeas-medico',
    empresa_destinataria_id: 'emp-1',
    valor: 350.0,
    valor_extenso: valorPorExtenso(350.0),
    referente:
      'A quantia supra de R$ 350,00 (trezentos e cinquenta reais), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):',
    data_emissao: '2026-09-02',
    cidade_emissao: 'Itapuranga - GO',
    observacoes: 'Consulta médica em ginecologia realizada na Unidade de Atendimento.',
    usuario_id: 'usr-lucas',
    usuario_nome: 'Lucas Oliveira',
    status: 'emitido',
    created_at: '2026-09-02T14:30:00.000Z',
    recibo_medico_detalhes: {
      pagador_nome: 'Mariana de Souza Silva',
      pagador_documento: '584.920.183-49',
      pagador_telefone: '(62) 99874-2211',
      pagador_endereco: 'Av. Bernardo Sayão, 450 - Centro, Itapuranga/GO',
      paciente_nome: 'Mariana de Souza Silva',
      paciente_cpf: '584.920.183-49',
      paciente_telefone: '(62) 99874-2211',
      paciente_endereco: 'Av. Bernardo Sayão, 450 - Centro, Itapuranga/GO',
      servico_prestado: 'Consulta médica em ginecologia',
      medico_assistente: 'Dr(a). Morena Ciclano de Tal',
      crm: '0000/GO',
      data_atendimento: '2026-09-02',
      forma_pagamento: 'Pix',
      cidade: 'Itapuranga',
      uf: 'GO',
    },
  },
  {
    id: 'doc-125',
    numero: '000125/2026',
    numero_sequencial: 125,
    tipo: 'recibo',
    empresa_emissora_id: 'emp-2',
    empresa_destinataria_id: 'emp-4',
    valor: 8500.00,
    valor_extenso: valorPorExtenso(8500.00),
    referente: 'Prestação de serviços especializados em auditoria de segurança da informação, migração de banco de dados e suporte técnico continuado.',
    data_emissao: '2026-09-25',
    cidade_emissao: 'Brasília/DF',
    observacoes: 'Pagamento efetuado via transferência bancária PIX conforme contrato nº 042/2026.',
    usuario_id: 'usr-lucas',
    usuario_nome: 'Lucas Oliveira',
    status: 'emitido',
    created_at: '2026-09-25T09:15:00.000Z',
  },
  {
    id: 'doc-124',
    numero: '000124/2026',
    numero_sequencial: 124,
    tipo: 'rdc',
    empresa_emissora_id: 'emp-1',
    empresa_destinataria_id: 'emp-2',
    valor: 2100.00,
    valor_extenso: valorPorExtenso(2100.00),
    referente: 'Prestação de Contas e Reembolso de Despesas Corporativa - Viagem técnica a São Paulo/SP para auditoria e vistoria in loco.',
    competencia: 'Setembro / 2026',
    data_emissao: '2026-09-25',
    cidade_emissao: 'Brasília/DF',
    observacoes: 'Prestação de contas aprovada. Saldo positivo de ressarcimento a favor do solicitante.',
    usuario_id: 'usr-lucas',
    usuario_nome: 'Lucas Oliveira',
    status: 'emitido',
    created_at: '2026-09-25T08:45:00.000Z',
    rdc_detalhes: {
      linha_gasto: 'viagem',
      data_pedido: '2026-09-20',
      numero_pedido: '2026/089',
      local_partida: 'Brasília/DF',
      destino: 'São Paulo/SP',
      nome_solicitante: 'Lucas Oliveira',
      cpf_solicitante: '021.488.921-34',
      setor_funcao: 'Auditor de Sistemas / TI',
      objetivo_viagem: 'Auditoria técnica e vistoria in loco de infraestrutura predial e contábil.',
      valor_solicitado: 2000.00,
      nome_banco: 'Banco do Brasil',
      agencia: '1820-1',
      conta: '45.890-2',
      tipo_conta: 'Conta Corrente',
      chave_pix: 'lucas.oliveira@abeas.org.br',
      data_entrega_rdc: '2026-09-25',
      itens: [
        {
          id: 'item-1',
          data: '2026-09-20',
          tipo_gasto: 1,
          tipo_doc: 'NF',
          descricao: 'Restaurante Sabor & Arte - Almoço de trabalho equipe - NF 1042',
          valor: 380.00,
        },
        {
          id: 'item-2',
          data: '2026-09-20',
          tipo_gasto: 2,
          tipo_doc: 'NF',
          descricao: 'Posto Petrobras Paulista - Abastecimento de veículo locado - NF 8892',
          valor: 320.00,
        },
        {
          id: 'item-3',
          data: '2026-09-21',
          tipo_gasto: 3,
          tipo_doc: 'Rec',
          descricao: 'Uber do Brasil - Deslocamentos Aeroporto x Hotel x Escritório',
          valor: 195.00,
        },
        {
          id: 'item-4',
          data: '2026-09-21',
          tipo_gasto: 4,
          tipo_doc: 'NF',
          descricao: 'Hotel Ibis Paulista - 2 diárias de hospedagem - NF 4421',
          valor: 850.00,
        },
        {
          id: 'item-5',
          data: '2026-09-22',
          tipo_gasto: 5,
          tipo_doc: 'Rec',
          descricao: 'GOL Linhas Aéreas - Taxa de embarque e despacho bagagem',
          valor: 210.00,
        },
        {
          id: 'item-6',
          data: '2026-09-22',
          tipo_gasto: 6,
          tipo_doc: 'Rec',
          descricao: 'Papelaria Express - Cópias de documentos e encadernações técnicas',
          valor: 145.00,
        },
      ],
      total_despesas: 2100.00,
      valor_adiantamento: 2000.00,
      saldo_devolucao_ressarcimento: -100.00,
      valor_ressarcir_solicitante: 100.00,
      assinatura_profissional: 'Lucas Oliveira',
      diretoria_direta: 'Carlos Eduardo Silva',
      contabil_financeiro: 'Setor Contábil / Financeiro ABEAS',
    },
  },
  {
    id: 'doc-123',
    numero: '000123/2026',
    numero_sequencial: 123,
    tipo: 'recibo',
    empresa_emissora_id: 'emp-1',
    empresa_destinataria_id: 'emp-6',
    valor: 1200.00,
    valor_extenso: valorPorExtenso(1200.00),
    referente: 'Taxa de inscrição institucional e fornecimento de material didático do Programa Nacional de Formação Continuada.',
    data_emissao: '2026-09-24',
    cidade_emissao: 'Brasília/DF',
    observacoes: 'Participação de 02 colaboradores da equipe de gestão.',
    usuario_id: 'usr-mariana',
    usuario_nome: 'Mariana Santos',
    status: 'emitido',
    created_at: '2026-09-24T14:20:00.000Z',
  },
  {
    id: 'doc-122',
    numero: '000122/2026',
    numero_sequencial: 122,
    tipo: 'recibo',
    empresa_emissora_id: 'emp-2',
    empresa_destinataria_id: 'emp-1',
    valor: 800.00,
    valor_extenso: valorPorExtenso(800.00),
    referente: 'Renovação anual de licenças de software e certificado digital SSL corporativo.',
    data_emissao: '2026-09-24',
    cidade_emissao: 'Brasília/DF',
    observacoes: 'Garantia e suporte inclusos pelo período de 12 meses.',
    usuario_id: 'usr-lucas',
    usuario_nome: 'Lucas Oliveira',
    status: 'emitido',
    created_at: '2026-09-24T10:10:00.000Z',
  },
];

export const INITIAL_MODELOS_DESPESA: ModeloDespesa[] = [
  {
    id: 'mod-viagem-auditoria',
    nome: 'Viagem Técnica e Auditoria Institucional',
    descricao: 'Modelo padrão para viagens de auditoria in loco, conferência documental e inspeções.',
    linha_gasto: 'viagem',
    local_partida_padrao: '',
    destino_padrao: 'São Paulo/SP',
    setor_funcao_padrao: 'Auditor de Sistemas / TI',
    objetivo_padrao: 'Auditoria técnica e vistoria in loco de infraestrutura predial e contábil.',
    valor_adiantamento_sugerido: 2000.0,
    nome_banco_padrao: 'Banco do Brasil',
    agencia_padrao: '1820-1',
    conta_padrao: '45.890-2',
    tipo_conta_padrao: 'Conta Corrente',
    chave_pix_padrao: '',
    diretoria_direta_padrao: '',
    contabil_financeiro_padrao: 'Setor Contábil / Financeiro ABEAS',
    itens_padrao: [
      { id: 'mod-item-1', tipo_gasto: 1, tipo_doc: 'NF', descricao: 'Restaurante Sabor & Arte - Almoço de trabalho equipe - NF 1042', valor: 380.0 },
      { id: 'mod-item-2', tipo_gasto: 2, tipo_doc: 'NF', descricao: 'Posto Petrobras Paulista - Abastecimento de veículo locado - NF 8892', valor: 320.0 },
      { id: 'mod-item-3', tipo_gasto: 3, tipo_doc: 'Rec', descricao: 'Uber do Brasil - Deslocamentos Aeroporto x Hotel x Escritório', valor: 195.0 },
      { id: 'mod-item-4', tipo_gasto: 4, tipo_doc: 'NF', descricao: 'Hotel Ibis Paulista - 2 diárias de hospedagem - NF 4421', valor: 850.0 },
      { id: 'mod-item-5', tipo_gasto: 5, tipo_doc: 'Rec', descricao: 'GOL Linhas Aéreas - Taxa de embarque e despacho bagagem', valor: 210.0 },
      { id: 'mod-item-6', tipo_gasto: 6, tipo_doc: 'Rec', descricao: 'Papelaria Express - Cópias de documentos e encadernações técnicas', valor: 145.0 },
    ],
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'mod-despesas-corporativas',
    nome: 'Despesas Administrativas & Operacionais Corporativas',
    descricao: 'Modelo para compras de expediente, cartório, suprimentos e serviços locais.',
    linha_gasto: 'corporativa',
    local_partida_padrao: 'Sede Central ABEAS',
    destino_padrao: 'Unidades e Departamentos Locais',
    setor_funcao_padrao: 'Administração & Logística Corporativa',
    objetivo_padrao: 'Suprimento de materiais de expediente, serviços de cartório e despesas correntes de escritório.',
    valor_adiantamento_sugerido: 1200.0,
    nome_banco_padrao: 'Caixa Econômica Federal',
    agencia_padrao: '0210',
    conta_padrao: '10982-3',
    tipo_conta_padrao: 'Conta Corrente',
    chave_pix_padrao: '',
    diretoria_direta_padrao: 'Diretoria Administrativa',
    contabil_financeiro_padrao: 'Controladoria Geral ABEAS',
    itens_padrao: [
      { id: 'mod-item-c1', tipo_gasto: 6, tipo_doc: 'NF', descricao: 'Kalunga Papelaria - Suprimento de toners, papéis A4 e pastas - NF 5541', valor: 420.0 },
      { id: 'mod-item-c2', tipo_gasto: 6, tipo_doc: 'Rec', descricao: '1º Cartório de Notas e Protestos - Reconhecimento de firma e autenticações', valor: 180.0 },
      { id: 'mod-item-c3', tipo_gasto: 6, tipo_doc: 'Rec', descricao: 'Correios Sedex - Envio de relatórios fiscais e malotes contábeis', valor: 150.0 },
      { id: 'mod-item-c4', tipo_gasto: 1, tipo_doc: 'NF', descricao: 'Cafeteria & Padaria Central - Coffee break para reunião de prestação de contas', valor: 250.0 },
    ],
    created_at: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'mod-representacao-social',
    nome: 'Visita Institucional e Representação Social',
    descricao: 'Modelo para visitas a conselhos municipais, entidades parceiras e encontros institucionais.',
    linha_gasto: 'ambas',
    local_partida_padrao: 'Brasília/DF',
    destino_padrao: 'Goiânia/GO',
    setor_funcao_padrao: 'Relações Institucionais e Diretoria',
    objetivo_padrao: 'Reunião com conselhos comunitários, entidades assistenciais parceiras e alinhamento de diretrizes.',
    valor_adiantamento_sugerido: 1500.0,
    nome_banco_padrao: 'Banco do Brasil',
    agencia_padrao: '1820-1',
    conta_padrao: '45.890-2',
    tipo_conta_padrao: 'Conta Corrente',
    chave_pix_padrao: '',
    diretoria_direta_padrao: 'Presidência / Diretoria Executiva',
    contabil_financeiro_padrao: 'Setor Contábil / Financeiro ABEAS',
    itens_padrao: [
      { id: 'mod-item-r1', tipo_gasto: 2, tipo_doc: 'NF', descricao: 'Auto Posto Alvorada - Abastecimento ida e volta Goiânia/DF - NF 7721', valor: 380.0 },
      { id: 'mod-item-r2', tipo_gasto: 1, tipo_doc: 'NF', descricao: 'Restaurante Piquiras - Almoço institucional com representação social - NF 3319', valor: 420.0 },
      { id: 'mod-item-r3', tipo_gasto: 4, tipo_doc: 'NF', descricao: 'Castro\'s Park Hotel - Diária de hospedagem representação - NF 9912', valor: 490.0 },
      { id: 'mod-item-r4', tipo_gasto: 6, tipo_doc: 'Rec', descricao: 'Pedágios Triunfo Concebra - Trecho Brasília x Goiânia ida e volta', valor: 64.0 },
    ],
    created_at: '2026-01-10T08:00:00.000Z',
  },
];

// Helper seguro para LocalStorage no Next.js (SSR safe)
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Erro ao ler ${key} do localStorage:`, e);
    return defaultValue;
  }
}

function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Erro ao salvar ${key} no localStorage:`, e);
  }
}

// Helper seguro para SessionStorage no Next.js (SSR safe) - expira ao fechar o navegador
function getSessionStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function setSessionStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`Erro ao salvar ${key} no sessionStorage:`, e);
  }
}

export const StorageService = {
  init() {
    if (typeof window === 'undefined') return;
    // Limpa chave legada no localStorage para garantir que nova abertura inicie sempre na tela de login
    window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    if (!window.localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
      setLocalStorageItem(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.EMPRESAS)) {
      setLocalStorageItem(STORAGE_KEYS.EMPRESAS, INITIAL_EMPRESAS);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.DOCUMENTOS)) {
      setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, INITIAL_DOCUMENTOS);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      setLocalStorageItem(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.MODELOS_DESPESA)) {
      setLocalStorageItem(STORAGE_KEYS.MODELOS_DESPESA, INITIAL_MODELOS_DESPESA);
    }
  },

  resetToDefault() {
    if (typeof window === 'undefined') return;
    setLocalStorageItem(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
    setLocalStorageItem(STORAGE_KEYS.EMPRESAS, INITIAL_EMPRESAS);
    setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, INITIAL_DOCUMENTOS);
    setLocalStorageItem(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
    setLocalStorageItem(STORAGE_KEYS.MODELOS_DESPESA, INITIAL_MODELOS_DESPESA);
  },

  // --- Usuários ---
  getUsuarios(): Usuario[] {
    return getLocalStorageItem<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  },

  getUsuarioById(id: string): Usuario | undefined {
    return this.getUsuarios().find((u) => u.id === id);
  },

  saveUsuario(usuario: Usuario): Usuario {
    const list = this.getUsuarios();
    const index = list.findIndex((u) => u.id === usuario.id);
    if (index >= 0) {
      list[index] = usuario;
    } else {
      list.unshift(usuario);
    }
    setLocalStorageItem(STORAGE_KEYS.USUARIOS, list);
    return usuario;
  },

  deleteUsuario(id: string): void {
    const list = this.getUsuarios().filter((u) => u.id !== id);
    setLocalStorageItem(STORAGE_KEYS.USUARIOS, list);
  },

  // --- Empresas ---
  getEmpresas(): Empresa[] {
    return getLocalStorageItem<Empresa[]>(STORAGE_KEYS.EMPRESAS, INITIAL_EMPRESAS);
  },

  getEmpresaById(id: string): Empresa | undefined {
    return this.getEmpresas().find((e) => e.id === id);
  },

  saveEmpresa(empresa: Empresa): Empresa {
    const list = this.getEmpresas();
    const index = list.findIndex((e) => e.id === empresa.id);

    // Se o próximo número não foi informado ou é inválido, preservar o existente ou calcular
    if (typeof empresa.proximo_recibo_num !== 'number' || empresa.proximo_recibo_num < 1) {
      if (index >= 0 && typeof list[index].proximo_recibo_num === 'number' && list[index].proximo_recibo_num >= 1) {
        empresa.proximo_recibo_num = list[index].proximo_recibo_num;
      } else {
        empresa.proximo_recibo_num = this.getProximoNumeroReciboFornecedor(empresa.id);
      }
    }

    if (index >= 0) {
      list[index] = empresa;
    } else {
      list.unshift(empresa);
    }
    setLocalStorageItem(STORAGE_KEYS.EMPRESAS, list);

    // Sincronizar com config.numeracao_fornecedores
    const config = this.getConfig();
    if (!config.numeracao_fornecedores) config.numeracao_fornecedores = {};
    config.numeracao_fornecedores[empresa.id] = empresa.proximo_recibo_num;
    this.saveConfig(config);

    return empresa;
  },

  verificarVinculosEmpresa(empresaId: string): {
    podeExcluirFisicamente: boolean;
    totalDocumentos: number;
    totalUsuarios: number;
    detalhes: string[];
  } {
    const docs = this.getDocumentos().filter(
      (d) => d.empresa_emissora_id === empresaId || d.empresa_destinataria_id === empresaId
    );
    const usuarios = this.getUsuarios().filter(
      (u) => u.empresas_permitidas && u.empresas_permitidas.includes(empresaId)
    );
    const detalhes: string[] = [];
    if (docs.length > 0) {
      detalhes.push(`${docs.length} documento(s) emitido(s) vinculado(s)`);
    }
    if (usuarios.length > 0) {
      detalhes.push(`${usuarios.length} emissor(es) com permissão autorizada`);
    }
    return {
      podeExcluirFisicamente: docs.length === 0,
      totalDocumentos: docs.length,
      totalUsuarios: usuarios.length,
      detalhes,
    };
  },

  excluirEmpresa(id: string): {
    sucesso: boolean;
    tipo: 'fisica' | 'logica';
    mensagem: string;
  } {
    const vinculos = this.verificarVinculosEmpresa(id);
    const empresas = this.getEmpresas();
    const emp = empresas.find((e) => e.id === id);
    if (!emp) {
      return { sucesso: false, tipo: 'fisica', mensagem: 'Empresa não encontrada no cadastro.' };
    }

    if (!vinculos.podeExcluirFisicamente) {
      // Exclusão lógica / inativação para proteger rastreabilidade e histórico fiscal
      const index = empresas.findIndex((e) => e.id === id);
      if (index >= 0) {
        empresas[index] = { ...emp, status: 'inativa', excluida_logica: true };
        setLocalStorageItem(STORAGE_KEYS.EMPRESAS, empresas);
      }
      return {
        sucesso: true,
        tipo: 'logica',
        mensagem: `A empresa "${emp.razao_social}" possui ${vinculos.totalDocumentos} documento(s) histórico(s) emitido(s). Para preservar a validade jurídica e contábil, ela foi inativada e removida das seleções de novas emissões.`,
      };
    } else {
      // Exclusão física permitida
      const novaLista = empresas.filter((e) => e.id !== id);
      setLocalStorageItem(STORAGE_KEYS.EMPRESAS, novaLista);
      return {
        sucesso: true,
        tipo: 'fisica',
        mensagem: `A empresa "${emp.razao_social}" foi excluída com sucesso do sistema.`,
      };
    }
  },

  // --- Modelos de Despesa (RDC) ---
  getModelosDespesa(): ModeloDespesa[] {
    return getLocalStorageItem<ModeloDespesa[]>(
      STORAGE_KEYS.MODELOS_DESPESA,
      INITIAL_MODELOS_DESPESA
    );
  },

  getModeloDespesaById(id: string): ModeloDespesa | undefined {
    return this.getModelosDespesa().find((m) => m.id === id);
  },

  saveModeloDespesa(modelo: ModeloDespesa): ModeloDespesa {
    const list = this.getModelosDespesa();
    const index = list.findIndex((m) => m.id === modelo.id);
    if (index >= 0) {
      list[index] = { ...modelo, updated_at: new Date().toISOString() };
    } else {
      list.push(modelo);
    }
    setLocalStorageItem(STORAGE_KEYS.MODELOS_DESPESA, list);
    return modelo;
  },

  deleteModeloDespesa(id: string): void {
    const list = this.getModelosDespesa().filter((m) => m.id !== id);
    setLocalStorageItem(STORAGE_KEYS.MODELOS_DESPESA, list);
  },

  // --- Documentos ---
  getDocumentos(): Documento[] {
    const docs = getLocalStorageItem<Documento[]>(STORAGE_KEYS.DOCUMENTOS, INITIAL_DOCUMENTOS);
    let mudou = false;
    docs.forEach((doc) => {
      if (doc.rdc_detalhes?.itens) {
        doc.rdc_detalhes.itens.forEach((it) => {
          if (it.tipo_doc === 'Nf') {
            it.tipo_doc = 'NF';
            mudou = true;
          }
          if (!it.data && (doc.rdc_detalhes?.data_entrega_rdc || doc.data_emissao)) {
            it.data = doc.rdc_detalhes?.data_entrega_rdc || doc.data_emissao;
            mudou = true;
          }
        });
      }
    });
    if (mudou && typeof window !== 'undefined') {
      setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, docs);
    }
    return docs;
  },

  getDocumentoById(id: string): Documento | undefined {
    return this.getDocumentos().find((d) => d.id === id);
  },

  getProximoNumeroReciboMedico(): string {
    const config = this.getConfig();
    const ano = config.ano_corrente || new Date().getFullYear();
    const seqNum = config.proximo_recibo_medico_num || 2;
    return `${String(seqNum).padStart(3, '0')}/${ano}`;
  },

  // --- Controle de Numeração Sequencial por Fornecedor (Recibos) ---
  getProximoNumeroReciboFornecedor(fornecedorId?: string): number {
    if (!fornecedorId) return 1;

    const docs = this.getDocumentos().filter(
      (d) => d.tipo === 'recibo' && d.empresa_emissora_id === fornecedorId
    );
    const numerosEmitidos = new Set(docs.map((d) => d.numero_sequencial || 0));

    let candidato = 1;
    // 1. Verificar mapa nas configurações do sistema
    const config = this.getConfig();
    if (config.numeracao_fornecedores && typeof config.numeracao_fornecedores[fornecedorId] === 'number') {
      const val = config.numeracao_fornecedores[fornecedorId];
      if (val >= 1) candidato = val;
    } else {
      // 2. Verificar campo no cadastro da empresa / fornecedor
      const empresas = this.getEmpresas();
      const emp = empresas.find((e) => e.id === fornecedorId);
      if (emp && typeof emp.proximo_recibo_num === 'number' && emp.proximo_recibo_num >= 1) {
        candidato = emp.proximo_recibo_num;
      } else if (docs.length > 0) {
        // 3. Caso não esteja configurado, calcular baseado no maior número já emitido
        const maxSeq = Math.max(...docs.map((d) => d.numero_sequencial || 0), 0);
        candidato = maxSeq + 1;
      } else {
        candidato = 1;
      }
    }

    // Regra mandatória: Evitar duplicidade de número dentro do mesmo fornecedor
    while (numerosEmitidos.has(candidato)) {
      candidato++;
    }

    return Math.max(1, candidato);
  },

  getUltimoNumeroReciboFornecedor(fornecedorId?: string): number {
    if (!fornecedorId) return 0;
    const docs = this.getDocumentos().filter(
      (d) => d.tipo === 'recibo' && d.empresa_emissora_id === fornecedorId
    );
    if (docs.length > 0) {
      return Math.max(...docs.map((d) => d.numero_sequencial || 0), 0);
    }
    const prox = this.getProximoNumeroReciboFornecedor(fornecedorId);
    if (prox > 1) {
      return prox - 1;
    }
    return 0;
  },

  setProximoNumeroReciboFornecedor(fornecedorId: string, proximoNumero: number): void {
    if (!fornecedorId) return;
    const novoValor = Math.max(1, Math.floor(proximoNumero) || 1);

    // 1. Atualizar no config
    const config = this.getConfig();
    if (!config.numeracao_fornecedores) {
      config.numeracao_fornecedores = {};
    }
    config.numeracao_fornecedores[fornecedorId] = novoValor;
    this.saveConfig(config);

    // 2. Atualizar no cadastro da empresa
    const empresas = this.getEmpresas();
    const empIndex = empresas.findIndex((e) => e.id === fornecedorId);
    if (empIndex >= 0) {
      empresas[empIndex].proximo_recibo_num = novoValor;
      setLocalStorageItem(STORAGE_KEYS.EMPRESAS, empresas);
    }
  },

  formatarNumeroRecibo(seqNum: number, ano?: number): string {
    const config = this.getConfig();
    const anoRef = ano || config.ano_corrente || new Date().getFullYear();
    return `${String(seqNum).padStart(3, '0')}/${anoRef}`;
  },

  emitirDocumento(params: {
    tipo: TipoDocumento;
    empresa_emissora_id: string;
    empresa_destinataria_id: string;
    valor: number;
    referente: string;
    competencia?: string;
    data_emissao: string;
    cidade_emissao?: string;
    observacoes?: string;
    usuario: Usuario;
    logo_url?: string;
    rdc_detalhes?: DadosRdc;
    recibo_medico_detalhes?: DadosReciboMedico;
  }): Documento {
    const config = this.getConfig();
    const ano = config.ano_corrente || new Date().getFullYear();

    // Sequenciador automático independente por tipo e por fornecedor
    let seqNum = 1;
    let numeroFormatado = '';

    if (params.tipo === 'recibo_medico') {
      seqNum = config.proximo_recibo_medico_num || 2;
      config.proximo_recibo_medico_num = seqNum + 1;
      this.saveConfig(config);
      numeroFormatado = `${String(seqNum).padStart(3, '0')}/${ano}`;
    } else if (params.tipo === 'recibo') {
      const fornecedorId = params.empresa_emissora_id;
      seqNum = this.getProximoNumeroReciboFornecedor(fornecedorId);
      this.setProximoNumeroReciboFornecedor(fornecedorId, seqNum + 1);
      numeroFormatado = this.formatarNumeroRecibo(seqNum, ano);
    } else {
      seqNum = config.proximo_rdc_num;
      config.proximo_rdc_num += 1;
      this.saveConfig(config);
      numeroFormatado = `${String(seqNum).padStart(6, '0')}/${ano}`;
    }

    const extenso = valorPorExtenso(params.valor);

    const novoDoc: Documento = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      numero: numeroFormatado,
      numero_sequencial: seqNum,
      tipo: params.tipo,
      empresa_emissora_id: params.empresa_emissora_id,
      empresa_destinataria_id: params.empresa_destinataria_id,
      valor: params.valor,
      valor_extenso: extenso,
      referente: params.referente,
      competencia: params.competencia,
      data_emissao: params.data_emissao,
      cidade_emissao: params.cidade_emissao || config.cidade_padrao || 'Itapuranga - GO',
      observacoes: params.observacoes,
      usuario_id: params.usuario.id,
      usuario_nome: params.usuario.nome,
      status: 'emitido',
      created_at: new Date().toISOString(),
      logo_url: params.logo_url,
      rdc_detalhes: params.rdc_detalhes,
      recibo_medico_detalhes: params.recibo_medico_detalhes,
    };

    const docs = this.getDocumentos();
    docs.unshift(novoDoc);
    setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, docs);

    return novoDoc;
  },

  cancelarDocumento(id: string, usuario?: Usuario, motivo?: string): Documento | undefined {
    const docs = this.getDocumentos();
    const item = docs.find((d) => d.id === id);
    if (item) {
      item.status = 'cancelado';
      item.data_cancelamento = new Date().toISOString();
      item.usuario_cancelamento_id = usuario?.id || 'sistema';
      item.usuario_cancelamento_nome = usuario?.nome || 'Operador do Sistema';
      item.motivo_cancelamento = motivo?.trim() || 'Cancelamento solicitado e confirmado no sistema.';
      setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, docs);
      return item;
    }
    return undefined;
  },

  updateDocumento(docAtualizado: Documento, usuario?: Usuario, detalhesAlteracao?: string): Documento {
    const docs = this.getDocumentos();
    const index = docs.findIndex((d) => d.id === docAtualizado.id);
    if (index >= 0) {
      const docOriginal = docs[index];

      // REGRA CRÍTICA: Manter o mesmo número do documento original, sem alterar sequencial nem contadores
      docAtualizado.numero = docOriginal.numero;
      docAtualizado.numero_sequencial = docOriginal.numero_sequencial;
      docAtualizado.tipo = docOriginal.tipo;
      docAtualizado.created_at = docOriginal.created_at;

      // Metadados de Auditoria da Edição
      docAtualizado.updated_at = new Date().toISOString();
      if (usuario) {
        docAtualizado.usuario_edicao_id = usuario.id;
        docAtualizado.usuario_edicao_nome = usuario.nome;
      }
      const historico = docOriginal.historico_edicoes ? [...docOriginal.historico_edicoes] : [];
      historico.unshift({
        data: new Date().toISOString(),
        usuario_nome: usuario?.nome || 'Operador do Sistema',
        detalhes: detalhesAlteracao || 'Dados do documento corrigidos/atualizados com sucesso.',
      });
      docAtualizado.historico_edicoes = historico;

      docs[index] = docAtualizado;
      setLocalStorageItem(STORAGE_KEYS.DOCUMENTOS, docs);
      return docAtualizado;
    }
    throw new Error('Documento não encontrado para atualização.');
  },

  // --- Configurações ---
  getConfig(): SistemaConfig {
    const cfg = getLocalStorageItem<SistemaConfig>(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
    let mudou = false;
    if (cfg.proximo_recibo_medico_num === undefined) {
      cfg.proximo_recibo_medico_num = 2;
      mudou = true;
    }
    if (!cfg.tipos_gasto || cfg.tipos_gasto.length === 0) {
      cfg.tipos_gasto = [...DEFAULT_TIPOS_GASTO];
      mudou = true;
    }
    if (!cfg.tipos_doc || cfg.tipos_doc.length === 0) {
      cfg.tipos_doc = [...DEFAULT_TIPOS_DOC];
      mudou = true;
    } else {
      let docMigrado = false;
      cfg.tipos_doc = cfg.tipos_doc.map((td) => {
        if (td.codigo === 'Nf') {
          docMigrado = true;
          return { ...td, codigo: 'NF' };
        }
        return td;
      });
      if (docMigrado) mudou = true;
    }
    if (mudou && typeof window !== 'undefined') {
      setLocalStorageItem(STORAGE_KEYS.CONFIG, cfg);
    }
    return cfg;
  },

  saveConfig(config: SistemaConfig): SistemaConfig {
    if (!config.tipos_gasto || config.tipos_gasto.length === 0) {
      config.tipos_gasto = [...DEFAULT_TIPOS_GASTO];
    }
    if (!config.tipos_doc || config.tipos_doc.length === 0) {
      config.tipos_doc = [...DEFAULT_TIPOS_DOC];
    }
    setLocalStorageItem(STORAGE_KEYS.CONFIG, config);
    return config;
  },

  // --- Tipos de Gasto na RDC ---
  getTiposGasto(): TipoGastoConfig[] {
    return this.getConfig().tipos_gasto || DEFAULT_TIPOS_GASTO;
  },

  saveTipoGasto(item: TipoGastoConfig): TipoGastoConfig[] {
    const config = this.getConfig();
    const list = config.tipos_gasto ? [...config.tipos_gasto] : [...DEFAULT_TIPOS_GASTO];
    const index = list.findIndex((tg) => tg.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    // Ordenar por código crescente
    list.sort((a, b) => a.codigo - b.codigo);
    config.tipos_gasto = list;
    this.saveConfig(config);
    return list;
  },

  deleteTipoGasto(id: string): TipoGastoConfig[] {
    const config = this.getConfig();
    const list = (config.tipos_gasto || DEFAULT_TIPOS_GASTO).filter((tg) => tg.id !== id);
    config.tipos_gasto = list;
    this.saveConfig(config);
    return list;
  },

  resetTiposGastoPadrao(): TipoGastoConfig[] {
    const config = this.getConfig();
    config.tipos_gasto = [...DEFAULT_TIPOS_GASTO];
    this.saveConfig(config);
    return config.tipos_gasto;
  },

  // --- Tipos de Doc na RDC ---
  getTiposDoc(): TipoDocConfig[] {
    return this.getConfig().tipos_doc || DEFAULT_TIPOS_DOC;
  },

  saveTipoDoc(item: TipoDocConfig): TipoDocConfig[] {
    const config = this.getConfig();
    const list = config.tipos_doc ? [...config.tipos_doc] : [...DEFAULT_TIPOS_DOC];
    const index = list.findIndex((td) => td.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    config.tipos_doc = list;
    this.saveConfig(config);
    return list;
  },

  deleteTipoDoc(id: string): TipoDocConfig[] {
    const config = this.getConfig();
    const list = (config.tipos_doc || DEFAULT_TIPOS_DOC).filter((td) => td.id !== id);
    config.tipos_doc = list;
    this.saveConfig(config);
    return list;
  },

  resetTiposDocPadrao(): TipoDocConfig[] {
    const config = this.getConfig();
    config.tipos_doc = [...DEFAULT_TIPOS_DOC];
    this.saveConfig(config);
    return config.tipos_doc;
  },

  resetModelosDespesaPadrao(): ModeloDespesa[] {
    setLocalStorageItem(STORAGE_KEYS.MODELOS_DESPESA, INITIAL_MODELOS_DESPESA);
    return INITIAL_MODELOS_DESPESA;
  },

  // --- Sessão Atual (armazenada em sessionStorage para exigir login ao fechar e reabrir o navegador) ---
  getCurrentUser(): Usuario | null {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    return getSessionStorageItem<Usuario | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: Usuario | null): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    setSessionStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  },
};
