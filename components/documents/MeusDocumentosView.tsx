'use client';

import React, { useState } from 'react';
import { Usuario, Documento, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr } from '@/lib/masks';
import { Search, Eye, Printer, XCircle, Filter, Calendar, Info } from 'lucide-react';
import { CancelarDocumentoModal } from './CancelarDocumentoModal';

interface MeusDocumentosViewProps {
  currentUser: Usuario;
  onVisualizarDocumento: (doc: Documento) => void;
  onNovoRecibo: () => void;
  onNovoRdc: () => void;
  onNovoReciboMedico?: () => void;
}

export function MeusDocumentosView({
  currentUser,
  onVisualizarDocumento,
  onNovoRecibo,
  onNovoRdc,
  onNovoReciboMedico,
}: MeusDocumentosViewProps) {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'recibo' | 'rdc' | 'recibo_medico'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [documentos, setDocumentos] = useState<Documento[]>(() =>
    StorageService.getDocumentos()
  );
  const [docParaCancelar, setDocParaCancelar] = useState<Documento | null>(null);

  const empresas = StorageService.getEmpresas();

  // Filtragem dos documentos
  const docsFiltrados = documentos.filter((doc) => {
    // Se for emissor comum, só vê os seus próprios (se for admin, vê todos)
    if (currentUser.perfil !== 'admin' && doc.usuario_id !== currentUser.id) {
      return false;
    }

    // Tipo
    if (tipoFiltro !== 'todos' && doc.tipo !== tipoFiltro) {
      return false;
    }

    // Período
    if (dataInicio && doc.data_emissao < dataInicio) {
      return false;
    }
    if (dataFim && doc.data_emissao > dataFim) {
      return false;
    }

    // Texto de busca
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const numMatch = doc.numero.toLowerCase().includes(q);
      const refMatch = doc.referente.toLowerCase().includes(q);
      const compMatch = doc.competencia?.toLowerCase().includes(q) || false;

      const empEmissora = empresas.find((e) => e.id === doc.empresa_emissora_id);
      const empDestinataria = empresas.find((e) => e.id === doc.empresa_destinataria_id);

      const emissoraMatch =
        empEmissora?.razao_social.toLowerCase().includes(q) ||
        empEmissora?.nome_fantasia.toLowerCase().includes(q) ||
        empEmissora?.cnpj.includes(q) ||
        false;

      const destinatariaMatch =
        empDestinataria?.razao_social.toLowerCase().includes(q) ||
        empDestinataria?.nome_fantasia.toLowerCase().includes(q) ||
        empDestinataria?.cnpj.includes(q) ||
        false;

      return numMatch || refMatch || compMatch || emissoraMatch || destinatariaMatch;
    }

    return true;
  });

  const getNomeEmpresa = (id: string) => {
    const emp = empresas.find((e) => e.id === id);
    return emp ? emp.nome_fantasia || emp.razao_social : 'Não identificada';
  };

  const handleAbrirCancelamento = (doc: Documento) => {
    setDocParaCancelar(doc);
  };

  const handleConfirmarCancelamento = (id: string, motivo: string) => {
    StorageService.cancelarDocumento(id, currentUser, motivo);
    setDocumentos(StorageService.getDocumentos());
  };

  const totalValor = docsFiltrados
    .filter((d) => d.status === 'emitido')
    .reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentUser.perfil === 'admin' ? 'Todos os Documentos' : 'Meus Documentos'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consulta, visualização e emissão de segundas vias de Recibos e RDC
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNovoReciboMedico && (
            <button
              onClick={onNovoReciboMedico}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
            >
              + Recibo Médico
            </button>
          )}
          <button
            onClick={onNovoRecibo}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            + Novo Recibo
          </button>
          <button
            onClick={onNovoRdc}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            + Novo RDC
          </button>
        </div>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Busca por texto */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nº documento, razão social, CNPJ ou referente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-slate-800 dark:focus:border-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tipo de Documento
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-slate-800 dark:focus:border-slate-500 outline-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="recibo">Somente Recibos</option>
              <option value="recibo_medico">Recibos Médicos</option>
              <option value="rdc">Somente RDC</option>
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Período de Emissão
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                title="Data inicial"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                title="Data final"
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Resumo do filtro */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span>Exibindo <b>{docsFiltrados.length}</b> documento(s)</span>
            {(busca || tipoFiltro !== 'todos' || dataInicio || dataFim) && (
              <button
                onClick={() => {
                  setBusca('');
                  setTipoFiltro('todos');
                  setDataInicio('');
                  setDataFim('');
                }}
                className="ml-3 text-slate-700 dark:text-slate-300 hover:underline font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="text-right">
            <span>Volume total filtrado: <b className="text-slate-900 dark:text-white tabular-nums">{formatarMoeda(totalValor)}</b></span>
          </div>
        </div>
      </div>

      {/* Tabela de Documentos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-colors">
        {docsFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum documento encontrado com os critérios selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold">
                <tr>
                  <th className="px-4 py-3">Nº Documento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Destinatário (Pagador)</th>
                  <th className="px-4 py-3">Emissor (Recebedor)</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {docsFiltrados.map((doc) => {
                  const isRecibo = doc.tipo === 'recibo';
                  const isCancelado = doc.status === 'cancelado';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        isCancelado ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-950 dark:text-white whitespace-nowrap">
                        {doc.numero}
                        {doc.competencia && (
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-sans font-medium">
                            Comp: {doc.competencia}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-bold ${
                            doc.tipo === 'recibo_medico'
                              ? 'text-teal-800 bg-teal-100 dark:text-teal-200 dark:bg-teal-950/80 px-2 py-0.5 rounded'
                              : isRecibo
                              ? 'text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/80 px-2 py-0.5 rounded'
                              : 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-950/80 px-2 py-0.5 rounded'
                          }`}
                        >
                          {doc.tipo === 'recibo_medico'
                            ? 'REC.M'
                            : isRecibo
                            ? 'REC.'
                            : 'RDC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                        {doc.recibo_medico_detalhes?.pagador_nome ||
                          getNomeEmpresa(doc.empresa_destinataria_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium max-w-[180px] truncate">
                        {doc.recibo_medico_detalhes
                          ? 'ABEAS - Assistência Social'
                          : getNomeEmpresa(doc.empresa_emissora_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                        {formatarDataBr(doc.data_emissao)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-950 dark:text-white tabular-nums whitespace-nowrap">
                        {formatarMoeda(doc.valor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCancelado
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {isCancelado ? 'Cancelado' : 'Emitido'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onVisualizarDocumento(doc)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Visualizar documento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onVisualizarDocumento(doc)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Imprimir / PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {currentUser.perfil === 'admin' && !isCancelado && (
                            <button
                              onClick={() => handleAbrirCancelamento(doc)}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                              title="Cancelar documento"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação e Justificativa de Cancelamento */}
      <CancelarDocumentoModal
        isOpen={!!docParaCancelar}
        documento={docParaCancelar}
        onClose={() => setDocParaCancelar(null)}
        onConfirm={handleConfirmarCancelamento}
      />
    </div>
  );
}
