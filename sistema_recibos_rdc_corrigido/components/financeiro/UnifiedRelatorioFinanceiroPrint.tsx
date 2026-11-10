'use client';

import React from 'react';
import { ResumoFinanceiro, ItemRelatorioAnalitico } from '@/lib/financeiro';
import { formatarMoeda, formatarDataBr } from '@/lib/masks';

export interface DadosRelatorioFinanceiroPrint {
  empresaNome: string;
  periodoFormatado: string;
  dataGeracaoFormatada: string;
  usuarioGeradorNome: string;
  resumo: ResumoFinanceiro;
  itens: ItemRelatorioAnalitico[];
  orientacao?: 'retrato' | 'paisagem';
}

interface UnifiedRelatorioFinanceiroPrintProps {
  dados: DadosRelatorioFinanceiroPrint;
}

export const UnifiedRelatorioFinanceiroPrint: React.FC<UnifiedRelatorioFinanceiroPrintProps> = ({
  dados,
}) => {
  const {
    empresaNome,
    periodoFormatado,
    dataGeracaoFormatada,
    usuarioGeradorNome,
    resumo,
    itens,
    orientacao = 'retrato',
  } = dados;

  const isPaisagem = orientacao === 'paisagem';

  return (
    <div className={`w-full ${
      isPaisagem ? 'max-w-[275mm] receipt-relatorio-paisagem' : 'max-w-[190mm] receipt-relatorio'
    } mx-auto p-3 sm:p-4 bg-white text-black font-sans text-xs print:p-0 print:max-w-none print:w-full`}>
      {/* Cabeçalho Oficial Timbrado */}
      <div className="border-b-2 border-slate-900 pb-2.5 mb-3 evitar-quebra">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/abeas_logo.png"
              alt="ABEAS"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
                Associação Brasileira de Entidades de Assistência Social
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight">
                RELATÓRIO FINANCEIRO DIÁRIO • RECIBOS MÉDICOS
              </h1>
              <div className="text-[9.5px] text-slate-700 font-medium">
                Conferência e Prestação de Contas de Movimentação Financeira {isPaisagem ? '• Formato Paisagem' : '• Formato Retrato'}
              </div>
            </div>
          </div>
          <div className="text-right text-[9px] sm:text-[9.5px] text-slate-700 leading-tight shrink-0">
            <div>
              <span className="font-bold">Gerado em:</span> {dataGeracaoFormatada}
            </div>
            <div>
              <span className="font-bold">Emissor:</span> {usuarioGeradorNome}
            </div>
            <div>
              <span className="font-bold">Empresa/Unidade:</span> {empresaNome}
            </div>
            <div>
              <span className="font-bold">Período:</span> {periodoFormatado}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Resumo Financeiro Consolidado */}
      <div className="mb-4 evitar-quebra">
        <div className="bg-slate-900 text-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded-t">
          1. RESUMO FINANCEIRO POR FORMA DE PAGAMENTO
        </div>
        <div className="border border-slate-900 border-t-0 p-2.5 bg-slate-50/50">
          <div className={`grid ${isPaisagem ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-4'} gap-2 mb-2`}>
            <div className="bg-white border border-slate-300 rounded p-1.5">
              <div className="text-[8.5px] uppercase font-bold text-slate-500">PIX</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                {formatarMoeda(resumo.totalPix)}
              </div>
              <div className="text-[8px] text-slate-500">
                {resumo.valorTotalGeral > 0
                  ? `${((resumo.totalPix / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-1.5">
              <div className="text-[8.5px] uppercase font-bold text-slate-500">Dinheiro</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                {formatarMoeda(resumo.totalDinheiro)}
              </div>
              <div className="text-[8px] text-slate-500">
                {resumo.valorTotalGeral > 0
                  ? `${((resumo.totalDinheiro / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-1.5">
              <div className="text-[8.5px] uppercase font-bold text-slate-500">Cartão de Crédito</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                {formatarMoeda(resumo.totalCartaoCredito)}
              </div>
              <div className="text-[8px] text-slate-500">
                {resumo.valorTotalGeral > 0
                  ? `${((resumo.totalCartaoCredito / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-1.5">
              <div className="text-[8.5px] uppercase font-bold text-slate-500">Cartão de Débito</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                {formatarMoeda(resumo.totalCartaoDebito)}
              </div>
              <div className="text-[8px] text-slate-500">
                {resumo.valorTotalGeral > 0
                  ? `${((resumo.totalCartaoDebito / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                  : '0%'}
              </div>
            </div>

            {isPaisagem && (
              <>
                <div className="bg-white border border-slate-300 rounded p-1.5">
                  <div className="text-[8.5px] uppercase font-bold text-slate-500">Outras Formas</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                    {formatarMoeda(resumo.totalOutras)}
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded p-1.5">
                  <div className="text-[8.5px] uppercase font-bold text-slate-500">Recibos Emitidos</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                    {resumo.quantidadeEmitidos}
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded p-1.5">
                  <div className="text-[8.5px] uppercase font-bold text-slate-500">Ticket Médio</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                    {formatarMoeda(resumo.valorMedioPorRecibo)}
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded p-1.5 border border-slate-950">
                  <div className="text-[8.5px] uppercase font-bold text-slate-300">Total Geral</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-300 tabular-nums">
                    {formatarMoeda(resumo.valorTotalGeral)}
                  </div>
                </div>
              </>
            )}
          </div>

          {!isPaisagem && (
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-white border border-slate-300 rounded p-1.5">
                <div className="text-[8.5px] uppercase font-bold text-slate-500">Outras Formas</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                  {formatarMoeda(resumo.totalOutras)}
                </div>
              </div>

              <div className="bg-white border border-slate-300 rounded p-1.5">
                <div className="text-[8.5px] uppercase font-bold text-slate-500">Recibos Emitidos</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                  {resumo.quantidadeEmitidos}
                </div>
                {resumo.quantidadeCancelados > 0 && (
                  <div className="text-[8px] text-rose-600 font-semibold">
                    ({resumo.quantidadeCancelados} cancelados)
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-300 rounded p-1.5">
                <div className="text-[8.5px] uppercase font-bold text-slate-500">Ticket Médio / Recibo</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                  {formatarMoeda(resumo.valorMedioPorRecibo)}
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded p-1.5 border border-slate-950">
                <div className="text-[8.5px] uppercase font-bold text-slate-300">Total Geral Recebido</div>
                <div className="text-xs sm:text-sm font-black text-emerald-300 tabular-nums">
                  {formatarMoeda(resumo.valorTotalGeral)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Relatório Analítico - Planilha Detalhada com Quebra de Página Fluida */}
      <div className="mb-4">
        <div className="bg-slate-900 text-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded-t flex items-center justify-between evitar-quebra">
          <span>2. PLANILHA ANALÍTICA DE RECIBOS MÉDICOS</span>
          <span className="text-[8.5px] font-normal text-slate-300">
            {itens.length} registro(s) listado(s)
          </span>
        </div>
        <table className="table-fixed w-full text-left text-[9px] sm:text-[9.5px] border border-slate-900 border-collapse">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-900 font-bold">
              <th className={`p-1.5 border-r border-slate-400 ${isPaisagem ? 'w-[11%]' : 'w-[12%]'}`}>Nº Recibo</th>
              <th className={`p-1.5 border-r border-slate-400 ${isPaisagem ? 'w-[9%]' : 'w-[9%]'}`}>Data</th>
              <th className={`p-1.5 border-r border-slate-400 ${isPaisagem ? 'w-[24%]' : 'w-[24%]'}`}>Paciente / Pagador</th>
              <th className={`p-1.5 border-r border-slate-400 ${isPaisagem ? 'w-[26%]' : 'w-[23%]'}`}>Serviço Prestado</th>
              <th className={`p-1.5 border-r border-slate-400 ${isPaisagem ? 'w-[13%]' : 'w-[14%]'}`}>Forma Pagto</th>
              <th className={`p-1.5 border-r border-slate-400 text-right ${isPaisagem ? 'w-[9%]' : 'w-[10%]'}`}>Valor (R$)</th>
              <th className={`p-1.5 ${isPaisagem ? 'w-[8%]' : 'w-[8%]'}`}>Emissor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {itens.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                  Nenhum recibo médico encontrado para o período/critérios selecionados.
                </td>
              </tr>
            ) : (
              itens.map((item) => {
                const isCancelado = item.status === 'cancelado';
                return (
                  <tr
                    key={item.documentoId}
                    className={`even:bg-slate-50 break-inside-avoid ${isCancelado ? 'opacity-50 line-through' : ''}`}
                  >
                    <td className="p-1 border-r border-slate-300 font-mono font-bold align-top break-all">
                      {item.numero}
                      {isCancelado && (
                        <span className="block text-[7.5px] text-red-600 font-bold no-underline">
                          [CANCELADO]
                        </span>
                      )}
                    </td>
                    <td className="p-1 border-r border-slate-300 whitespace-nowrap align-top">
                      {formatarDataBr(item.dataEmissao)}
                    </td>
                    <td className="p-1 border-r border-slate-300 align-top">
                      <div className="font-bold text-slate-900 leading-tight">{item.pacienteNome}</div>
                      {item.pagadorNome && item.pagadorNome !== item.pacienteNome && (
                        <div className="text-[8px] text-slate-600 leading-tight">
                          Pag: {item.pagadorNome}
                        </div>
                      )}
                    </td>
                    <td className="p-1 border-r border-slate-300 align-top">
                      <span className="line-clamp-3 leading-snug">{item.servicoPrestado}</span>
                    </td>
                    <td className="p-1 border-r border-slate-300 align-top">
                      {item.modalidades && item.modalidades.length > 1 ? (
                        <div className="space-y-0.5">
                          {item.modalidades.map((m, idx) => (
                            <div key={idx} className="text-[8px] font-semibold text-slate-800 leading-tight">
                              • {m.nomeExibicao}: {formatarMoeda(m.valor)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800 leading-tight">
                          {item.formaPagamentoOriginal}
                        </span>
                      )}
                    </td>
                    <td className="p-1 border-r border-slate-300 text-right font-bold text-slate-900 tabular-nums align-top">
                      {formatarMoeda(item.valorTotal)}
                    </td>
                    <td className="p-1 truncate text-slate-700 align-top">
                      {item.emissorNome}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold text-[10px] border-t-2 border-slate-950 break-inside-avoid">
              <td colSpan={5} className="p-1.5 text-right uppercase tracking-wider">
                SOMA TOTAL DOS RECIBOS (PERÍODO CONSULTADO):
              </td>
              <td className="p-1.5 text-right text-emerald-300 tabular-nums font-black text-[10.5px]">
                {formatarMoeda(resumo.valorTotalGeral)}
              </td>
              <td className="p-1.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bloco de Assinaturas e Conferência */}
      <div className="pt-6 mt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[9px] sm:text-[9.5px] evitar-quebra break-inside-avoid">
        <div>
          <div className="border-t border-slate-900 pt-1 font-bold">
            {usuarioGeradorNome}
          </div>
          <div className="text-slate-600">Responsável pela Emissão / Prestação de Contas</div>
        </div>
        <div>
          <div className="border-t border-slate-900 pt-1 font-bold">
            Controle Interno / Financeiro ABEAS
          </div>
          <div className="text-slate-600">Visto e Conferência Financeira</div>
        </div>
      </div>
    </div>
  );
};
