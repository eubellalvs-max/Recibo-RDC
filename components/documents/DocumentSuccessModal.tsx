'use client';

import React from 'react';
import { Documento } from '@/lib/types';
import { CheckCircle2, Eye, Printer, FileDown, Plus, X } from 'lucide-react';
import { formatarMoeda } from '@/lib/masks';

interface DocumentSuccessModalProps {
  documento: Documento | null;
  isOpen: boolean;
  onClose: () => void;
  onVisualizar: (doc: Documento) => void;
  onImprimir: (doc: Documento) => void;
  onNovoRecibo: () => void;
  onNovoRdc: () => void;
}

export function DocumentSuccessModal({
  documento,
  isOpen,
  onClose,
  onVisualizar,
  onImprimir,
  onNovoRecibo,
  onNovoRdc,
}: DocumentSuccessModalProps) {
  if (!isOpen || !documento) return null;

  const isRecibo = documento.tipo === 'recibo';
  const tituloTipo = isRecibo ? 'RECIBO' : 'RDC';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Ícone de Sucesso */}
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {tituloTipo} EMITIDO COM SUCESSO!
        </h3>

        <div className="my-3 inline-block px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 font-mono">
          Nº {documento.numero}
        </div>

        <div className="text-xs text-slate-500 mb-6">
          Valor emitido: <b className="text-slate-800 tabular-nums">{formatarMoeda(documento.valor)}</b>
        </div>

        {/* Grade de Ações */}
        <div className="space-y-2.5">
          <button
            onClick={() => onVisualizar(documento)}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>VISUALIZAR DOCUMENTO</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onImprimir(documento)}
              className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>IMPRIMIR / PDF</span>
            </button>

            {isRecibo ? (
              <button
                onClick={onNovoRecibo}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>NOVO RECIBO</span>
              </button>
            ) : (
              <button
                onClick={onNovoRdc}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>NOVO RDC</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Fechar janela
          </button>
        </div>
      </div>
    </div>
  );
}
