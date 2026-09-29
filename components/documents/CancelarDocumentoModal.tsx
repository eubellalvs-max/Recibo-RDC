'use client';

import React, { useState } from 'react';
import { Documento } from '@/lib/types';
import { formatarMoeda } from '@/lib/masks';
import { AlertTriangle, X, Check, XCircle } from 'lucide-react';

interface CancelarDocumentoModalProps {
  isOpen: boolean;
  documento: Documento | null;
  onClose: () => void;
  onConfirm: (id: string, motivo: string) => void;
}

export function CancelarDocumentoModal({
  isOpen,
  documento,
  onClose,
  onConfirm,
}: CancelarDocumentoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !documento) return null;

  const tipoLabel =
    documento.tipo === 'recibo_medico'
      ? 'Recibo Médico'
      : documento.tipo === 'recibo'
      ? 'Recibo'
      : 'RDC';

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    const motivoLimpo = motivo.trim();
    if (!motivoLimpo || motivoLimpo.length < 5) {
      setErro('Informe uma justificativa válida com no mínimo 5 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      onConfirm(documento.id, motivoLimpo);
      setMotivo('');
      setErro(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cancelar {tipoLabel}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Nº {documento.numero}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo do Documento */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Valor do Documento:</span>
            <span className="font-bold text-slate-900">{formatarMoeda(documento.valor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Destinatário / Pagador:</span>
            <span className="font-medium truncate max-w-[200px]">
              {documento.recibo_medico_detalhes?.pagador_nome || 'Empresa Destinatária'}
            </span>
          </div>
        </div>

        {/* Formulário de Motivo */}
        <form onSubmit={handleConfirmar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo do Cancelamento *
            </label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErro(null);
              }}
              placeholder="Descreva a razão do cancelamento (ex: Erro no valor digitado, duplicidade, desistência do cliente...)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-red-600 outline-none resize-none"
            />
            {erro && (
              <p className="text-[11px] text-red-600 font-medium mt-1">
                {erro}
              </p>
            )}
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-tight">
            Atenção: O cancelamento manterá o documento registrado no histórico com a respectiva justificativa e o identificador do operador responsável.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{submitting ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
