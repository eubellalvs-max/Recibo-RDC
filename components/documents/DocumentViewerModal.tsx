'use client';

import React, { useState } from 'react';
import { Documento, Empresa, TipoGastoConfig, TipoDocConfig } from '@/lib/types';
import { StorageService, ABEAS_FIXA } from '@/lib/storage';
import { formatarMoeda, mascaraCnpj, mascaraCpf, formatarDataBr } from '@/lib/masks';
import { dataPorExtenso } from '@/lib/extenso';
import { Printer, Copy, Check, X, Download, AlertCircle } from 'lucide-react';

interface DocumentViewerModalProps {
  documento: Documento | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({
  documento,
  isOpen,
  onClose,
}: DocumentViewerModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [via, setVia] = useState<'1' | '2'>('1');

  if (!isOpen || !documento) return null;

  const empresas = StorageService.getEmpresas();
  const config = StorageService.getConfig();

  const emissora: Empresa | undefined = empresas.find(
    (e) => e.id === documento.empresa_emissora_id
  );
  const destinataria: Empresa | undefined = empresas.find(
    (e) => e.id === documento.empresa_destinataria_id
  );

  const isRdc = documento.tipo === 'rdc';
  const isReciboMedico = documento.tipo === 'recibo_medico';
  const rdc = documento.rdc_detalhes;
  const med = documento.recibo_medico_detalhes;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let texto = '';
    if (isRdc && rdc) {
      const linhaTexto =
        rdc.linha_gasto === 'corporativa'
          ? 'Despesas Corporativas'
          : rdc.linha_gasto === 'ambas'
          ? 'Viagem & Despesas Corporativas'
          : 'Despesas de Viagem';

      texto = `
==================================================
ASSOCIAÇÃO BRASILEIRA DE ENTIDADES DE ASSISTÊNCIA SOCIAL - ABEAS
PRESTAÇÃO DE CONTAS E REEMBOLSO DE DESPESAS CORPORATIVA - RDC
Nº ${documento.numero} [${linhaTexto}]
==================================================
Informações do Solicitante da Viagem ou Despesas Corporativas:
Linha de Gastos: ${linhaTexto}
Data do pedido: ${formatarDataBr(rdc.data_pedido)} | N.º Pedido: ${rdc.numero_pedido}
Local de partida/Origem: ${rdc.local_partida} | Destino/Unidade: ${rdc.destino}
Nome - Solicitante: ${rdc.nome_solicitante} | Nº CPF: ${rdc.cpf_solicitante} | Setor/Função: ${rdc.setor_funcao}
Objetivo: ${rdc.objetivo_viagem}

Informações bancária e financeira:
Valor solicitado: ${formatarMoeda(rdc.valor_solicitado)} | Banco: ${rdc.nome_banco} | Agência: ${rdc.agencia} | Conta: ${rdc.conta} (${rdc.tipo_conta})
Chave PIX: ${rdc.chave_pix}

Descrição dos gastos (Data entrega - RDC: ${formatarDataBr(rdc.data_entrega_rdc)}):
${rdc.itens.map((it, idx) => `${idx + 1}. [Tipo ${it.tipo_gasto} - ${it.tipo_doc}] ${it.descricao} - ${formatarMoeda(it.valor)}`).join('\n')}

Totais:
Total das Despesas: ${formatarMoeda(rdc.total_despesas)}
Valor recebido de adiantamento: ${formatarMoeda(rdc.valor_adiantamento)}
Saldo devolução/ressarcimento: ${formatarMoeda(rdc.saldo_devolucao_ressarcimento)}
Valor a ressarcir na conta do solicitante: ${formatarMoeda(rdc.valor_ressarcir_solicitante)}

AVISO: DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
==================================================
`.trim();
    } else if (isReciboMedico && med) {
      texto = `
==================================================
${ABEAS_FIXA.razao_social}
CNPJ: ${ABEAS_FIXA.cnpj}
RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
Recibo nº: ${documento.numero}
Valor: ${formatarMoeda(documento.valor)} (${documento.valor_extenso})
==================================================
${ABEAS_FIXA.texto_declaracao}

DADOS DO PAGADOR:
Nome/Razão Social: ${med.pagador_nome}
CPF/CNPJ: ${med.pagador_documento}
Telefone: ${med.pagador_telefone || '---'}
Endereço: ${med.pagador_endereco || '---'}

A quantia supra de ${formatarMoeda(documento.valor)} (${documento.valor_extenso}), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):

DADOS DO PACIENTE:
Nome do Paciente: ${med.paciente_nome}
CPF do Paciente: ${med.paciente_cpf}
Telefone: ${med.paciente_telefone || '---'}
Endereço: ${med.paciente_endereco || '---'}

DETALHES DO ATENDIMENTO:
Serviço prestado: ${med.servico_prestado}
Médico(a) assistente: ${med.medico_assistente}
CRM: ${med.crm}
Data do atendimento: ${med.data_atendimento.split('-').reverse().join('/')}
Forma de pagamento: ${med.forma_pagamento}

${ABEAS_FIXA.texto_final}

${med.cidade || 'Itapuranga'} - ${med.uf || 'GO'}, ${dataPorExtenso(documento.data_emissao)}.

__________________________________________________
${ABEAS_FIXA.razao_social}
CNPJ: ${ABEAS_FIXA.cnpj}
==================================================
`.trim();
    } else {
      texto = `
==================================================
${config.sigla_organizacao || 'ABEAS'}
RECIBO Nº ${documento.numero}
==================================================
RECEBEMOS DE: ${destinataria?.razao_social || 'Empresa Destinatária'}
CNPJ: ${destinataria ? mascaraCnpj(destinataria.cnpj) : ''}
O VALOR DE: ${formatarMoeda(documento.valor)} (${documento.valor_extenso})
REFERENTE A: ${documento.referente}
${documento.observacoes ? `Observações: ${documento.observacoes}` : ''}
${documento.cidade_emissao || 'Brasília/DF'}, ${dataPorExtenso(documento.data_emissao)}.
Emissor: ${emissora?.razao_social || 'Empresa Emissora'}
==================================================
`.trim();
    }

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const tiposGasto: TipoGastoConfig[] = config.tipos_gasto || StorageService.getTiposGasto();
  const tiposDoc: TipoDocConfig[] = config.tipos_doc || StorageService.getTiposDoc();

  // Se for RDC, calcula totais por categoria dinamicamente
  const totalPorNatureza: Record<number, number> = {};
  tiposGasto.forEach((tg) => {
    totalPorNatureza[tg.codigo] = 0;
  });
  if (rdc?.itens) {
    rdc.itens.forEach((it) => {
      const cod = Number(it.tipo_gasto);
      totalPorNatureza[cod] = (totalPorNatureza[cod] || 0) + (Number(it.valor) || 0);
    });
  }

  // Preencher linhas vazias para visual igual da folha de modelo impressa
  const qtdLinhasTotais = 14;
  const itensAtuais = rdc?.itens || [];
  const linhasVaziasCount = Math.max(0, qtdLinhasTotais - itensAtuais.length);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[94vh] transition-colors">
        {/* Barra Superior de Ações no Modal (Não impressa) */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
              {isRdc
                ? 'RDC - PRESTAÇÃO DE CONTAS'
                : isReciboMedico
                ? 'RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS'
                : 'RECIBO'}{' '}
              Nº {documento.numero}
            </span>
            {!isRdc && !isReciboMedico && (
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-md p-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <button
                  onClick={() => setVia('1')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    via === '1' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : ''
                  }`}
                >
                  1ª Via
                </button>
                <button
                  onClick={() => setVia('2')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    via === '2' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : ''
                  }`}
                >
                  2ª Via
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
              title="Copiar texto do documento"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Auditoria de Cancelamento */}
        {documento.status === 'cancelado' && (
          <div className="bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900/60 px-6 py-2.5 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold uppercase tracking-wider text-red-700 dark:text-red-400">DOCUMENTO CANCELADO</span>
              <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                <span>Data do Cancelamento: <b>{documento.data_cancelamento ? new Date(documento.data_cancelamento).toLocaleString('pt-BR') : 'Não registrada'}</b></span>
                <span className="mx-2">•</span>
                <span>Responsável: <b>{documento.usuario_cancelamento_nome || 'Sistema'}</b></span>
              </div>
              {documento.motivo_cancelamento && (
                <div className="text-[11px] text-red-700 dark:text-red-300 mt-1 italic">
                  Motivo: &ldquo;{documento.motivo_cancelamento}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo com Scroll na tela e formatado para papel timbrado */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center transition-colors">
          {/* Se for RDC: Renderiza EXATAMENTE o modelo da imagem */}
          {isRdc && rdc ? (
            <div className="print-sheet bg-white border border-slate-800 shadow-sm p-6 sm:p-8 max-w-3xl w-full text-slate-900 font-sans leading-tight text-xs">
              {/* CABEÇALHO DO MODELO ABEAS COM LOGO AO LADO */}
              <div className="flex items-center justify-between gap-4 pb-3.5 border-b-2 border-slate-800 mb-3">
                {/* Imagem ABEAS ao Lado e depois os textos */}
                <div className="flex items-center gap-3.5 flex-1">
                  <img
                    src="/abeas_logo.png"
                    alt="ABEAS"
                    className="h-14 sm:h-16 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                      Associação Brasileira de Entidades de Assistência Social
                    </h1>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight mt-0.5 underline leading-tight">
                      Prestação de Contas e Reembolso de Despesas Corporativa - RDC
                    </h2>
                  </div>
                </div>

                <div className="text-right text-xs font-mono font-bold text-slate-900 shrink-0">
                  Nº {documento.numero}
                </div>
              </div>

              {/* SEÇÃO 1: Informações do Solicitante da Viagem ou Despesas Corporativas */}
              <div className="border border-slate-800 mb-3">
                <div className="bg-slate-100/80 px-2 py-1 flex items-center justify-between font-bold text-[11px] border-b border-slate-800 uppercase tracking-wide">
                  <span>Informações do Solicitante da Viagem ou Despesas Corporativas:</span>
                  <span className="text-[10px] font-semibold text-slate-700 bg-white px-1.5 py-0.2 border border-slate-400 rounded">
                    {rdc.linha_gasto === 'corporativa'
                      ? 'Despesas Corporativas'
                      : rdc.linha_gasto === 'ambas'
                      ? 'Viagem & Corporativa'
                      : 'Despesas de Viagem'}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 text-[11px]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Data do pedido: </span>
                      <span className="underline decoration-slate-400">{formatarDataBr(rdc.data_pedido)}</span>
                    </div>
                    <div>
                      <span className="font-semibold">N.º Pedido: </span>
                      <span className="underline decoration-slate-400 font-mono">{rdc.numero_pedido}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">
                        {rdc.linha_gasto === 'corporativa' ? 'Local / Origem Corporativa: ' : 'Local de partida: '}
                      </span>
                      <span className="underline decoration-slate-400">{rdc.local_partida}</span>
                    </div>
                    <div>
                      <span className="font-semibold">
                        {rdc.linha_gasto === 'corporativa' ? 'Destino / Unidade Beneficiada: ' : 'Destino: '}
                      </span>
                      <span className="underline decoration-slate-400">{rdc.destino}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <span className="font-semibold">Nome - Solicitante: </span>
                      <span className="underline decoration-slate-400">{rdc.nome_solicitante}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Nº CPF: </span>
                      <span className="underline decoration-slate-400 font-mono">{rdc.cpf_solicitante}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Setor/Função: </span>
                      <span className="underline decoration-slate-400">{rdc.setor_funcao}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold">
                      {rdc.linha_gasto === 'corporativa' ? 'Objetivo das despesas corporativas: ' : 'Objetivo da viagem / despesas: '}
                    </span>
                    <span className="underline decoration-slate-400">{rdc.objetivo_viagem}</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: Informações bancária e financeira */}
              <div className="border border-slate-800 mb-3">
                <div className="bg-slate-100/80 px-2 py-1 text-center font-bold text-[11px] border-b border-slate-800 uppercase tracking-wide">
                  Informações bancária e financeira:
                </div>
                <div className="p-2 space-y-1.5 text-[11px]">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="font-semibold">Valor solicitado: </span>
                      <span className="font-mono font-bold">{formatarMoeda(rdc.valor_solicitado)}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="font-semibold">Nome do Banco: </span>
                      <span className="underline decoration-slate-400">{rdc.nome_banco}</span>
                    </div>
                    <div>
                      <span className="font-semibold">N.º Agencia: </span>
                      <span className="underline decoration-slate-400 font-mono">{rdc.agencia}</span>
                    </div>
                    <div>
                      <span className="font-semibold">N.º Conta: </span>
                      <span className="underline decoration-slate-400 font-mono">{rdc.conta}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Tipo da Conta: </span>
                      <span className="underline decoration-slate-400">{rdc.tipo_conta}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Chave do PIX: </span>
                      <span className="underline decoration-slate-400 font-mono">{rdc.chave_pix}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: Descrição dos gastos */}
              <div className="border border-slate-800 mb-3">
                <div className="flex items-center justify-between px-2 py-1 bg-slate-100/80 border-b border-slate-800">
                  <div className="text-[10px]">
                    <span className="font-bold">Data entrega - RDC: </span>
                    <span className="underline font-mono">{formatarDataBr(rdc.data_entrega_rdc)}</span>
                  </div>
                  <div className="font-bold text-[11px] uppercase tracking-wide">
                    Descrição dos gastos:
                  </div>
                  <div className="w-20" />
                </div>

                {/* Tabela dos Itens */}
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-center font-bold bg-slate-50">
                      <th className="border-r border-slate-800 px-2 py-1 w-20">Tipo Gastos</th>
                      <th className="border-r border-slate-800 px-2 py-1 w-24">Tipo Doc. - Rec/NF</th>
                      <th className="border-r border-slate-800 px-2 py-1 text-left">Fornecedor - observação das despesas - número documento</th>
                      <th className="px-2 py-1 w-28 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rdc.itens.map((it) => (
                      <tr key={it.id} className="border-b border-slate-300">
                        <td className="border-r border-slate-800 px-2 py-1 text-center font-bold">
                          {it.tipo_gasto}
                        </td>
                        <td className="border-r border-slate-800 px-2 py-1 text-center font-semibold">
                          {it.tipo_doc === 'Nf' ? 'NF' : it.tipo_doc}
                        </td>
                        <td className="border-r border-slate-800 px-2 py-1">
                          {it.descricao}
                        </td>
                        <td className="px-2 py-1 text-right font-mono font-medium whitespace-nowrap">
                          {formatarMoeda(it.valor)}
                        </td>
                      </tr>
                    ))}

                    {/* Linhas vazias para preservar a estrutura estética fiel da folha */}
                    {Array.from({ length: linhasVaziasCount }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="border-b border-slate-200 h-6">
                        <td className="border-r border-slate-800 px-2 py-1 text-center text-slate-300">-</td>
                        <td className="border-r border-slate-800 px-2 py-1 text-center text-slate-300">-</td>
                        <td className="border-r border-slate-800 px-2 py-1">&nbsp;</td>
                        <td className="px-2 py-1 text-right text-slate-300 font-mono">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SEÇÃO 4: Legenda, Natureza dos gastos e Total gastos (Tabela Inferior) */}
              <div className="border border-slate-800 mb-3">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 font-bold bg-slate-100/70 text-center">
                      <th className="border-r border-slate-800 px-2 py-1 w-24">Legenda</th>
                      <th className="border-r border-slate-800 px-2 py-1 text-left">Natureza dos gastos</th>
                      <th className="px-2 py-1 w-32 text-right">Total gastos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(tiposGasto.length, tiposDoc.length) }).map((_, idx) => {
                      const tg = tiposGasto[idx];
                      const td = tiposDoc[idx];
                      const isLast = idx === Math.max(tiposGasto.length, tiposDoc.length) - 1;
                      return (
                        <tr
                          key={tg ? `tg-${tg.id || tg.codigo}` : `td-${td.id || td.codigo}`}
                          className={isLast ? 'border-b border-slate-800' : 'border-b border-slate-300'}
                        >
                          <td className="border-r border-slate-800 px-2 py-0.5 text-center font-semibold">
                            {td ? `${td.codigo}: ${td.nome}` : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="border-r border-slate-800 px-2 py-0.5">
                            {tg ? `${tg.codigo} ${tg.nome}` : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-2 py-0.5 text-right font-mono">
                            {tg ? (
                              formatarMoeda(totalPorNatureza[tg.codigo] || 0)
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linhas de Fechamento Financeiro */}
                    <tr className="border-b border-slate-800 font-bold bg-slate-50">
                      <td colSpan={2} className="border-r border-slate-800 px-2 py-1 text-left uppercase">
                        Total das Despesas
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-xs">
                        {formatarMoeda(rdc.total_despesas)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td colSpan={2} className="border-r border-slate-800 px-2 py-1 text-left">
                        Valor recebido de adiantamento
                      </td>
                      <td className="px-2 py-1 text-right font-mono font-medium">
                        {formatarMoeda(rdc.valor_adiantamento)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800 text-[10px]">
                      <td colSpan={2} className="border-r border-slate-800 px-2 py-1 text-left">
                        <span className="font-semibold">Valor de devolução/ressarcimento </span>
                        <span className="text-slate-500">(Saldo negativo, a receber. Saldo positivo, devolver na conta de origem)</span>
                      </td>
                      <td className="px-2 py-1 text-right font-mono font-bold">
                        {formatarMoeda(rdc.saldo_devolucao_ressarcimento)}
                      </td>
                    </tr>
                    <tr className="font-bold bg-slate-100">
                      <td colSpan={2} className="border-r border-slate-800 px-2 py-1 text-left">
                        Valor a ressarcir na conta do solicitante
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-xs text-blue-900">
                        {formatarMoeda(rdc.valor_ressarcir_solicitante)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AVISO REGULAMENTAR */}
              <div className="border border-red-600 bg-red-50 text-red-700 font-bold text-[9px] sm:text-[10px] text-center py-1 px-2 uppercase tracking-wide mb-3">
                DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
              </div>

              {/* SEÇÃO 5: Assinaturas e aprovação das despesas */}
              <div className="border border-slate-800 p-2">
                <div className="text-center font-bold text-[10px] uppercase border-b border-slate-800 pb-1 mb-6">
                  Assinaturas e aprovação das despesas:
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                  <div>
                    <div className="border-t border-slate-500 pt-1 font-semibold">
                      Assinatura do profissional:
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5">
                      {rdc.assinatura_profissional || rdc.nome_solicitante}
                    </div>
                  </div>

                  <div>
                    <div className="border-t border-slate-500 pt-1 font-semibold">
                      Diretoria direta:
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5">
                      {rdc.diretoria_direta || 'Diretoria Executiva'}
                    </div>
                  </div>

                  <div>
                    <div className="border-t border-slate-500 pt-1 font-semibold">
                      Contábil / Financeiro:
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5">
                      {rdc.contabil_financeiro || 'Setor Financeiro'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isReciboMedico && med ? (
            /* ============================================================== */
            /* RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS (MODELO OFICIAL ABEAS) */
            /* ============================================================== */
            <div className="print-sheet bg-white border border-slate-300 shadow-sm p-8 sm:p-12 max-w-3xl w-full text-slate-900 font-sans leading-relaxed text-sm">
              {/* Cabeçalho Oficial do Modelo com Logo ABEAS Acima */}
              <div className="text-center border-b-2 border-slate-300 pb-5 mb-5">
                <div className="flex justify-center mb-2.5">
                  <img
                    src="/abeas_logo.png"
                    alt="ABEAS"
                    className="h-16 sm:h-20 w-auto object-contain"
                  />
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-800 font-bold mb-0.5">
                  ABEAS - Associação Brasileira de Entidades de Assistência Social
                </div>
                <div className="text-xs text-slate-600 font-mono mb-3">
                  CNPJ: 04.547.278/0005-68
                </div>
                <h1 className="text-xl md:text-2xl font-bold uppercase text-slate-900 tracking-tight">
                  RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
                </h1>
              </div>

              {/* Linha com Número e Valor em Destaque */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recibo nº:{' '}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {documento.numero}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Valor:
                  </span>
                  <span className="text-lg md:text-xl font-bold text-slate-900">
                    {formatarMoeda(documento.valor)}
                  </span>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-800">
                {/* Texto Fixo Declaratório da ABEAS */}
                <p className="leading-relaxed text-justify font-normal">
                  {ABEAS_FIXA.texto_declaracao}
                </p>

                {/* Seção: DADOS DO PAGADOR */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    DADOS DO PAGADOR
                  </div>
                  <div className="p-4 space-y-2 text-xs text-slate-800 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-slate-900">Nome/Razão Social: </span>
                        <span>{med.pagador_nome}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">CPF/CNPJ: </span>
                        <span className="font-mono">{med.pagador_documento}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">Telefone: </span>
                        <span>{med.pagador_telefone || '---'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Endereço: </span>
                        <span>{med.pagador_endereco || '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto Fixo Intermediário com Valor e Extenso Automáticos */}
                <p className="leading-relaxed text-justify">
                  A quantia supra de <b>{formatarMoeda(documento.valor)}</b> (<i>{documento.valor_extenso}</i>), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):
                </p>

                {/* Seção: DADOS DO PACIENTE */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    DADOS DO PACIENTE
                  </div>
                  <div className="p-4 space-y-2 text-xs text-slate-800 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-slate-900">Nome do Paciente: </span>
                        <span>{med.paciente_nome}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">CPF do Paciente: </span>
                        <span className="font-mono">{med.paciente_cpf}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">Telefone: </span>
                        <span>{med.paciente_telefone || '---'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Endereço: </span>
                        <span>{med.paciente_endereco || '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: DETALHES DO ATENDIMENTO */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    DETALHES DO ATENDIMENTO:
                  </div>
                  <div className="p-4 space-y-2 text-xs text-slate-800 bg-white">
                    <div>
                      <span className="font-bold text-slate-900">Serviço prestado: </span>
                      <span>{med.servico_prestado}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">Médico(a) assistente: </span>
                        <span>{med.medico_assistente}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">CRM: </span>
                        <span className="font-mono">{med.crm}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">Data do atendimento: </span>
                        <span>{med.data_atendimento.split('-').reverse().join('/')}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Forma de pagamento: </span>
                        <span>{med.forma_pagamento}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto Final Fixo */}
                <p className="leading-relaxed text-justify font-medium pt-2">
                  {ABEAS_FIXA.texto_final}
                </p>

                {/* Local e Data */}
                <div className="pt-4 text-right text-xs text-slate-800 font-medium">
                  {med.cidade || 'Itapuranga'} - {med.uf || 'GO'}, {dataPorExtenso(documento.data_emissao)}.
                </div>

                {/* Assinatura Oficial Fixo da ABEAS */}
                <div className="pt-12 text-center">
                  <div className="w-80 mx-auto border-t border-slate-500 mb-2" />
                  <div className="font-bold text-xs uppercase text-slate-900">
                    {ABEAS_FIXA.razao_social}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    CNPJ: {ABEAS_FIXA.cnpj}
                  </div>
                </div>
              </div>

              {/* Rodapé Interno */}
              <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <div>Documento Oficial de Prestação de Serviços Médicos Particulares</div>
                <div>Emissor: {documento.usuario_nome || 'Sistema'}</div>
              </div>
            </div>
          ) : (
            /* RECIBO PADRÃO TRADICIONAL COM FONTE PADRÃO DO SISTEMA */
            <div className="print-sheet bg-white border border-slate-300 shadow-sm p-8 md:p-12 max-w-2xl w-full text-slate-900 font-sans leading-relaxed text-sm">
              <div className="text-center pb-6 border-b border-slate-300">
                {/* Logo da Empresa Emissora (se cadastrado na empresa ou anexado no recibo) */}
                {(documento.logo_url || emissora?.logo_url) && (
                  <div className="flex justify-center mb-3">
                    <img
                      src={documento.logo_url || emissora?.logo_url}
                      alt={emissora?.nome_fantasia || emissora?.razao_social || 'Logo da Empresa'}
                      className="max-h-16 max-w-[240px] object-contain"
                    />
                  </div>
                )}

                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                  {emissora?.nome_fantasia || emissora?.razao_social || config.nome_organizacao || 'ABEAS'}
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  RECIBO
                </h1>
                <div className="text-sm font-semibold text-slate-700 font-mono mt-1">
                  Nº {documento.numero}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {via === '1' ? '1ª VIA - DESTINATÁRIO' : '2ª VIA - EMISSOR / ARQUIVO'}
                </div>
              </div>

              <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-sans">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  VALOR TOTAL:
                </span>
                <span className="text-xl md:text-2xl font-bold text-slate-900 tabular-nums">
                  {formatarMoeda(documento.valor)}
                </span>
              </div>

              <div className="space-y-6 text-sm text-slate-800">
                <div>
                  <span className="font-bold block text-xs font-sans text-slate-600 uppercase tracking-wider mb-1">
                    RECEBEMOS DE:
                  </span>
                  <div className="font-bold text-base text-slate-900">
                    {destinataria?.razao_social || 'EMPRESA DESTINATÁRIA'}
                  </div>
                  <div className="text-xs font-sans text-slate-600 mt-0.5">
                    CNPJ: {destinataria ? mascaraCnpj(destinataria.cnpj) : '00.000.000/0001-00'}
                  </div>
                  {destinataria?.endereco && (
                    <div className="text-xs font-sans text-slate-500 mt-0.5">
                      {destinataria.endereco}, {destinataria.numero} - {destinataria.bairro}, {destinataria.cidade}/{destinataria.uf}
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-bold block text-xs font-sans text-slate-600 uppercase tracking-wider mb-1">
                    O VALOR DE:
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">
                    {formatarMoeda(documento.valor)}
                  </div>
                  <div className="text-xs text-slate-700 italic mt-0.5 font-sans">
                    ({documento.valor_extenso})
                  </div>
                </div>

                <div>
                  <span className="font-bold block text-xs font-sans text-slate-600 uppercase tracking-wider mb-1">
                    REFERENTE A:
                  </span>
                  <p className="text-slate-800 text-justify whitespace-pre-line leading-relaxed">
                    {documento.referente}
                  </p>
                </div>

                {documento.observacoes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-sans">
                    <span className="font-semibold text-slate-700">Observações: </span>
                    {documento.observacoes}
                  </div>
                )}

                <div className="pt-4 text-right font-sans text-xs text-slate-700">
                  {documento.cidade_emissao || 'Brasília/DF'}, {dataPorExtenso(documento.data_emissao)}.
                </div>

                <div className="pt-12 text-center">
                  <div className="w-72 mx-auto border-t border-slate-400 mb-2" />
                  <div className="font-bold text-xs uppercase text-slate-900 font-sans">
                    {emissora?.razao_social || 'EMPRESA EMISSORA'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    CNPJ: {emissora ? mascaraCnpj(emissora.cnpj) : '00.000.000/0001-00'}
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <div>{config.mensagem_rodape}</div>
                <div>Emissor: {documento.usuario_nome || 'Sistema'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
