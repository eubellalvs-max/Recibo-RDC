'use client';

import React from 'react';
import { DadosRdc, TipoGastoConfig, TipoDocConfig } from '@/lib/types';
import { formatarMoeda, formatarDataBr } from '@/lib/masks';

export interface UnifiedRdcData {
  numero: string;
  detalhes: DadosRdc;
  tiposGasto: TipoGastoConfig[];
  tiposDoc: TipoDocConfig[];
}

interface UnifiedRdcPrintProps {
  dados: UnifiedRdcData;
}

export const UnifiedRdcPrint: React.FC<UnifiedRdcPrintProps> = ({ dados }) => {
  const { numero, detalhes: rdc, tiposGasto, tiposDoc } = dados;

  // Calcula totais por código de gasto
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

  // Preencher linhas vazias para visual idêntico à folha de modelo impressa oficial (14 linhas)
  const qtdLinhasTotais = 14;
  const itensAtuais = rdc?.itens || [];
  const linhasVaziasCount = Math.max(0, qtdLinhasTotais - itensAtuais.length);

  return (
    <div className="print-document print-sheet-rdc print-sheet bg-white border border-slate-900 shadow-sm p-4 sm:p-6 max-w-3xl w-full text-slate-900 font-sans leading-tight text-xs mx-auto">
      {/* CABEÇALHO DO MODELO ABEAS COM LOGO AO LADO E DEPOIS OS TEXTOS */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b-2 border-slate-900 mb-2.5">
        <div className="flex items-center gap-3 flex-1">
          <img
            src="/abeas_logo.png"
            alt="ABEAS"
            className="h-12 sm:h-14 w-auto object-contain shrink-0"
          />
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 leading-tight">
              Associação Brasileira de Entidades de Assistência Social
            </h1>
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight mt-0.5 underline leading-tight">
              Prestação de Contas e Reembolso de Despesas Corporativa - RDC
            </h2>
          </div>
        </div>

        <div className="text-right text-xs font-mono font-bold text-slate-900 shrink-0">
          Nº {numero}
        </div>
      </div>

      {/* SEÇÃO 1: Informações do Solicitante da Viagem ou Despesas Corporativas */}
      <div className="border border-slate-900 mb-2.5">
        <div className="bg-slate-100/90 px-2 py-0.5 flex items-center justify-between font-bold text-[10px] sm:text-[11px] border-b border-slate-900 uppercase tracking-wide">
          <span>Informações do Solicitante da Viagem ou Despesas Corporativas:</span>
          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 bg-white px-1.5 py-0.2 border border-slate-400 rounded">
            {rdc.linha_gasto === 'corporativa'
              ? 'Despesas Corporativas'
              : rdc.linha_gasto === 'ambas'
              ? 'Viagem & Corporativa'
              : 'Despesas de Viagem'}
          </span>
        </div>
        <div className="p-2 space-y-1 text-[10px] sm:text-[11px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-semibold">Data do pedido: </span>
              <span className="underline decoration-slate-400 font-mono">{formatarDataBr(rdc.data_pedido)}</span>
            </div>
            <div>
              <span className="font-semibold">N.º Pedido: </span>
              <span className="underline decoration-slate-400 font-mono">{rdc.numero_pedido}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
      <div className="border border-slate-900 mb-2.5">
        <div className="bg-slate-100/90 px-2 py-0.5 text-center font-bold text-[10px] sm:text-[11px] border-b border-slate-900 uppercase tracking-wide">
          Informações bancária e financeira:
        </div>
        <div className="p-2 space-y-1 text-[10px] sm:text-[11px]">
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

          <div className="grid grid-cols-2 gap-3">
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
      <div className="border border-slate-900 mb-2.5">
        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-100/90 border-b border-slate-900">
          <div className="text-[9px] sm:text-[10px]">
            <span className="font-bold">Data entrega - RDC: </span>
            <span className="underline font-mono">{formatarDataBr(rdc.data_entrega_rdc)}</span>
          </div>
          <div className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wide">
            Descrição dos gastos:
          </div>
          <div className="w-16" />
        </div>

        {/* Tabela dos Itens */}
        <table className="w-full text-left text-[9px] sm:text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 text-center font-bold bg-slate-50">
              <th className="border-r border-slate-900 px-1.5 py-0.5 w-16">Tipo Gastos</th>
              <th className="border-r border-slate-900 px-1.5 py-0.5 w-20">Tipo Doc. - Rec/NF</th>
              <th className="border-r border-slate-900 px-2 py-0.5 text-left">Fornecedor - observação das despesas - número documento</th>
              <th className="px-2 py-0.5 w-24 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rdc.itens.map((it) => (
              <tr key={it.id} className="border-b border-slate-300">
                <td className="border-r border-slate-900 px-1.5 py-0.5 text-center font-bold">
                  {it.tipo_gasto}
                </td>
                <td className="border-r border-slate-900 px-1.5 py-0.5 text-center font-semibold">
                  {it.tipo_doc === 'Nf' ? 'NF' : it.tipo_doc}
                </td>
                <td className="border-r border-slate-900 px-2 py-0.5">
                  {it.descricao}
                </td>
                <td className="px-2 py-0.5 text-right font-mono font-medium whitespace-nowrap">
                  {formatarMoeda(it.valor)}
                </td>
              </tr>
            ))}

            {/* Linhas vazias para preservar a estrutura estética padrão da folha */}
            {Array.from({ length: linhasVaziasCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-slate-200 h-5">
                <td className="border-r border-slate-900 px-1.5 py-0.5 text-center text-slate-300">-</td>
                <td className="border-r border-slate-900 px-1.5 py-0.5 text-center text-slate-300">-</td>
                <td className="border-r border-slate-900 px-2 py-0.5">&nbsp;</td>
                <td className="px-2 py-0.5 text-right text-slate-300 font-mono">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SEÇÃO 4: Legenda, Natureza dos gastos e Total gastos (Tabela Inferior) */}
      <div className="border border-slate-900 mb-2.5">
        <table className="w-full text-[9px] sm:text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-slate-900 font-bold bg-slate-100/80 text-center">
              <th className="border-r border-slate-900 px-2 py-0.5 w-24">Legenda</th>
              <th className="border-r border-slate-900 px-2 py-0.5 text-left">Natureza dos gastos</th>
              <th className="px-2 py-0.5 w-28 text-right">Total gastos</th>
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
                  className={isLast ? 'border-b border-slate-900' : 'border-b border-slate-300'}
                >
                  <td className="border-r border-slate-900 px-2 py-0.5 text-center font-semibold">
                    {td ? `${td.codigo}: ${td.nome}` : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="border-r border-slate-900 px-2 py-0.5">
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
            <tr className="border-b border-slate-900 font-bold bg-slate-50">
              <td colSpan={2} className="border-r border-slate-900 px-2 py-0.5 text-left uppercase">
                Total das Despesas
              </td>
              <td className="px-2 py-0.5 text-right font-mono text-xs">
                {formatarMoeda(rdc.total_despesas)}
              </td>
            </tr>
            <tr className="border-b border-slate-900">
              <td colSpan={2} className="border-r border-slate-900 px-2 py-0.5 text-left">
                Valor recebido de adiantamento
              </td>
              <td className="px-2 py-0.5 text-right font-mono font-medium">
                {formatarMoeda(rdc.valor_adiantamento)}
              </td>
            </tr>
            <tr className="border-b border-slate-900 text-[9px] sm:text-[10px]">
              <td colSpan={2} className="border-r border-slate-900 px-2 py-0.5 text-left">
                <span className="font-semibold">Valor de devolução/ressarcimento </span>
                <span className="text-slate-500">(Saldo negativo, a receber. Saldo positivo, devolver na conta de origem)</span>
              </td>
              <td className="px-2 py-0.5 text-right font-mono font-bold">
                {formatarMoeda(rdc.saldo_devolucao_ressarcimento)}
              </td>
            </tr>
            <tr className="font-bold bg-slate-100">
              <td colSpan={2} className="border-r border-slate-900 px-2 py-0.5 text-left">
                Valor a ressarcir na conta do solicitante
              </td>
              <td className="px-2 py-0.5 text-right font-mono text-xs text-blue-900">
                {formatarMoeda(rdc.valor_ressarcir_solicitante)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AVISO REGULAMENTAR */}
      <div className="border border-red-600 bg-red-50 text-red-700 font-bold text-[8.5px] sm:text-[9.5px] text-center py-0.5 px-2 uppercase tracking-wide mb-2.5">
        DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
      </div>

      {/* SEÇÃO 5: Assinaturas e aprovação das despesas */}
      <div className="border border-slate-900 p-2 avoid-page-break">
        <div className="text-center font-bold text-[9px] sm:text-[10px] uppercase border-b border-slate-900 pb-0.5 mb-5">
          Assinaturas e aprovação das despesas:
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-[9px] sm:text-[10px]">
          <div>
            <div className="border-t border-slate-500 pt-0.5 font-semibold">
              Assinatura do profissional:
            </div>
            <div className="text-[9px] text-slate-600 truncate mt-0.5">
              {rdc.assinatura_profissional || rdc.nome_solicitante}
            </div>
          </div>

          <div>
            <div className="border-t border-slate-500 pt-0.5 font-semibold">
              Diretoria direta:
            </div>
            <div className="text-[9px] text-slate-600 truncate mt-0.5">
              {rdc.diretoria_direta || 'Diretoria Executiva'}
            </div>
          </div>

          <div>
            <div className="border-t border-slate-500 pt-0.5 font-semibold">
              Contábil / Financeiro:
            </div>
            <div className="text-[9px] text-slate-600 truncate mt-0.5">
              {rdc.contabil_financeiro || 'Setor Financeiro'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
