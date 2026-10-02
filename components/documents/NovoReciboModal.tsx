'use client';

import React, { useState, useEffect } from 'react';
import { Usuario, Empresa, Documento } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj, mascaraCpf, formatarMoeda, dataHojeIso } from '@/lib/masks';
import { valorPorExtenso } from '@/lib/extenso';
import { X, Check, AlertCircle, Upload, Eye } from 'lucide-react';
import { usePrint } from '@/lib/printContext';
import { UnifiedPrintToolbar } from './unified/UnifiedPrintToolbar';
import { UnifiedReciboPrint } from './unified/UnifiedReciboPrint';

interface NovoReciboModalProps {
 currentUser: Usuario;
 isOpen: boolean;
 onClose: () => void;
 onDocumentCreated?: (doc: Documento) => void;
 onSuccess?: (doc: Documento) => void;
}

export function NovoReciboModal({
 currentUser,
 isOpen,
 onClose,
 onDocumentCreated,
 onSuccess,
}: NovoReciboModalProps) {
 const [empresas] = useState<Empresa[]>(() => {
 return StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 });

 const [empresaEmissoraId, setEmpresaEmissoraId] = useState<string>(() => {
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
 const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const destinatarias = all.filter(
 (e) => e.tipo === 'destinataria' || e.tipo === 'ambas'
 );
 return destinatarias[0]?.id || '';
 });

 const [valorRaw, setValorRaw] = useState('8500,00');
 const [valorNumerico, setValorNumerico] = useState(8500.0);
 const [valorExtenso, setValorExtenso] = useState(() => valorPorExtenso(8500.0));
 const [referente, setReferente] = useState('Prestação de serviços especializados em assessoria técnica e consultoria.');
 const [dataEmissao, setDataEmissao] = useState(() => dataHojeIso());
 const [cidadeEmissao, setCidadeEmissao] = useState(() => {
 const config = StorageService.getConfig();
 return config.cidade_padrao || 'Brasília/DF';
 });
 const [observacoes, setObservacoes] = useState('');
 const [erro, setErro] = useState<string | null>(null);
 const [salvando, setSalvando] = useState(false);
 const [modoPreVisualizar, setModoPreVisualizar] = useState(false);
 const [viaPrevia, setViaPrevia] = useState<'1' | '2'>('1');
 const { setActivePrintItem } = usePrint();

 const config = StorageService.getConfig();
 const seqNum = config.proximo_recibo_num || 1;
 const anoAtual = config.ano_corrente || new Date().getFullYear();
 const numeroReciboAuto = `${String(seqNum).padStart(6, '0')}/${anoAtual}`;

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
 valor: valorNumerico,
 valor_extenso: valorExtenso,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 logo_url: logoUrl.trim() || undefined,
 usuario_nome: currentUser.nome,
 emissora: empresaEmissoraObj,
 destinataria: empresaDestinatariaObj,
 config,
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
 valorNumerico,
 valorExtenso,
 referente,
 dataEmissao,
 cidadeEmissao,
 observacoes,
 logoUrl,
 empresaEmissoraId,
 empresaDestinatariaId,
 currentUser.nome,
 empresaEmissoraObj,
 empresaDestinatariaObj,
 config,
 setActivePrintItem,
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

 const limpo = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
 const num = parseFloat(limpo);

 if (!isNaN(num) && num > 0) {
 setValorNumerico(num);
 setValorExtenso(valorPorExtenso(num));
 } else {
 setValorNumerico(0);
 setValorExtenso('Zero reais');
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
 const novoDoc = StorageService.emitirDocumento({
 tipo: 'recibo',
 empresa_emissora_id: empresaEmissoraId,
 empresa_destinataria_id: empresaDestinatariaId,
 valor: valorNumerico,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 usuario: currentUser,
 logo_url: logoUrl.trim() || undefined,
 });

 if (onDocumentCreated) {
 onDocumentCreated(novoDoc);
 } else if (onSuccess) {
 onSuccess(novoDoc);
 }
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Erro ao emitir o recibo.';
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
 titulo="PRÉ-VISUALIZAÇÃO DO RECIBO"
 subtitulo={`Nº ${numeroReciboAuto} • Prévia fiel à impressão e PDF`}
 isPreVisualizacao={true}
 onVoltarEdicao={() => setModoPreVisualizar(false)}
 onConfirmarEmissao={executarEmissao}
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
 <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
 🧾
 </div>
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">NOVO RECIBO COMUM</h2>
 <p className="text-xs text-slate-700 font-medium">Emissão com numeração sequencial e extenso automático</p>
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
 valor: valorNumerico,
 valor_extenso: valorExtenso,
 referente: referente.trim(),
 data_emissao: dataEmissao,
 cidade_emissao: cidadeEmissao.trim() || 'Brasília/DF',
 observacoes: observacoes.trim() || undefined,
 logo_url: logoUrl.trim() || undefined,
 usuario_nome: currentUser.nome,
 emissora: empresaEmissoraObj,
 destinataria: empresaDestinatariaObj,
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
 <div className="mt-1.5 px-2.5 py-1 text-[11px] text-slate-900 bg-slate-100 rounded border border-slate-200 font-semibold truncate">
 {empresaEmissoraObj.tipo_pessoa === 'PF' || empresaEmissoraObj.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'}: {empresaEmissoraObj.tipo_pessoa === 'PF' || empresaEmissoraObj.cnpj.replace(/\D/g, '').length === 11 ? mascaraCpf(empresaEmissoraObj.cnpj) : mascaraCnpj(empresaEmissoraObj.cnpj)} · {empresaEmissoraObj.cidade}/{empresaEmissoraObj.uf}
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
 {valorExtenso}
 </div>
 </div>
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
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-bold text-slate-800 hover:text-black border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
 >
 Cancelar
 </button>

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
 <span>{salvando ? 'EMITINDO...' : 'EMITIR RECIBO'}</span>
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
