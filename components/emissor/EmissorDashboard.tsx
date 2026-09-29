'use client';

import React from 'react';
import { Usuario, Documento, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr, mascaraCnpj } from '@/lib/masks';
import { FileText, PlusCircle, ArrowUpRight, Eye, Printer, FolderOpen, Building2, HeartPulse } from 'lucide-react';

interface EmissorDashboardProps {
  currentUser: Usuario;
  onOpenNovoRecibo: () => void;
  onOpenNovoRdc: () => void;
  onOpenNovoReciboMedico?: () => void;
  onVisualizarDocumento: (doc: Documento) => void;
  onVerTodosDocumentos: () => void;
  onIrParaEmpresas?: () => void;
}

export function EmissorDashboard({
  currentUser,
  onOpenNovoRecibo,
  onOpenNovoRdc,
  onOpenNovoReciboMedico,
  onVisualizarDocumento,
  onVerTodosDocumentos,
  onIrParaEmpresas,
}: EmissorDashboardProps) {
  const todosDocs = StorageService.getDocumentos();
  const empresas = StorageService.getEmpresas();

  // Filtrar documentos emitidos por este usuário (ou todos se for admin)
  const meusDocs = todosDocs.filter(
    (d) => currentUser.perfil === 'admin' || d.usuario_id === currentUser.id
  );

  const totalValorMeusDocs = meusDocs
    .filter((d) => d.status === 'emitido')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const recibosCount = meusDocs.filter((d) => d.tipo === 'recibo' && d.status === 'emitido').length;
  const recibosMedicosCount = meusDocs.filter((d) => d.tipo === 'recibo_medico' && d.status === 'emitido').length;
  const rdcCount = meusDocs.filter((d) => d.tipo === 'rdc' && d.status === 'emitido').length;

  const ultimosDocs = meusDocs.slice(0, 5);

  const getNomeEmpresa = (id: string) => {
    const emp = empresas.find((e) => e.id === id);
    return emp ? emp.nome_fantasia || emp.razao_social : 'Empresa';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Mensagem de Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Olá, {currentUser.nome.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selecione uma das opções abaixo para iniciar uma nova emissão instantânea.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onIrParaEmpresas && (
            <button
              onClick={onIrParaEmpresas}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Cadastrar Empresas ({empresas.length})</span>
            </button>
          )}

          <button
            onClick={onVerTodosDocumentos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Meus Documentos ({meusDocs.length})</span>
          </button>
        </div>
      </div>

      {/* Cards de Ação Principal: O que você deseja emitir ou cadastrar? */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          O que você deseja emitir ou gerenciar hoje?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Recibo Médico */}
          {onOpenNovoReciboMedico && (
            <button
              onClick={onOpenNovoReciboMedico}
              className="group text-left p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-500 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Emitir <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-950 dark:group-hover:text-emerald-300">
                  RECIBO MÉDICO
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Serviços médicos particulares • Modelo Oficial ABEAS com numeração automática 001/2026.
                </p>
              </div>
            </button>
          )}

          {/* Card Novo Recibo */}
          <button
            onClick={onOpenNovoRecibo}
            className="group text-left p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                🧾
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Emitir <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white">
                RECIBO COMUM
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Comprovante padrão com logotipo de empresas, numeração sequencial e extenso.
              </p>
            </div>
          </button>

          {/* Card Novo RDC */}
          <button
            onClick={onOpenNovoRdc}
            className="group text-left p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-500 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                📄
              </div>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Emitir <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-300">
                RDC
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Prestação de contas de viagem ou despesas corporativas no modelo oficial ABEAS.
              </p>
            </div>
          </button>

          {/* Card Cadastro de Empresa */}
          {onIrParaEmpresas && (
            <button
              onClick={onIrParaEmpresas}
              className="group text-left p-5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-500 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                  🏢
                </div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Cadastrar <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-900 dark:group-hover:text-amber-300">
                  EMPRESAS
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Cadastre empresas emissoras ou pagadoras e vincule seus logos oficiais.
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Métricas Resumidas do Emissor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Total Emitido por Você
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatarMoeda(totalValorMeusDocs)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {meusDocs.length} documentos gerados
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Recibos Emitidos
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {recibosCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Com numeração sequencial
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            RDC Emitidos
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1 tabular-nums">
            {rdcCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Com competência informada
          </div>
        </div>
      </div>

      {/* Últimos Documentos Emitidos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Últimos Documentos Emitidos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Histórico recente de emissões geradas</p>
          </div>
          <button
            onClick={onVerTodosDocumentos}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline"
          >
            Ver todos
          </button>
        </div>

        {ultimosDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum documento emitido até o momento. Clique em &quot;Novo Recibo&quot; ou &quot;Novo RDC&quot; para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Destinatário</th>
                  <th className="px-4 py-3">Emissor</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ultimosDocs.map((doc) => {
                  const isRecibo = doc.tipo === 'recibo';
                  const isReciboMedico = doc.tipo === 'recibo_medico';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {doc.numero}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold ${
                            isReciboMedico
                              ? 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/60 px-2 py-0.5 rounded'
                              : isRecibo
                              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 px-2 py-0.5 rounded'
                              : 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/60 px-2 py-0.5 rounded'
                          }`}
                        >
                          {isReciboMedico ? 'REC.M' : isRecibo ? 'REC.' : 'RDC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {getNomeEmpresa(doc.empresa_destinataria_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                        {getNomeEmpresa(doc.empresa_emissora_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatarDataBr(doc.data_emissao)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatarMoeda(doc.valor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onVisualizarDocumento(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>Visualizar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
