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
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 transition-colors">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cancelar {tipoLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Nº {documento.numero}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo do Documento */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Valor do Documento:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatarMoeda(documento.valor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Destinatário / Pagador:</span>
            <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
              {documento.recibo_medico_detalhes?.pagador_nome || 'Empresa Destinatária'}
            </span>
          </div>
        </div>

        {/* Formulário de Motivo */}
        <form onSubmit={handleConfirmar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo do Cancelamento *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do cancelamento para fins de auditoria e conformidade fiscal..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-750 focus:border-red-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              O cancelamento fica registrado no histórico e não poderá ser desfeito.
            </p>
          </div>

          {erro && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-lg text-red-700 dark:text-red-300 text-xs">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
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
