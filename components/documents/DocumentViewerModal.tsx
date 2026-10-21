'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Documento, Empresa, TipoGastoConfig, TipoDocConfig } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarDataBr } from '@/lib/masks';
import { AlertCircle } from 'lucide-react';
import { usePrint } from '@/lib/printContext';
import { UnifiedPrintToolbar } from './unified/UnifiedPrintToolbar';
import { UnifiedReciboPrint } from './unified/UnifiedReciboPrint';
import { UnifiedReciboMedicoPrint } from './unified/UnifiedReciboMedicoPrint';
import { UnifiedRdcPrint } from './unified/UnifiedRdcPrint';

interface DocumentViewerModalProps {
 documento: Documento | null;
 isOpen: boolean;
 onClose: () => void;
 onEditar?: (doc: Documento) => void;
}

export function DocumentViewerModal({
 documento,
 isOpen,
 onClose,
 onEditar,
}: DocumentViewerModalProps) {
 const [via, setVia] = useState<'1' | '2'>('1');
 const { setActivePrintItem } = usePrint();

 const empresas = StorageService.getEmpresas();
 const config = StorageService.getConfig();

 const emissora: Empresa | undefined = documento
 ? empresas.find((e) => e.id === documento.empresa_emissora_id)
 : undefined;
 const destinataria: Empresa | undefined = documento
 ? empresas.find((e) => e.id === documento.empresa_destinataria_id)
 : undefined;

 const isRdc = documento?.tipo === 'rdc';
 const isReciboMedico = documento?.tipo === 'recibo_medico';
 const rdc = documento?.rdc_detalhes;
 const med = documento?.recibo_medico_detalhes;

 const tiposGasto: TipoGastoConfig[] = useMemo(
   () => config.tipos_gasto || StorageService.getTiposGasto(),
   [config.tipos_gasto]
 );
 const tiposDoc: TipoDocConfig[] = useMemo(
   () => config.tipos_doc || StorageService.getTiposDoc(),
   [config.tipos_doc]
 );

 const tituloDocumento = isRdc
 ? 'RDC - PRESTAÇÃO DE CONTAS'
 : isReciboMedico
 ? 'RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS'
 : 'RECIBO';

 useEffect(() => {
 if (!isOpen || !documento) {
 setActivePrintItem(null);
 return;
 }

 if (isRdc && rdc) {
 setActivePrintItem({
 tipo: 'rdc',
 numero: documento.numero,
 dadosRdc: {
 numero: documento.numero,
 detalhes: rdc,
 tiposGasto,
 tiposDoc,
 },
 });
 } else if (isReciboMedico && med) {
 setActivePrintItem({
 tipo: 'recibo_medico',
 numero: documento.numero,
 dadosReciboMedico: {
 numero: documento.numero,
 valor: documento.valor,
 valor_extenso: documento.valor_extenso,
 data_emissao: documento.data_emissao,
 usuario_nome: documento.usuario_nome,
 detalhes: med,
 },
 });
 } else {
 setActivePrintItem({
 tipo: 'recibo',
 numero: documento.numero,
 via,
 dadosRecibo: {
 numero: documento.numero,
 valor: documento.valor,
 valor_extenso: documento.valor_extenso,
 referente: documento.referente,
 data_emissao: documento.data_emissao,
 cidade_emissao: documento.cidade_emissao,
 observacoes: documento.observacoes,
 logo_url: documento.logo_url,
 usuario_nome: documento.usuario_nome,
 emissora,
 destinataria,
 config,
 },
 });
 }

 return () => {
 setActivePrintItem(null);
 };
 }, [
 isOpen,
 documento?.id,
 documento?.numero,
 via,
 setActivePrintItem,
 ]);

 if (!isOpen || !documento) return null;

 return (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[94vh] transition-colors print-modal-content">
 {/* Barra Superior de Ações Unificada */}
 <div className="no-print relative">
 <UnifiedPrintToolbar
 titulo={tituloDocumento}
 subtitulo={`Nº ${documento.numero} • Emitido em ${formatarDataBr(documento.data_emissao)}`}
 isPreVisualizacao={false}
 onFechar={onClose}
 onEditar={documento.status !== 'cancelado' && onEditar ? () => onEditar(documento) : undefined}
 documentoNumero={documento.numero}
 tipoDocumento={tituloDocumento}
 viaAtual={!isRdc && !isReciboMedico ? via : undefined}
 onChangeVia={!isRdc && !isReciboMedico ? setVia : undefined}
 />
 </div>

 {/* Banner de Auditoria de Edição / Correção */}
 {documento.updated_at && documento.status !== 'cancelado' && (
 <div className="no-print bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs text-blue-900 flex items-center justify-between shrink-0">
 <div className="flex items-center gap-2">
 <span className="font-bold uppercase tracking-wider text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
 DOCUMENTO CORRIGIDO / EDITADO
 </span>
 <span className="text-[11px] text-blue-800">
 Última alteração em <b>{new Date(documento.updated_at).toLocaleString('pt-BR')}</b> por <b>{documento.usuario_edicao_nome || 'Operador'}</b>
 </span>
 </div>
 {documento.historico_edicoes && documento.historico_edicoes[0]?.detalhes && (
 <span className="text-[10px] text-blue-700 italic truncate max-w-sm" title={documento.historico_edicoes[0].detalhes}>
 &ldquo;{documento.historico_edicoes[0].detalhes}&rdquo;
 </span>
 )}
 </div>
 )}

 {/* Banner de Auditoria de Cancelamento */}
 {documento.status === 'cancelado' && (
 <div className="no-print bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-800 flex items-start gap-2.5 shrink-0">
 <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
 <div className="leading-tight">
 <span className="font-bold uppercase tracking-wider text-red-700 ">DOCUMENTO CANCELADO</span>
 <div className="text-[11px] text-red-600 mt-0.5">
 <span>Data do Cancelamento: <b>{documento.data_cancelamento ? new Date(documento.data_cancelamento).toLocaleString('pt-BR') : 'Não registrada'}</b></span>
 <span className="mx-2">•</span>
 <span>Responsável: <b>{documento.usuario_cancelamento_nome || 'Sistema'}</b></span>
 </div>
 {documento.motivo_cancelamento && (
 <div className="text-[11px] text-red-700 mt-1 italic">
 Motivo: &ldquo;{documento.motivo_cancelamento}&rdquo;
 </div>
 )}
 </div>
 </div>
 )}

 {/* Conteúdo com Scroll na tela e formatado para papel timbrado */}
 <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex justify-center transition-colors print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible">
 <div className="print-document w-full flex justify-center">
 {isRdc && rdc ? (
 <UnifiedRdcPrint
 dados={{
 numero: documento.numero,
 detalhes: rdc,
 tiposGasto,
 tiposDoc,
 }}
 />
 ) : isReciboMedico && med ? (
 <UnifiedReciboMedicoPrint
 dados={{
 numero: documento.numero,
 valor: documento.valor,
 valor_extenso: documento.valor_extenso,
 data_emissao: documento.data_emissao,
 usuario_nome: documento.usuario_nome,
 detalhes: med,
 }}
 />
 ) : (
 <UnifiedReciboPrint
 dados={{
 numero: documento.numero,
 valor: documento.valor,
 valor_extenso: documento.valor_extenso,
 referente: documento.referente,
 data_emissao: documento.data_emissao,
 cidade_emissao: documento.cidade_emissao,
 observacoes: documento.observacoes,
 logo_url: documento.logo_url,
 usuario_nome: documento.usuario_nome,
 emissora,
 destinataria,
 }}
 config={config}
 via={via}
 />
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
