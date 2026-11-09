import * as XLSX from 'xlsx';
import { Documento } from './types';
import { formatarMoeda, formatarDataBr } from './masks';

export type CategoriaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'OUTRAS';

export interface DetalheModalidadePagamento {
  categoria: CategoriaPagamento;
  nomeExibicao: string;
  valor: number;
}

export interface ItemRelatorioAnalitico {
  documentoId: string;
  numero: string;
  dataEmissao: string; // YYYY-MM-DD
  pacienteNome: string;
  pacienteCpf: string;
  pagadorNome: string;
  pagadorDocumento: string;
  servicoPrestado: string;
  formaPagamentoOriginal: string;
  modalidades: DetalheModalidadePagamento[];
  valorTotal: number;
  emissorNome: string;
  emissorId: string;
  empresaEmissoraId: string;
  empresaNome?: string;
  status: 'emitido' | 'cancelado';
  motivoCancelamento?: string;
}

export interface ResumoFinanceiro {
  totalPix: number;
  totalDinheiro: number;
  totalCartaoCredito: number;
  totalCartaoDebito: number;
  totalOutras: number;
  quantidadeEmitidos: number;
  quantidadeCancelados: number;
  valorTotalGeral: number;
  valorMedioPorRecibo: number;
}

/**
 * Classifica uma string descritiva em uma categoria padrão de pagamento
 */
export function classificaModalidade(texto: string): { categoria: CategoriaPagamento; nome: string } {
  const t = texto.trim().toLowerCase();
  if (t.includes('pix')) {
    return { categoria: 'PIX', nome: 'PIX' };
  }
  if (t.includes('dinheiro') || t.includes('especie') || t.includes('espécie')) {
    return { categoria: 'DINHEIRO', nome: 'Dinheiro' };
  }
  if (t.includes('crédito') || t.includes('credito')) {
    return { categoria: 'CARTAO_CREDITO', nome: 'Cartão de Crédito' };
  }
  if (t.includes('débito') || t.includes('debito')) {
    return { categoria: 'CARTAO_DEBITO', nome: 'Cartão de Débito' };
  }
  if (t.includes('transferência') || t.includes('transferencia') || t.includes('ted') || t.includes('doc')) {
    return { categoria: 'OUTRAS', nome: 'Transferência' };
  }
  return { categoria: 'OUTRAS', nome: texto.trim() || 'Outras' };
}

/**
 * Decompõe a string de forma de pagamento de um recibo médico.
 * Quando o recibo possui pagamentos divididos, calcula os valores exatos de cada
 * modalidade sem duplicar ou alterar o valor total do recibo na soma geral.
 */
export function decomporFormasPagamento(
  formaPagamento: string | undefined,
  valorTotal: number
): DetalheModalidadePagamento[] {
  const total = Number(valorTotal) || 0;
  if (!formaPagamento || !formaPagamento.trim()) {
    return [{ categoria: 'PIX', nomeExibicao: 'Pix', valor: total }];
  }

  const str = formaPagamento.trim();

  // 1. Tentar detectar padrão de múltiplas formas com valores explícitos:
  // Ex: "Pix: R$ 150,00 / Dinheiro: R$ 50,00" ou "Pix: 150,00, Cartão: 50,00"
  const regexItemComValor = /([A-Za-zÀ-ú\s]+?)(?:[:\-–\s(]+(?:R\$\s*)?([\d.,]+)(?:\))?)/gi;
  const matches: { nome: string; valor: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexItemComValor.exec(str)) !== null) {
    const rawNome = match[1].trim();
    const rawVal = match[2].trim();
    if (rawNome && rawVal) {
      let num = 0;
      if (rawVal.includes(',')) {
        num = parseFloat(rawVal.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        num = parseFloat(rawVal) || 0;
      }
      if (num > 0) {
        matches.push({ nome: rawNome, valor: num });
      }
    }
  }

  if (matches.length > 1) {
    // Normalizar para que a soma bata rigorosamente com valorTotal
    const somaMatches = matches.reduce((acc, m) => acc + m.valor, 0);
    const fator = somaMatches > 0 && Math.abs(somaMatches - total) > 0.01 ? total / somaMatches : 1;

    let somaAjustada = 0;
    const resultado: DetalheModalidadePagamento[] = matches.map((m, idx) => {
      const cls = classificaModalidade(m.nome);
      let v = Math.round(m.valor * fator * 100) / 100;
      if (idx === matches.length - 1) {
        v = Math.round((total - somaAjustada) * 100) / 100;
      } else {
        somaAjustada += v;
      }
      return {
        categoria: cls.categoria,
        nomeExibicao: cls.nome,
        valor: v,
      };
    });
    return resultado;
  }

  // 2. Tentar detectar divisão por separadores sem valor explícito:
  // Ex: "Pix / Dinheiro" ou "Pix e Cartão de Débito"
  const partes = str
    .split(/[\/;+]|\se\s|\se\/ou\s|,/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (partes.length > 1) {
    const valorPorParte = Math.round((total / partes.length) * 100) / 100;
    let acumulado = 0;
    return partes.map((p, idx) => {
      const cls = classificaModalidade(p);
      let v = valorPorParte;
      if (idx === partes.length - 1) {
        v = Math.round((total - acumulado) * 100) / 100;
      } else {
        acumulado += v;
      }
      return {
        categoria: cls.categoria,
        nomeExibicao: cls.nome,
        valor: v,
      };
    });
  }

  // 3. Caso padrão: forma única
  const cls = classificaModalidade(str);
  return [
    {
      categoria: cls.categoria,
      nomeExibicao: cls.nome,
      valor: total,
    },
  ];
}

/**
 * Calcula o Resumo Financeiro a partir de uma lista de itens analíticos de Recibos Médicos
 */
export function calcularResumoFinanceiro(itens: ItemRelatorioAnalitico[]): ResumoFinanceiro {
  let totalPix = 0;
  let totalDinheiro = 0;
  let totalCartaoCredito = 0;
  let totalCartaoDebito = 0;
  let totalOutras = 0;
  let quantidadeEmitidos = 0;
  let quantidadeCancelados = 0;

  for (const item of itens) {
    if (item.status === 'cancelado') {
      quantidadeCancelados++;
      continue;
    }

    quantidadeEmitidos++;
    for (const mod of item.modalidades) {
      switch (mod.categoria) {
        case 'PIX':
          totalPix += mod.valor;
          break;
        case 'DINHEIRO':
          totalDinheiro += mod.valor;
          break;
        case 'CARTAO_CREDITO':
          totalCartaoCredito += mod.valor;
          break;
        case 'CARTAO_DEBITO':
          totalCartaoDebito += mod.valor;
          break;
        case 'OUTRAS':
        default:
          totalOutras += mod.valor;
          break;
      }
    }
  }

  totalPix = Math.round(totalPix * 100) / 100;
  totalDinheiro = Math.round(totalDinheiro * 100) / 100;
  totalCartaoCredito = Math.round(totalCartaoCredito * 100) / 100;
  totalCartaoDebito = Math.round(totalCartaoDebito * 100) / 100;
  totalOutras = Math.round(totalOutras * 100) / 100;

  const valorTotalGeral = Math.round(
    (totalPix + totalDinheiro + totalCartaoCredito + totalCartaoDebito + totalOutras) * 100
  ) / 100;

  const valorMedioPorRecibo =
    quantidadeEmitidos > 0 ? Math.round((valorTotalGeral / quantidadeEmitidos) * 100) / 100 : 0;

  return {
    totalPix,
    totalDinheiro,
    totalCartaoCredito,
    totalCartaoDebito,
    totalOutras,
    quantidadeEmitidos,
    quantidadeCancelados,
    valorTotalGeral,
    valorMedioPorRecibo,
  };
}

/**
 * Transforma documentos brutos de tipo 'recibo_medico' em itens analíticos
 */
export function mapearDocumentosParaItensAnaliticos(
  documentos: Documento[],
  nomeEmpresaMap: Record<string, string> = {}
): ItemRelatorioAnalitico[] {
  return documentos
    .filter((doc) => doc.tipo === 'recibo_medico')
    .map((doc) => {
      const med = doc.recibo_medico_detalhes;
      const modalidades = decomporFormasPagamento(med?.forma_pagamento, doc.valor);

      return {
        documentoId: doc.id,
        numero: doc.numero,
        dataEmissao: doc.data_emissao,
        pacienteNome: med?.paciente_nome || '---',
        pacienteCpf: med?.paciente_cpf || '---',
        pagadorNome: med?.pagador_nome || '---',
        pagadorDocumento: med?.pagador_documento || '---',
        servicoPrestado: med?.servico_prestado || doc.referente || '---',
        formaPagamentoOriginal: med?.forma_pagamento || 'Pix',
        modalidades,
        valorTotal: doc.valor,
        emissorNome: doc.usuario_nome || 'Emissor do Sistema',
        emissorId: doc.usuario_id,
        empresaEmissoraId: doc.empresa_emissora_id,
        empresaNome: nomeEmpresaMap[doc.empresa_emissora_id] || 'ABEAS - Assistência Social',
        status: doc.status,
        motivoCancelamento: doc.motivo_cancelamento,
      };
    });
}

/**
 * Exporta o Relatório Financeiro completo para arquivo Excel (.xlsx) com abas
 * de Resumo Financeiro e Planilha Analítica Detalhada.
 */
export function exportarRelatorioExcel({
  empresaNome,
  periodoFormatado,
  dataGeracaoFormatada,
  resumo,
  itens,
}: {
  empresaNome: string;
  periodoFormatado: string;
  dataGeracaoFormatada: string;
  resumo: ResumoFinanceiro;
  itens: ItemRelatorioAnalitico[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Aba Resumo Financeiro
  const wsResumoData: (string | number)[][] = [
    ['SISTEMA OFICIAL DE RECIBOS E RDC - ABEAS'],
    ['RELATÓRIO FINANCEIRO DIÁRIO - RECIBOS MÉDICOS'],
    [''],
    ['Empresa / Unidade:', empresaNome],
    ['Período Consultado:', periodoFormatado],
    ['Data e Hora de Geração:', dataGeracaoFormatada],
    [''],
    ['RESUMO DOS VALORES RECEBIDOS POR FORMA DE PAGAMENTO'],
    ['Forma de Pagamento', 'Total Recebido (R$)', 'Percentual (%)'],
    [
      'PIX',
      resumo.totalPix,
      resumo.valorTotalGeral > 0
        ? `${((resumo.totalPix / resumo.valorTotalGeral) * 100).toFixed(1)}%`
        : '0.0%',
    ],
    [
      'Dinheiro',
      resumo.totalDinheiro,
      resumo.valorTotalGeral > 0
        ? `${((resumo.totalDinheiro / resumo.valorTotalGeral) * 100).toFixed(1)}%`
        : '0.0%',
    ],
    [
      'Cartão de Crédito',
      resumo.totalCartaoCredito,
      resumo.valorTotalGeral > 0
        ? `${((resumo.totalCartaoCredito / resumo.valorTotalGeral) * 100).toFixed(1)}%`
        : '0.0%',
    ],
    [
      'Cartão de Débito',
      resumo.totalCartaoDebito,
      resumo.valorTotalGeral > 0
        ? `${((resumo.totalCartaoDebito / resumo.valorTotalGeral) * 100).toFixed(1)}%`
        : '0.0%',
    ],
    [
      'Outras Formas de Pagamento',
      resumo.totalOutras,
      resumo.valorTotalGeral > 0
        ? `${((resumo.totalOutras / resumo.valorTotalGeral) * 100).toFixed(1)}%`
        : '0.0%',
    ],
    ['TOTAL GERAL RECEBIDO', resumo.valorTotalGeral, '100.0%'],
    [''],
    ['INDICADORES OPERACIONAIS'],
    ['Quantidade de Recibos Médicos Emitidos (Válidos)', resumo.quantidadeEmitidos],
    ['Quantidade de Recibos Médicos Cancelados (Desconsiderados)', resumo.quantidadeCancelados],
    ['Valor Médio por Recibo (Ticket Médio)', resumo.valorMedioPorRecibo],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(wsResumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Financeiro');

  // 2. Aba Relatório Analítico (Planilha Detalhada)
  const wsAnaliticoData: (string | number)[][] = [
    ['SISTEMA OFICIAL DE RECIBOS E RDC - ABEAS'],
    ['RELATÓRIO ANALÍTICO DE RECIBOS MÉDICOS'],
    ['Empresa / Unidade:', empresaNome],
    ['Período Consultado:', periodoFormatado],
    ['Data e Hora de Geração:', dataGeracaoFormatada],
    [''],
    [
      'Nº Recibo',
      'Data de Emissão',
      'Paciente',
      'CPF Paciente',
      'Pagador',
      'CPF/CNPJ Pagador',
      'Serviço Prestado',
      'Forma de Pagamento',
      'Valor do Recibo (R$)',
      'Emissor Responsável',
      'Status',
    ],
    ...itens.map((item) => {
      const descForma =
        item.modalidades && item.modalidades.length > 1
          ? item.modalidades
              .map((m) => `${m.nomeExibicao}: R$ ${m.valor.toFixed(2).replace('.', ',')}`)
              .join(' | ')
          : item.formaPagamentoOriginal;

      return [
        item.numero,
        formatarDataBr(item.dataEmissao),
        item.pacienteNome,
        item.pacienteCpf,
        item.pagadorNome,
        item.pagadorDocumento,
        item.servicoPrestado,
        descForma,
        item.valorTotal,
        item.emissorNome,
        item.status === 'cancelado' ? 'CANCELADO' : 'EMITIDO',
      ];
    }),
    [''],
    [
      'TOTAL GERAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      resumo.valorTotalGeral,
      '',
      '',
    ],
  ];

  const wsAnalitico = XLSX.utils.aoa_to_sheet(wsAnaliticoData);
  XLSX.utils.book_append_sheet(wb, wsAnalitico, 'Planilha Analítica');

  const hojeIso = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `Relatorio_Financeiro_Recibos_Medicos_${hojeIso}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
}
