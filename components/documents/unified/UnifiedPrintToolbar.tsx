'use client';

import React, { useState } from 'react';
import { ArrowLeft, Printer, FileDown, Check, X, Edit3, Loader2 } from 'lucide-react';
import { usePrint, dispararImpressaoUniversal } from '@/lib/printContext';
import { imprimirViaIframe } from '@/lib/printService';

interface UnifiedPrintToolbarProps {
  titulo: string;
  subtitulo?: string;
  isPreVisualizacao?: boolean;
  onVoltarEdicao?: () => void;
  onConfirmarEmissao?: () => void;
  textoConfirmar?: string;
  onEditar?: () => void;
  onFechar?: () => void;
  isSubmitting?: boolean;
  documentoNumero?: string;
  tipoDocumento?: string;
  viaAtual?: '1' | '2';
  onChangeVia?: (via: '1' | '2') => void;
}

export const UnifiedPrintToolbar: React.FC<UnifiedPrintToolbarProps> = ({
  titulo,
  subtitulo,
  isPreVisualizacao = false,
  onVoltarEdicao,
  onConfirmarEmissao,
  textoConfirmar,
  onEditar,
  onFechar,
  isSubmitting = false,
  documentoNumero = '',
  tipoDocumento = 'Documento',
  viaAtual,
  onChangeVia,
}) => {
  const { activePrintItem, imprimirItem } = usePrint();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async (isPdf = false) => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const cleanNum = documentoNumero ? documentoNumero.replace(/[\/\\]/g, '-') : 'doc';
      const tipoSanitizado = tipoDocumento.toLowerCase().replace(/\s+/g, '_');
      const docTitle = `${tipoSanitizado}_${cleanNum}`;

      if (activePrintItem) {
        await imprimirItem(activePrintItem, docTitle);
      } else {
        const sheetEl = document.querySelector('.receipt-sheet, .receipt-sheet-rdc, .receipt-sheet-medico, .receipt-relatorio, #print-receipt');
        if (sheetEl && sheetEl.innerHTML && sheetEl.innerHTML.trim().length > 30) {
          const success = await imprimirViaIframe(sheetEl.outerHTML, {
            title: docTitle,
            orientation: tipoDocumento.toLowerCase().includes('relatorio') ? 'landscape' : 'portrait',
          });
          if (success) return;
        }
        await dispararImpressaoUniversal({ tipo: 'recibo', numero: cleanNum }, docTitle);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-200 bg-slate-50 rounded-t-xl shrink-0 transition-colors">
      <div className="flex items-center gap-3">
        {isPreVisualizacao && onVoltarEdicao && (
          <button
            type="button"
            onClick={onVoltarEdicao}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            title="Voltar para a edição dos dados"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para edição</span>
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              {titulo}
            </span>
            {isPreVisualizacao && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                PRÉ-VISUALIZAÇÃO FIEL
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-[11px] text-slate-500">
              {subtitulo}
            </p>
          )}
        </div>

        {viaAtual && onChangeVia && (
          <div className="flex items-center bg-slate-200/80 rounded-md p-0.5 text-[11px] font-medium text-slate-700 ml-2">
            <button
              type="button"
              onClick={() => onChangeVia('1')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viaAtual === '1'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : ''
              }`}
            >
              1ª Via
            </button>
            <button
              type="button"
              onClick={() => onChangeVia('2')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viaAtual === '2'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : ''
              }`}
            >
              2ª Via
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {/* Botão Editar Documento (quando disponível fora do preview) */}
        {!isPreVisualizacao && onEditar && (
          <button
            type="button"
            onClick={onEditar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
            title="Editar este documento (mantendo o mesmo número)"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Editar</span>
          </button>
        )}

        {/* Botão Imprimir */}
        <button
          type="button"
          disabled={isPrinting}
          onClick={() => handlePrint(false)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          title="Imprimir documento em escala 100%"
        >
          {isPrinting ? (
            <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{isPrinting ? 'Preparando...' : 'Imprimir'}</span>
        </button>

        {/* Botão Salvar em PDF */}
        <button
          type="button"
          disabled={isPrinting}
          onClick={() => handlePrint(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          title="Salvar como arquivo PDF fiel à impressão"
        >
          {isPrinting ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{isPrinting ? 'Preparando...' : 'Salvar em PDF'}</span>
        </button>

        {/* Se estiver no modo de Pré-Visualização: Botão de Confirmar e Emitir */}
        {isPreVisualizacao && onConfirmarEmissao && (
          <button
            type="button"
            disabled={isSubmitting || isPrinting}
            onClick={onConfirmarEmissao}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? (textoConfirmar ? 'Salvando...' : 'Emitindo...') : (textoConfirmar || 'Confirmar e Emitir')}</span>
          </button>
        )}

        {/* Botão Fechar Modal se fornecido */}
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
