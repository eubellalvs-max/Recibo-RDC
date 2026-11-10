'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa, Documento, RetencaoImpostosRecibo } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj, mascaraCpf, formatarMoeda, dataHojeIso } from '@/lib/masks';
import { valorPorExtenso } from '@/lib/extenso';
import { calcularIrrfProgressivo, recalcularIrrfManual } from '@/lib/tributos';
import { X, Check, AlertCircle, Upload, Eye, RotateCcw, Calculator, Info } from 'lucide-react';
import { usePrint } from '@/lib/printContext';
import { UnifiedPrintToolbar } from './unified/UnifiedPrintToolbar';
import { UnifiedReciboPrint } from './unified/UnifiedReciboPrint';

interface NovoReciboModalProps {
 currentUser: Usuario;
 isOpen: boolean;
 onClose: () => void;
 onDocumentCreated?: (doc: Documento) => void;
 onSuccess?: (doc: Documento) => void;
 documentoEmEdicao?: Documento | null;
}

export function NovoReciboModal({
 currentUser,
 isOpen,
 onClose,
 onDocumentCreated,
 onSuccess,
 documentoEmEdicao,
}: NovoReciboModalProps) {
 const isEdicao = !!documentoEmEdicao;

 const [empresas] = useState<Empresa[]>(() => {
 return StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 });

 const [empresaEmissoraId, setEmpresaEmissoraId] = useState<string>(() => {
 if (documentoEmEdicao?.empresa_emissora_id) {
 return documentoEmEdicao.empresa_emissora_id;
 }
 const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const permitidas = all.filter((e) => {
 if (e.tipo !== 'emissora' && e.tipo !== 'ambas') return false;
 if (currentUser.perfil === 'admin') return true;
 if (!currentUser.empresas_permitidas || currentUser.empresas_permitidas.length === 0) {
 return true;
 }
 return currentUser.empresas_permitidas.includes(e.id);
 });
 return permitidas[0]?.id || '';
 });

 const [logoUrl, setLogoUrl] = useState<string>(() => {
 if (documentoEmEdicao && documentoEmEdicao.logo_url !== undefined) {
 return documentoEmEdicao.logo_url || '';
 }
 const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const permitidas = all.filter((e) => {
 if (e.tipo !== 'emissora' && e.tipo !== 'ambas') return false;
 if (currentUser.perfil === 'admin') return true;
 if (!currentUser.empresas_permitidas || currentUser.empresas_permitidas.length === 0) {
 return true;
 }
 return currentUser.empresas_permitidas.includes(e.id);
 });
 return permitidas[0]?.logo_url || '';
 });

 const [empresaDestinatariaId, setEmpresaDestinatariaId] = useState<string>(() => {
 if (documentoEmEdicao?.empresa_destinataria_id) {
 return documentoEmEdicao.empresa_destinataria_id;
 }
 const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const destinatarias = all.filter(
 (e) => e.tipo === 'destinataria' || e.tipo === 'ambas'
 );
 return destinatarias[0]?.id || '';
 });

 const [valorRaw, setValorRaw] = useState(() => {
 if (documentoEmEdicao?.valor !== undefined) {
 return documentoEmEdicao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 }
 return '0,00';
 });
 const [valorNumerico, setValorNumerico] = useState(() => documentoEmEdicao?.valor ?? 0);
 const [valorExtenso, setValorExtenso] = useState(() => {
 if (documentoEmEdicao?.valor_extenso) return documentoEmEdicao.valor_extenso;
 if (documentoEmEdicao?.valor && documentoEmEdicao.valor > 0) return valorPorExtenso(documentoEmEdicao.valor);
 return '';
 });
 const [referente, setReferente] = useState(() => {
 return documentoEmEdicao?.referente || '';
 });
 const [dataEmissao, setDataEmissao] = useState(() => documentoEmEdicao?.data_emissao || dataHojeIso());
 const [cidadeEmissao, setCidadeEmissao] = useState(() => {
 if (documentoEmEdicao?.cidade_emissao) return documentoEmEdicao.cidade_emissao;
 const config = StorageService.getConfig();
 return config.cidade_padrao || 'Brasília/DF';
 });
 const [observacoes, setObservacoes] = useState(() => documentoEmEdicao?.observacoes || '');
 const [erro, setErro] = useState<string | null>(null);
 const [salvando, setSalvando] = useState(false);
 const [modoPreVisualizar, setModoPreVisualizar] = useState(false);
 const [viaPrevia, setViaPrevia] = useState<'1' | '2'>('1');
 const { setActivePrintItem } = usePrint();

 // Controle de Retenção de Imposto de Renda (IRRF)
 const retencaoOrig = documentoEmEdicao?.retencao_impostos ||
   (documentoEmEdicao?.rdc_detalhes as Record<string, unknown> | undefined)?.__retencao_impostos as RetencaoImpostosRecibo | undefined;
 const [possuiRetencao, setPossuiRetencao] = useState<boolean>(() => retencaoOrig?.possui_retencao ?? false);
 const [modoCalculo, setModoCalculo] = useState<'automatico' | 'manual'>(() => retencaoOrig?.modo_calculo ?? 'automatico');
 const [regraTributaria, setRegraTributaria] = useState<'aluguel_pf' | 'tabela_progressiva' | 'manual'>(() => retencaoOrig?.regra_tributaria ?? 'tabela_progressiva');

 // Valores da Retenção
 const [baseCalculo, setBaseCalculo] = useState<number>(() => retencaoOrig?.base_calculo_irrf ?? (documentoEmEdicao?.valor ?? 0));
 const [aliquotaIr, setAliquotaIr] = useState<number>(() => retencaoOrig?.aliquota_ir ?? 0);
 const [parcelaDeduzir, setParcelaDeduzir] = useState<number>(() => retencaoOrig?.parcela_deduzir_ir ?? 0);
 const [valorIrrf, setValorIrrf] = useState<number>(() => retencaoOrig?.valor_irrf ?? 0);
 const [outrasDeducoes, setOutrasDeducoes] = useState<number>(() => retencaoOrig?.outras_deducoes ?? 0);
 const [descricaoOutrasDeducoes, setDescricaoOutrasDeducoes] = useState<string>(() => retencaoOrig?.descricao_outras_deducoes ?? '');
 const [totalDeducoes, setTotalDeducoes] = useState<number>(() => retencaoOrig?.total_deducoes ?? 0);
 const [valorLiquido, setValorLiquido] = useState<number>(() => retencaoOrig?.valor_liquido ?? (documentoEmEdicao?.valor ?? 0));

 // Funções de recálculo tributário controladas por evento
 const aplicarCalculoAutomatico = (bruto: number, ded: number, regra: 'tabela_progressiva' | 'aluguel_pf' | 'manual') => {
   const forcar27 = regra === 'aluguel_pf' && (bruto - ded) > 4664.68;
   const res = calcularIrrfProgressivo(bruto, ded, forcar27);
   setBaseCalculo(res.baseCalculo);
   setAliquotaIr(res.aliquota);
   setParcelaDeduzir(res.parcelaDeduzir);
   setValorIrrf(res.valorIrrf);
   setTotalDeducoes(res.totalDeducoes);
   setValorLiquido(res.valorLiquido);
 };

 const aplicarRecalculoManual = (
   bruto: number,
   base: number,
   aliq: number,
   parcela: number,
   ded: number,
   irrf: number
 ) => {
   const res = recalcularIrrfManual(bruto, base, aliq, parcela, ded, irrf);
   setTotalDeducoes(res.totalDeducoes);
   setValorLiquido(res.valorLiquido);
 };

 const retencaoObj: RetencaoImpostosRecibo | undefined = useMemo(() => {
   if (!possuiRetencao) return undefined;
   return {
     possui_retencao: true,
     valor_bruto: valorNumerico,
     base_calculo_irrf: baseCalculo,
     aliquota_ir: aliquotaIr,
     parcela_deduzir_ir: parcelaDeduzir,
     valor_irrf: valorIrrf,
     outras_deducoes: outrasDeducoes,
     descricao_outras_deducoes: descricaoOutrasDeducoes.trim() || undefined,
     total_deducoes: totalDeducoes,
     valor_liquido: valorLiquido,
     modo_calculo: modoCalculo,
     regra_tributaria: regraTributaria,
   };
 }, [
   possuiRetencao,
   valorNumerico,
   baseCalculo,
   aliquotaIr,
   parcelaDeduzir,
   valorIrrf,
   outrasDeducoes,
   descricaoOutrasDeducoes,
   totalDeducoes,
   valorLiquido,
   modoCalculo,
   regraTributaria,
 ]);

 const valorFinal = possuiRetencao ? valorLiquido : valorNumerico;
 const valorExtensoFinal = possuiRetencao
   ? (valorPorExtenso(valorLiquido) || valorExtenso)
   : valorExtenso;

 const resetForm = () => {
  setValorRaw('0,00');
  setValorNumerico(0);
  setValorExtenso('');
  setReferente('');
  setObservacoes('');
  setErro(null);
  setSalvando(false);
  setModoPreVisualizar(false);
  setPossuiRetencao(false);
  setModoCalculo('automatico');
  setRegraTributaria('tabela_progressiva');
  setBaseCalculo(0);
  setAliquotaIr(0);
  setParcelaDeduzir(0);
  setValorIrrf(0);
  setOutrasDeducoes(0);
  setDescricaoOutrasDeducoes('');
  setTotalDeducoes(0);
  setValorLiquido(0);
 };

 const config = StorageService.getConfig();
 const anoAtual = config.ano_corrente || new Date().getFullYear();
 const seqNumAtual = StorageService.getProximoNumeroReciboFornecedor(empresaEmissoraId);
 const numeroReciboAuto = isEdicao && documentoEmEdicao
   ? documentoEmEdicao.numero
   : StorageService.formatarNumeroRecibo(seqNumAtual, anoAtual);

 // Filtrar emissoras elegíveis para este usuário
 const emissorasDisponiveis = empresas.filter((e) => {
 if (e.tipo !== 'emissora' && e.tipo !== 'ambas') return false;
 if (currentUser.perfil === 'admin') return true;
 if (!currentUser.empresas_permitidas || currentUser.empresas_permitidas.length === 0) {
 return true;
 }
 return currentUser.empresas_permitidas.includes(e.id);
 });

 // Destinatárias elegíveis
 const destinatariasDisponiveis = empresas.filter(
 (e) => e.tipo === 'destinataria' || e.tipo === 'ambas'
 );

 const empresaEmissoraObj = empresas.find((e) => e.id === empresaEmissoraId);
 const empresaDestinatariaObj = empresas.find((e) => e.id === empresaDestinatariaId);

 // Sincroniza formulário sempre que o documento em edição mudar ou o modal for aberto
 useEffect(() => {
   if (!isOpen) return;

   if (documentoEmEdicao) {
     if (documentoEmEdicao.empresa_emissora_id) {
       setEmpresaEmissoraId(documentoEmEdicao.empresa_emissora_id);
     }
     setLogoUrl(documentoEmEdicao.logo_url || '');
     if (documentoEmEdicao.empresa_destinataria_id) {
       setEmpresaDestinatariaId(documentoEmEdicao.empresa_destinataria_id);
     }

     const ret = documentoEmEdicao.retencao_impostos ||
       (documentoEmEdicao.rdc_detalhes as Record<string, unknown> | undefined)?.__retencao_impostos as RetencaoImpostosRecibo | undefined;
     
     const valorBase = ret?.possui_retencao ? ret.valor_bruto : (documentoEmEdicao.valor ?? 0);
     setValorNumerico(valorBase);
     setValorRaw(valorBase > 0 ? valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00');
     setValorExtenso(documentoEmEdicao.valor_extenso || (valorBase > 0 ? valorPorExtenso(valorBase) : ''));
     setReferente(documentoEmEdicao.referente || '');
     setDataEmissao(documentoEmEdicao.data_emissao || dataHojeIso());
     setCidadeEmissao(documentoEmEdicao.cidade_emissao || config.cidade_padrao || 'Brasília/DF');
     setObservacoes(documentoEmEdicao.observacoes || '');

     if (ret?.possui_retencao) {
       setPossuiRetencao(true);
       setModoCalculo(ret.modo_calculo || 'automatico');
       setRegraTributaria(ret.regra_tributaria || 'tabela_progressiva');
       setBaseCalculo(ret.base_calculo_irrf ?? valorBase);
       setAliquotaIr(ret.aliquota_ir ?? 0);
       setParcelaDeduzir(ret.parcela_deduzir_ir ?? 0);
       setValorIrrf(ret.valor_irrf ?? 0);
       setOutrasDeducoes(ret.outras_deducoes ?? 0);
       setDescricaoOutrasDeducoes(ret.descricao_outras_deducoes ?? '');
       setTotalDeducoes(ret.total_deducoes ?? 0);
       setValorLiquido(ret.valor_liquido ?? (valorBase - (ret.total_deducoes ?? 0)));
     } else {
       setPossuiRetencao(false);
       setModoCalculo('automatico');
       setRegraTributaria('tabela_progressiva');
       setBaseCalculo(0);
       setAliquotaIr(0);
       setParcelaDeduzir(0);
       setValorIrrf(0);
       setOutrasDeducoes(0);
       setDescricaoOutrasDeducoes('');
       setTotalDeducoes(0);
       setValorLiquido(valorBase);
     }
   }
 }, [isOpen, documentoEmEdicao, config.cidade_padrao]);

 useEffect(() => {
 if (!isOpen || !modoPreVisualizar) {
 return;
 }

 setActivePrintItem({
 tipo: 'recibo',
 numero: numeroReciboAuto,
 via: viaPrevia,
 dadosRecibo: {
 numero: numeroReciboAuto,
 valor: valorFinal,
 valor_extenso: valorExtensoFinal,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 logo_url: logoUrl.trim() || undefined,
 usuario_nome: currentUser.nome,
 emissora: empresaEmissoraObj,
 destinataria: empresaDestinatariaObj,
 config,
 retencao_impostos: retencaoObj,
 },
 });

 return () => {
 setActivePrintItem(null);
 };
 }, [
 isOpen,
 modoPreVisualizar,
 viaPrevia,
 numeroReciboAuto,
 valorFinal,
 valorExtensoFinal,
 referente,
 dataEmissao,
 cidadeEmissao,
 observacoes,
 logoUrl,
 empresaEmissoraId,
 empresaDestinatariaId,
 currentUser.nome,
 setActivePrintItem,
 config,
 empresaEmissoraObj,
 empresaDestinatariaObj,
 retencaoObj,
 ]);

 if (!isOpen) return null;

 const handleEmissoraChange = (id: string) => {
 setEmpresaEmissoraId(id);
 const selected = empresas.find((e) => e.id === id);
 if (selected && selected.logo_url) {
 setLogoUrl(selected.logo_url);
 }
 };

 const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (file.size > 2 * 1024 * 1024) {
 setErro('A imagem da logo deve ter no máximo 2MB.');
 return;
 }

 const reader = new FileReader();
 reader.onload = (event) => {
 const result = event.target?.result as string;
 if (result) {
 setLogoUrl(result);
 }
 };
 reader.readAsDataURL(file);
 };

 const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const raw = e.target.value;
 setValorRaw(raw);

 const clean = raw.replace(/[^\d.,]/g, '').trim();
 if (!clean) {
 setValorNumerico(0);
 setValorExtenso('');
 if (possuiRetencao) {
 if (modoCalculo === 'automatico') {
 aplicarCalculoAutomatico(0, outrasDeducoes, regraTributaria);
 } else {
 aplicarRecalculoManual(0, baseCalculo, aliquotaIr, parcelaDeduzir, outrasDeducoes, valorIrrf);
 }
 }
 return;
 }

 let num = 0;
 if (clean.includes(',')) {
 num = parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
 } else {
 num = parseFloat(clean) || 0;
 }

 if (num > 0) {
 setValorNumerico(num);
 setValorExtenso(valorPorExtenso(num));
 } else {
 setValorNumerico(0);
 setValorExtenso('');
 }

 if (possuiRetencao) {
 if (modoCalculo === 'automatico') {
 aplicarCalculoAutomatico(num, outrasDeducoes, regraTributaria);
 } else {
 aplicarRecalculoManual(num, baseCalculo, aliquotaIr, parcelaDeduzir, outrasDeducoes, valorIrrf);
 }
 }
 };

 const validarFormulario = (): boolean => {
 setErro(null);

 if (!empresaEmissoraId) {
 setErro('Selecione uma empresa emissora válida.');
 return false;
 }

 if (!empresaDestinatariaId) {
 setErro('Selecione uma empresa destinatária.');
 return false;
 }

 if (valorNumerico <= 0) {
 setErro('O valor do recibo deve ser maior que R$ 0,00.');
 return false;
 }

 if (!referente.trim()) {
 setErro('Informe o campo "Referente a" detalhando o serviço ou quitação.');
 return false;
 }

 if (!dataEmissao) {
 setErro('Informe a data de emissão.');
 return false;
 }

 return true;
 };

 const executarEmissao = () => {
 if (!validarFormulario()) return;

 setSalvando(true);
 try {
 if (isEdicao && documentoEmEdicao) {
 const alteracoes: string[] = [];
 if (documentoEmEdicao.empresa_emissora_id !== empresaEmissoraId) alteracoes.push('Fornecedor/Emissor alterado');
 if (documentoEmEdicao.empresa_destinataria_id !== empresaDestinatariaId) alteracoes.push('Destinatário alterado');
 if (documentoEmEdicao.valor !== valorNumerico) alteracoes.push(`Valor alterado de ${formatarMoeda(documentoEmEdicao.valor)} para ${formatarMoeda(valorNumerico)}`);
 if (documentoEmEdicao.referente !== referente.trim()) alteracoes.push('Referente alterado');
 if (documentoEmEdicao.data_emissao !== dataEmissao) alteracoes.push(`Data de emissão alterada de ${documentoEmEdicao.data_emissao} para ${dataEmissao}`);
 if (documentoEmEdicao.cidade_emissao !== cidadeEmissao.trim()) alteracoes.push('Cidade alterada');
 if ((documentoEmEdicao.observacoes || '') !== observacoes.trim()) alteracoes.push('Observações alteradas');

 const detalhes = alteracoes.length > 0
 ? `Campos corrigidos: ${alteracoes.join('; ')}`
 : 'Edição de conferência realizada mantendo número original.';

 const docAtualizado: Documento = {
 ...documentoEmEdicao,
 empresa_emissora_id: empresaEmissoraId,
 empresa_destinataria_id: empresaDestinatariaId,
 valor: valorFinal,
 valor_extenso: valorExtensoFinal || valorPorExtenso(valorFinal),
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 logo_url: logoUrl.trim() || undefined,
 retencao_impostos: retencaoObj,
 };

 const docSalvo = StorageService.updateDocumento(docAtualizado, currentUser, detalhes);
 if (onDocumentCreated) {
 onDocumentCreated(docSalvo);
 } else if (onSuccess) {
 onSuccess(docSalvo);
 }
 } else {
 const novoDoc = StorageService.emitirDocumento({
 tipo: 'recibo',
 empresa_emissora_id: empresaEmissoraId,
 empresa_destinataria_id: empresaDestinatariaId,
 valor: valorFinal,
 valor_extenso: valorExtensoFinal,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 usuario: currentUser,
 logo_url: logoUrl.trim() || undefined,
 retencao_impostos: retencaoObj,
 });

 if (onDocumentCreated) {
 onDocumentCreated(novoDoc);
 } else if (onSuccess) {
 onSuccess(novoDoc);
 }
 }
 resetForm();
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Erro ao processar o recibo.';
 setErro(msg);
 setSalvando(false);
 }
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 executarEmissao();
 };

 return (
 <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto ${
 modoPreVisualizar ? 'print-modal-overlay' : 'no-print'
 }`}>
 <div className={`bg-white border border-slate-200 rounded-xl shadow-2xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden transition-colors print-modal-content ${
 modoPreVisualizar ? 'max-w-4xl' : 'max-w-2xl'
 }`}>
 {/* Header do Modal / Toolbar de Pré-Visualização */}
 {modoPreVisualizar ? (
 <UnifiedPrintToolbar
 titulo={isEdicao ? 'PRÉ-VISUALIZAÇÃO - RECIBO EM EDIÇÃO' : 'PRÉ-VISUALIZAÇÃO DO RECIBO'}
 subtitulo={`Nº ${numeroReciboAuto} • Prévia fiel à impressão e PDF`}
 isPreVisualizacao={true}
 onVoltarEdicao={() => setModoPreVisualizar(false)}
 onConfirmarEmissao={executarEmissao}
 textoConfirmar={isEdicao ? 'Salvar alterações' : 'Confirmar e Emitir'}
 onFechar={onClose}
 isSubmitting={salvando}
 documentoNumero={numeroReciboAuto}
 tipoDocumento="Recibo"
 viaAtual={viaPrevia}
 onChangeVia={setViaPrevia}
 />
 ) : (
 <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
 isEdicao ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
 }`}>
 🧾
 </div>
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">
 {isEdicao && documentoEmEdicao ? `EDITAR RECIBO Nº ${documentoEmEdicao.numero}` : 'NOVO RECIBO COMUM'}
 </h2>
 <p className="text-xs text-slate-700 font-medium">
 {isEdicao ? 'Correção de dados do documento com manutenção estrita do número original' : 'Emissão com numeração sequencial e extenso automático'}
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Conteúdo: Pré-Visualização ou Formulário */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6">
 {isEdicao && documentoEmEdicao && !modoPreVisualizar && (
 <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2.5">
 <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
 <div>
 <div className="font-bold">MODO DE EDIÇÃO ATIVO • RECIBO Nº {documentoEmEdicao.numero}</div>
 <div className="text-[11px] text-blue-700 mt-0.5">
 Você pode corrigir quaisquer informações abaixo. O número <b>{documentoEmEdicao.numero}</b> será mantido inalterado e não avançará a sequência de numeração do fornecedor.
 </div>
 </div>
 </div>
 )}

 {erro && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span className="font-semibold">{erro}</span>
 </div>
 )}

 {modoPreVisualizar ? (
 <div className="print-document bg-slate-200 p-4 sm:p-6 rounded-xl flex justify-center print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible">
 <UnifiedReciboPrint
 dados={{
 numero: numeroReciboAuto,
 valor: valorFinal,
 valor_extenso: valorExtensoFinal,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 logo_url: logoUrl.trim() || undefined,
 usuario_nome: currentUser.nome,
 emissora: empresaEmissoraObj,
 destinataria: empresaDestinatariaObj,
 retencao_impostos: retencaoObj,
 }}
 config={config}
 via={viaPrevia}
 />
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Grid: Empresa Emissora e Destinatária */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Empresa / Pessoa Emissora (Quem recebe) *
 </label>
 <select
 value={empresaEmissoraId}
 onChange={(e) => handleEmissoraChange(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-semibold focus:bg-white focus:border-slate-900 outline-none"
 >
 <option value="" className="bg-white text-slate-900 font-medium">
 Selecione uma empresa ou pessoa física emissora...
 </option>
 {emissorasDisponiveis.map((emp) => {
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;
 const docStr = isPf ? `CPF: ${mascaraCpf(emp.cnpj)}` : `CNPJ: ${mascaraCnpj(emp.cnpj)}`;
 return (
 <option
 key={emp.id}
 value={emp.id}
 className="bg-white text-slate-900 font-medium"
 >
 {emp.nome_fantasia || emp.razao_social} ({docStr})
 </option>
 );
 })}
 </select>
 {empresaEmissoraObj && (
 <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1 text-[11px] text-slate-900 bg-slate-100 rounded border border-slate-200 font-semibold">
 <span className="truncate">
 {empresaEmissoraObj.tipo_pessoa === 'PF' || empresaEmissoraObj.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'}: {empresaEmissoraObj.tipo_pessoa === 'PF' || empresaEmissoraObj.cnpj.replace(/\D/g, '').length === 11 ? mascaraCpf(empresaEmissoraObj.cnpj) : mascaraCnpj(empresaEmissoraObj.cnpj)} · {empresaEmissoraObj.cidade}/{empresaEmissoraObj.uf}
 </span>
 <span className="shrink-0 text-emerald-800 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
 Nº deste Recibo: {numeroReciboAuto}
 </span>
 </div>
 )}
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 RECEBEMOS DE: (Destinatário / Quem paga) *
 </label>
 <select
 value={empresaDestinatariaId}
 onChange={(e) => setEmpresaDestinatariaId(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-semibold focus:bg-white focus:border-slate-900 outline-none"
 >
 <option value="" className="bg-white text-slate-900 font-medium">
 Selecione uma empresa ou pessoa física pagadora...
 </option>
 {destinatariasDisponiveis.map((emp) => {
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;
 const docStr = isPf ? `CPF: ${mascaraCpf(emp.cnpj)}` : `CNPJ: ${mascaraCnpj(emp.cnpj)}`;
 return (
 <option
 key={emp.id}
 value={emp.id}
 className="bg-white text-slate-900 font-medium"
 >
 {emp.nome_fantasia || emp.razao_social} ({docStr})
 </option>
 );
 })}
 </select>
 {empresaDestinatariaObj && (
 <div className="mt-1.5 px-2.5 py-1 text-[11px] text-slate-900 bg-slate-100 rounded border border-slate-200 font-semibold truncate">
 {empresaDestinatariaObj.tipo_pessoa === 'PF' || empresaDestinatariaObj.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'}: {empresaDestinatariaObj.tipo_pessoa === 'PF' || empresaDestinatariaObj.cnpj.replace(/\D/g, '').length === 11 ? mascaraCpf(empresaDestinatariaObj.cnpj) : mascaraCnpj(empresaDestinatariaObj.cnpj)} · {empresaDestinatariaObj.cidade}/{empresaDestinatariaObj.uf}
 </div>
 )}
 </div>
 </div>

 {/* Seção: Logo da Empresa */}
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold text-slate-900 ">
 Logotipo da Empresa Emissora <span className="font-medium text-slate-600 text-[11px]">(opcional para este recibo)</span>
 </label>
 {logoUrl && (
 <button
 type="button"
 onClick={() => setLogoUrl('')}
 className="text-[11px] text-red-600 hover:underline font-bold"
 >
 Remover Logo
 </button>
 )}
 </div>

 <div className="flex flex-col sm:flex-row items-center gap-3">
 <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs">
 <Upload className="w-3.5 h-3.5 text-slate-700 " />
 <span>{logoUrl ? 'Alterar Logo / Imagem' : 'Anexar Logo da Empresa'}</span>
 <input
 type="file"
 accept="image/*"
 onChange={handleLogoUpload}
 className="hidden"
 />
 </label>

 <input
 type="text"
 value={logoUrl}
 onChange={(e) => setLogoUrl(e.target.value)}
 placeholder="Ou cole a URL da imagem da logo..."
 className="flex-1 w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 placeholder:text-slate-400 outline-none"
 />

 {logoUrl ? (
 <div className="w-14 h-8 bg-white border border-slate-300 rounded flex items-center justify-center p-1 shrink-0">
 <img
 src={logoUrl}
 alt="Logo"
 className="max-h-full max-w-full object-contain"
 />
 </div>
 ) : (
 <div className="text-[10px] text-slate-600 font-semibold shrink-0">
 Sem logo
 </div>
 )}
 </div>
 </div>

 {/* Grid: Valor Numérico e Extenso */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Valor (R$) *
 </label>
 <div className="relative">
 <span className="absolute left-3 top-2 text-xs font-black text-slate-800 ">
 R$
 </span>
 <input
 type="text"
 required
 value={valorRaw}
 onChange={handleValorChange}
 onFocus={(e) => {
 if (e.target.value === '0,00' || e.target.value === '0' || e.target.value === '0.00') {
 e.target.select();
 }
 }}
 placeholder="0,00"
 className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-extrabold focus:bg-white focus:border-slate-900 outline-none"
 />
 </div>
 </div>

 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Valor por Extenso <span className="font-medium text-slate-600 text-[11px]">(gerado automaticamente)</span>
 </label>
 <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-950 font-bold italic min-h-[38px] flex items-center leading-snug">
 {valorExtenso || <span className="text-slate-400 font-normal not-italic text-[11px]">Informe o valor acima para gerar o extenso...</span>}
 </div>
 </div>
 </div>

 {/* SEÇÃO: CONTROLE DE RETENÇÃO DE IMPOSTO DE RENDA (IRRF) */}
 <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3.5 transition-all">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <span className="block text-xs font-bold text-slate-900 tracking-tight">
 Possui retenção de Imposto de Renda (IRRF)?
 </span>
 <p className="text-[11px] text-slate-600 mt-0.5">
 Selecione SIM para calcular e exibir o demonstrativo de IRRF e deduções no recibo e PDF.
 </p>
 </div>

 {/* Seleção SIM / NÃO */}
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={() => setPossuiRetencao(false)}
 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
 !possuiRetencao
 ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
 : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
 }`}
 >
 NÃO
 </button>
 <button
 type="button"
 onClick={() => {
 setPossuiRetencao(true);
 if (modoCalculo === 'automatico') {
 aplicarCalculoAutomatico(valorNumerico, outrasDeducoes, regraTributaria);
 } else {
 aplicarRecalculoManual(valorNumerico, baseCalculo, aliquotaIr, parcelaDeduzir, outrasDeducoes, valorIrrf);
 }
 }}
 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
 possuiRetencao
 ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-600/20'
 : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
 }`}
 >
 SIM
 </button>
 </div>
 </div>

 {/* DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES (EXIBIDO APENAS QUANDO SIM) */}
 {possuiRetencao && (
 <div className="pt-3.5 border-t border-slate-200 space-y-3.5 animate-in fade-in duration-200">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/80 p-3 rounded-lg border border-blue-200">
 <div className="flex items-center gap-2">
 <Calculator className="w-4 h-4 text-blue-700 shrink-0" />
 <div>
 <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
 DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES
 </span>
 <p className="text-[10px] text-blue-700">
 Tabela Progressiva Mensal do IRPF vigente e regras para aluguel de pessoa física
 </p>
 </div>
 </div>

 {/* Alternância: Cálculo Automático vs Ajuste Manual */}
 <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200 shrink-0">
 <button
 type="button"
 onClick={() => {
 setModoCalculo('automatico');
 aplicarCalculoAutomatico(valorNumerico, outrasDeducoes, regraTributaria);
 }}
 className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
 modoCalculo === 'automatico'
 ? 'bg-blue-600 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Cálculo Automático
 </button>
 <button
 type="button"
 onClick={() => setModoCalculo('manual')}
 className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
 modoCalculo === 'manual'
 ? 'bg-blue-600 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Ajuste Manual
 </button>
 </div>
 </div>

 {/* Opção de Regra Tributária */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className="block text-[11px] font-bold text-slate-800 mb-1">
 Regra Tributária Aplicada
 </label>
 <select
 value={regraTributaria}
 onChange={(e) => {
 const regra = e.target.value as 'tabela_progressiva' | 'aluguel_pf' | 'manual';
 setRegraTributaria(regra);
 if (regra !== 'manual') {
 aplicarCalculoAutomatico(valorNumerico, outrasDeducoes, regra);
 }
 }}
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-slate-800 outline-none"
 >
 <option value="tabela_progressiva">Tabela Progressiva IRPF (Padrão Oficial Geral)</option>
 <option value="aluguel_pf">Aluguel de Pessoa Física (Tabela Progressiva com dedução legal)</option>
 <option value="manual">Personalizado / Manual</option>
 </select>
 </div>

 <div className="flex items-start gap-2 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-snug">
 <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
 <span>
 {regraTributaria === 'aluguel_pf'
 ? 'Aluguel PF: Aplica alíquotas progressivas (até 27,5%) deduzindo R$ 896,00 da parcela legalmente permitida. O cálculo não aplica 27,5% direto sobre o bruto.'
 : 'Tabela Progressiva Oficial: Isenção até R$ 2.259,20; 7,5% (deduz 169,44); 15% (deduz 381,44); 22,5% (deduz 662,77); 27,5% (deduz 896,00).'}
 </span>
 </div>
 </div>

 {/* Grid dos Campos do Demonstrativo */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 border border-slate-200 rounded-lg">
 {/* Valor Bruto */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Valor Bruto (R$)
 </label>
 <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums">
 {formatarMoeda(valorNumerico)}
 </div>
 <span className="text-[10px] text-slate-500">Valor original do recibo</span>
 </div>

 {/* Base de Cálculo do IRRF */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Base de Cálculo IRRF (R$) *
 </label>
 <input
 type="number"
 step="0.01"
 min="0"
 disabled={modoCalculo === 'automatico'}
 value={baseCalculo}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setBaseCalculo(val);
 aplicarRecalculoManual(valorNumerico, val, aliquotaIr, parcelaDeduzir, outrasDeducoes, valorIrrf);
 }}
 className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold tabular-nums outline-none ${
 modoCalculo === 'automatico'
 ? 'bg-slate-100 border-slate-300 text-slate-900'
 : 'bg-white border-blue-400 text-blue-950 focus:ring-1 focus:ring-blue-500'
 }`}
 />
 <span className="text-[10px] text-slate-500">Bruto menos outras deduções</span>
 </div>

 {/* Alíquota do IR */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Alíquota do IR (%) *
 </label>
 <div className="relative">
 <input
 type="number"
 step="0.1"
 min="0"
 max="100"
 disabled={modoCalculo === 'automatico'}
 value={aliquotaIr}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setAliquotaIr(val);
 const irrfCalc = Math.max(0, Number(((baseCalculo * (val / 100)) - parcelaDeduzir).toFixed(2)));
 setValorIrrf(irrfCalc);
 aplicarRecalculoManual(valorNumerico, baseCalculo, val, parcelaDeduzir, outrasDeducoes, irrfCalc);
 }}
 className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold tabular-nums outline-none pr-7 ${
 modoCalculo === 'automatico'
 ? 'bg-slate-100 border-slate-300 text-slate-900'
 : 'bg-white border-blue-400 text-blue-950 focus:ring-1 focus:ring-blue-500'
 }`}
 />
 <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-bold">%</span>
 </div>
 <span className="text-[10px] text-slate-500">0%, 7,5%, 15%, 22,5%, 27,5%</span>
 </div>

 {/* Parcela a Deduzir */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Parcela a Deduzir (R$)
 </label>
 <input
 type="number"
 step="0.01"
 min="0"
 disabled={modoCalculo === 'automatico'}
 value={parcelaDeduzir}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setParcelaDeduzir(val);
 const irrfCalc = Math.max(0, Number(((baseCalculo * (aliquotaIr / 100)) - val).toFixed(2)));
 setValorIrrf(irrfCalc);
 aplicarRecalculoManual(valorNumerico, baseCalculo, aliquotaIr, val, outrasDeducoes, irrfCalc);
 }}
 className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold tabular-nums outline-none ${
 modoCalculo === 'automatico'
 ? 'bg-slate-100 border-slate-300 text-slate-900'
 : 'bg-white border-blue-400 text-blue-950 focus:ring-1 focus:ring-blue-500'
 }`}
 />
 <span className="text-[10px] text-slate-500">Ex: R$ 896,00 na faixa de 27,5%</span>
 </div>

 {/* Valor do IRRF */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Valor do IRRF (R$) *
 </label>
 <input
 type="number"
 step="0.01"
 min="0"
 disabled={modoCalculo === 'automatico'}
 value={valorIrrf}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setValorIrrf(val);
 aplicarRecalculoManual(valorNumerico, baseCalculo, aliquotaIr, parcelaDeduzir, outrasDeducoes, val);
 }}
 className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold tabular-nums outline-none ${
 modoCalculo === 'automatico'
 ? 'bg-slate-100 border-slate-300 text-red-700 font-extrabold'
 : 'bg-white border-blue-400 text-red-700 focus:ring-1 focus:ring-blue-500 font-extrabold'
 }`}
 />
 <span className="text-[10px] text-slate-500">(Base × Alíquota) − Parcela</span>
 </div>

 {/* Outras Deduções Permitidas */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Outras Deduções Permitidas (R$)
 </label>
 <input
 type="number"
 step="0.01"
 min="0"
 value={outrasDeducoes}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setOutrasDeducoes(val);
 if (modoCalculo === 'automatico') {
 aplicarCalculoAutomatico(valorNumerico, val, regraTributaria);
 } else {
 aplicarRecalculoManual(valorNumerico, baseCalculo, aliquotaIr, parcelaDeduzir, val, valorIrrf);
 }
 }}
 placeholder="0,00"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-bold tabular-nums outline-none focus:border-slate-800"
 />
 <span className="text-[10px] text-slate-500">Ex: taxa adm imobiliária, condomínio</span>
 </div>

 {/* Descrição de Outras Deduções */}
 <div className="sm:col-span-2">
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Identificação de Outras Deduções <span className="font-normal text-slate-500">(opcional)</span>
 </label>
 <input
 type="text"
 value={descricaoOutrasDeducoes}
 onChange={(e) => setDescricaoOutrasDeducoes(e.target.value)}
 placeholder="Ex: Taxa de administração de aluguel / IPTU / Condomínio"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-800"
 />
 <span className="text-[10px] text-slate-500">Aparecerá detalhada no demonstrativo do recibo</span>
 </div>
 </div>

 {/* Resumo Consolidado de Deduções e Valor Líquido */}
 <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="text-xs">
 <span className="text-slate-600 font-medium">Total de Deduções: </span>
 <b className="text-red-700 font-bold tabular-nums">{formatarMoeda(totalDeducoes)}</b>
 <span className="text-[11px] text-slate-500 ml-1">
 (IRRF: {formatarMoeda(valorIrrf)}{outrasDeducoes > 0 ? ` + Outras: ${formatarMoeda(outrasDeducoes)}` : ''})
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
 Valor Líquido a Receber:
 </span>
 <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm font-extrabold tabular-nums shadow-xs">
 {formatarMoeda(valorLiquido)}
 </span>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Referente a */}
 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Referente a (Descrição detalhada) *
 </label>
 <textarea
 required
 rows={3}
 value={referente}
 onChange={(e) => setReferente(e.target.value)}
 placeholder="Ex: Serviços de consultoria em gestão contábil e tributária referente ao mês de Setembro/2026..."
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none leading-relaxed"
 />
 </div>

 {/* Grid: Data de Emissão e Cidade */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Data de Emissão *
 </label>
 <input
 type="date"
 required
 value={dataEmissao}
 onChange={(e) => setDataEmissao(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-semibold focus:bg-white focus:border-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Cidade / UF do Documento
 </label>
 <input
 type="text"
 value={cidadeEmissao}
 onChange={(e) => setCidadeEmissao(e.target.value)}
 placeholder="Ex: Brasília/DF"
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none"
 />
 </div>
 </div>

 {/* Observações */}
 <div>
 <label className="block text-xs font-bold text-slate-900 mb-1">
 Observações <span className="font-medium text-slate-600 text-[11px]">(opcional)</span>
 </label>
 <textarea
 rows={2}
 value={observacoes}
 onChange={(e) => setObservacoes(e.target.value)}
 placeholder="Ex: Pagamento efetuado via PIX / Cheque nº... Quitação condicionada à compensação bancária."
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-950 font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none leading-relaxed"
 />
 </div>

 {/* Footer com Botões */}
 <div className="flex items-center justify-between pt-4 border-t border-slate-200 ">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-bold text-slate-800 hover:text-black border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={resetForm}
 className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Limpar</span>
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 if (validarFormulario()) {
 setModoPreVisualizar(true);
 }
 }}
 className="px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
 >
 <Eye className="w-3.5 h-3.5 text-blue-600 " />
 <span>PRÉ-VISUALIZAR RECIBO</span>
 </button>

 <button
 type="submit"
 disabled={salvando}
 className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
 >
 <Check className="w-3.5 h-3.5 text-emerald-400 " />
 <span>{salvando ? (isEdicao ? 'SALVANDO...' : 'EMITINDO...') : (isEdicao ? 'SALVAR ALTERAÇÕES' : 'EMITIR RECIBO')}</span>
 </button>
 </div>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 );
}
