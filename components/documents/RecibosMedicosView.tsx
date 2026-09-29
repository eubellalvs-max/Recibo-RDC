'use client';

import React, { useState } from 'react';
import { Usuario, Documento } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr } from '@/lib/masks';
import { CancelarDocumentoModal } from './CancelarDocumentoModal';
import {
  HeartPulse,
  Plus,
  Search,
  Eye,
  Printer,
  XCircle,
  RotateCcw,
  Calendar,
  Filter,
  CheckCircle2,
  Download,
  User,
  Stethoscope,
} from 'lucide-react';

interface RecibosMedicosViewProps {
  currentUser: Usuario;
  onVisualizar: (doc: Documento) => void;
  onNovoReciboMedico: (initialData?: any) => void;
}

export function RecibosMedicosView({
  currentUser,
  onVisualizar,
  onNovoReciboMedico,
}: RecibosMedicosViewProps) {
  const [documentos, setDocumentos] = useState<Documento[]>(() =>
    StorageService.getDocumentos().filter((d) => d.tipo === 'recibo_medico')
  );

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'emitido' | 'cancelado'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [docParaCancelar, setDocParaCancelar] = useState<Documento | null>(null);

  const recarregar = () => {
    setDocumentos(
      StorageService.getDocumentos().filter((d) => d.tipo === 'recibo_medico')
    );
  };

  const handleAbrirCancelar = (doc: Documento) => {
    setDocParaCancelar(doc);
  };

  const handleConfirmarCancelamento = (id: string, motivo: string) => {
    StorageService.cancelarDocumento(id, currentUser, motivo);
    recarregar();
  };

  const handleReemitir = (doc: Documento) => {
    if (!doc.recibo_medico_detalhes) return;
    onNovoReciboMedico({
      ...doc.recibo_medico_detalhes,
      valor: doc.valor,
    });
  };

  const handleImprimir = (doc: Documento) => {
    onVisualizar(doc);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Filtragem
  const docsFiltrados = documentos.filter((doc) => {
    const med = doc.recibo_medico_detalhes;

    if (filtroStatus !== 'todos' && doc.status !== filtroStatus) {
      return false;
    }

    if (dataInicio && doc.data_emissao < dataInicio) {
      return false;
    }
    if (dataFim && doc.data_emissao > dataFim) {
      return false;
    }

    if (busca.trim()) {
      const q = busca.toLowerCase();
      const numMatch = doc.numero.toLowerCase().includes(q);
      const pagadorMatch = med?.pagador_nome.toLowerCase().includes(q);
      const pacienteMatch = med?.paciente_nome.toLowerCase().includes(q);
      const servicoMatch = med?.servico_prestado.toLowerCase().includes(q);
      const medicoMatch = med?.medico_assistente.toLowerCase().includes(q);
      const docPagadorMatch = med?.pagador_documento.includes(q);
      const docPacienteMatch = med?.paciente_cpf.includes(q);

      return (
        numMatch ||
        pagadorMatch ||
        pacienteMatch ||
        servicoMatch ||
        medicoMatch ||
        docPagadorMatch ||
        docPacienteMatch
      );
    }

    return true;
  });

  const totalEmitidos = documentos.filter((d) => d.status === 'emitido').length;
  const valorTotal = documentos
    .filter((d) => d.status === 'emitido')
    .reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              RECIBOS MÉDICOS EMITIDOS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de recibos de prestação de serviços médicos particulares da ABEAS
            </p>
          </div>
        </div>

        <button
          onClick={() => onNovoReciboMedico()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>EMITIR RECIBO MÉDICO</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Recibos Emitidos
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {totalEmitidos}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Recibos válidos registrados
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Faturamento Total Médico
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {formatarMoeda(valorTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Soma dos atendimentos realizados
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Próximo Sequencial
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono mt-1">
            {StorageService.getProximoNumeroReciboMedico()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Controle automático ABEAS
          </div>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Buscar por Pagador, Paciente ou Nº Recibo
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF, serviço ou número..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status do Recibo
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="emitido">Emitidos (Válidos)</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>{docsFiltrados.length} recibo(s) encontrado(s)</span>
          {(busca || filtroStatus !== 'todos' || dataInicio || dataFim) && (
            <button
              onClick={() => {
                setBusca('');
                setFiltroStatus('todos');
                setDataInicio('');
                setDataFim('');
              }}
              className="text-slate-700 hover:underline font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Recibos Médicos Conforme Especificação 15 */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Nº Recibo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Pagador</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Forma de Pagamento</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-40">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum recibo médico encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                docsFiltrados.map((doc) => {
                  const med = doc.recibo_medico_detalhes;
                  const isCancelado = doc.status === 'cancelado';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCancelado ? 'opacity-50 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* Nº Recibo */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900">
                          {doc.numero}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {med?.servico_prestado}
                        </div>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatarDataBr(doc.data_emissao)}
                      </td>

                      {/* Pagador */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {med?.pagador_nome || '---'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {med?.pagador_documento}
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {med?.paciente_nome || '---'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          CPF: {med?.paciente_cpf}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatarMoeda(doc.valor)}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {med?.forma_pagamento || 'Pix'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            !isCancelado
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700 line-through'
                          }`}
                        >
                          {doc.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onVisualizar(doc)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Visualizar Recibo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleImprimir(doc)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Imprimir / Baixar PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReemitir(doc)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reemitir (Novo com mesmos dados)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {!isCancelado && (
                            <button
                              onClick={() => handleAbrirCancelar(doc)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar Recibo"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cancelamento com Justificativa */}
      <CancelarDocumentoModal
        isOpen={!!docParaCancelar}
        documento={docParaCancelar}
        onClose={() => setDocParaCancelar(null)}
        onConfirm={handleConfirmarCancelamento}
      />
    </div>
  );
}
