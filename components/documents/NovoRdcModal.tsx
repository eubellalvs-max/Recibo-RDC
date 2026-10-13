'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa, Documento, ItemGastoRdc, ModeloDespesa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, mascaraCpf, formatarDataBr, dataHojeIso } from '@/lib/masks';
import {
 X,
 Check,
 AlertCircle,
 Plus,
 Trash2,
 Sparkles,
 Layers,
 Eye,
 FileSpreadsheet,
} from 'lucide-react';
import { usePrint } from '@/lib/printContext';
import { UnifiedPrintToolbar } from './unified/UnifiedPrintToolbar';
import { UnifiedRdcPrint } from './unified/UnifiedRdcPrint';

interface NovoRdcModalProps {
 currentUser: Usuario;
 isOpen: boolean;
 onClose: () => void;
 onDocumentCreated?: (doc: Documento) => void;
 onSuccess?: (doc: Documento) => void;
}

export function NovoRdcModal({
 currentUser,
 isOpen,
 onClose,
 onDocumentCreated,
 onSuccess,
}: NovoRdcModalProps) {
 const empresas = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const modelosDespesa = StorageService.getModelosDespesa();
 const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>('');
 const [notificacaoModelo, setNotificacaoModelo] = useState<string | null>(null);

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
 return permitidas[0]?.id || all[0]?.id || '';
 });

 const [empresaDestinatariaId, setEmpresaDestinatariaId] = useState<string>(() => {
 const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
 const destinatarias = all.filter(
 (e) => e.tipo === 'destinataria' || e.tipo === 'ambas'
 );
 return destinatarias[0]?.id || all[0]?.id || '';
 });

 // Linha de Gastos da RDC (Viagem, Despesas Corporativas ou Ambas)
 const [linhaGasto, setLinhaGasto] = useState<'viagem' | 'corporativa' | 'ambas'>('viagem');

 // 1. Informações do Solicitante da viagem ou despesas corporativas
 const [dataPedido, setDataPedido] = useState<string>(() => dataHojeIso());
 const [numeroPedido, setNumeroPedido] = useState<string>('');
 const [localPartida, setLocalPartida] = useState<string>('Brasília/DF');
 const [destino, setDestino] = useState<string>('');
 const [nomeSolicitante, setNomeSolicitante] = useState<string>(currentUser.nome || '');
 const [cpfSolicitante, setCpfSolicitante] = useState<string>('');
 const [setorFuncao, setSetorFuncao] = useState<string>('');
 const [objetivoViagem, setObjetivoViagem] = useState<string>('');

 // 2. Informações bancária e financeira
 const [valorSolicitadoRaw, setValorSolicitadoRaw] = useState<string>('0,00');
 const [valorSolicitado, setValorSolicitado] = useState<number>(0.0);
 const [nomeBanco, setNomeBanco] = useState<string>('');
 const [agencia, setAgencia] = useState<string>('');
 const [conta, setConta] = useState<string>('');
 const [tipoConta, setTipoConta] = useState<string>('Conta Corrente');
 const [chavePix, setChavePix] = useState<string>(currentUser.email || '');

 // 3. Descrição dos gastos
 const [dataEntregaRdc, setDataEntregaRdc] = useState<string>(() => dataHojeIso());
 const [itens, setItens] = useState<ItemGastoRdc[]>([]);

 // Tipos de Gasto e Tipos de Documento lidos em tempo real das Configurações
 const tiposGasto = useMemo(() => StorageService.getTiposGasto(), []);
 const tiposDoc = useMemo(() => StorageService.getTiposDoc(), []);

 // Assinaturas
 const [assinaturaProfissional, setAssinaturaProfissional] = useState(currentUser.nome);
 const [diretoriaDireta, setDiretoriaDireta] = useState('Carlos Eduardo Silva');
 const [contabilFinanceiro, setContabilFinanceiro] = useState('Setor Contábil / Financeiro ABEAS');

 const [erro, setErro] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [modoPreVisualizar, setModoPreVisualizar] = useState(false);

 const config = StorageService.getConfig();
 const seqNum = config.proximo_rdc_num || 1;
 const anoAtual = config.ano_corrente || new Date().getFullYear();
 const numeroRdcAuto = `${String(seqNum).padStart(6, '0')}/${anoAtual}`;

 // Aplicar modelo de despesa selecionado
 const handleSelecionarModelo = (modeloId: string) => {
 setModeloSelecionadoId(modeloId);
 if (!modeloId) return;

 const modelo = modelosDespesa.find((m) => m.id === modeloId);
 if (!modelo) return;

 // Carregar configurações exatas do modelo
 if (modelo.linha_gasto) setLinhaGasto(modelo.linha_gasto);
 if (modelo.local_partida_padrao) setLocalPartida(modelo.local_partida_padrao);
 if (modelo.destino_padrao) setDestino(modelo.destino_padrao);
 if (modelo.setor_funcao_padrao) setSetorFuncao(modelo.setor_funcao_padrao);
 if (modelo.objetivo_padrao) setObjetivoViagem(modelo.objetivo_padrao);

 if (modelo.valor_adiantamento_sugerido !== undefined) {
 setValorSolicitado(modelo.valor_adiantamento_sugerido);
 setValorSolicitadoRaw(
 modelo.valor_adiantamento_sugerido.toLocaleString('pt-BR', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 })
 );
 }

 if (modelo.nome_banco_padrao) setNomeBanco(modelo.nome_banco_padrao);
 if (modelo.agencia_padrao) setAgencia(modelo.agencia_padrao);
 if (modelo.conta_padrao) setConta(modelo.conta_padrao);
 if (modelo.tipo_conta_padrao) setTipoConta(modelo.tipo_conta_padrao);
 if (modelo.chave_pix_padrao) setChavePix(modelo.chave_pix_padrao);
 if (modelo.diretoria_direta_padrao) setDiretoriaDireta(modelo.diretoria_direta_padrao);
 if (modelo.contabil_financeiro_padrao) setContabilFinanceiro(modelo.contabil_financeiro_padrao);

 if (modelo.itens_padrao && modelo.itens_padrao.length > 0) {
 const novosItens: ItemGastoRdc[] = modelo.itens_padrao.map((it, idx) => ({
 id: `item-${Date.now()}-${idx}`,
 data: it.data || dataEntregaRdc || dataHojeIso(),
 tipo_gasto: it.tipo_gasto,
 tipo_doc: it.tipo_doc,
 descricao: it.descricao,
 valor: it.valor,
 }));
 setItens(novosItens);
 }

 setNotificacaoModelo(`Configurações do modelo "${modelo.nome}" aplicadas com sucesso!`);
 setTimeout(() => setNotificacaoModelo(null), 4000);
 };

 // Preencher exemplo de teste rápido
 const handlePreencherExemplo = () => {
 setNumeroPedido('2026/089');
 setLocalPartida('Brasília/DF');
 setDestino('São Paulo/SP');
 setCpfSolicitante('021.488.921-34');
 setSetorFuncao('Auditor de Sistemas / TI');
 setObjetivoViagem('Auditoria técnica e vistoria in loco de infraestrutura predial e contábil.');
 setValorSolicitadoRaw('2000,00');
 setValorSolicitado(2000.0);
 setNomeBanco('Banco do Brasil');
 setAgencia('1820-1');
 setConta('45.890-2');
 setItens([
 { id: 'item-ex-1', data: '2026-09-20', tipo_gasto: 1, tipo_doc: 'NF', descricao: 'Restaurante Sabor & Arte - Almoço de trabalho equipe - NF 1042', valor: 380.0 },
 { id: 'item-ex-2', data: '2026-09-20', tipo_gasto: 2, tipo_doc: 'NF', descricao: 'Posto Petrobras Paulista - Abastecimento de veículo locado - NF 8892', valor: 320.0 },
 { id: 'item-ex-3', data: '2026-09-21', tipo_gasto: 3, tipo_doc: 'Rec', descricao: 'Uber do Brasil - Deslocamentos Aeroporto x Hotel x Escritório', valor: 195.0 },
 { id: 'item-ex-4', data: '2026-09-21', tipo_gasto: 4, tipo_doc: 'NF', descricao: 'Hotel Ibis Paulista - 2 diárias de hospedagem - NF 4421', valor: 850.0 },
 { id: 'item-ex-5', data: '2026-09-22', tipo_gasto: 5, tipo_doc: 'Rec', descricao: 'GOL Linhas Aéreas - Taxa de embarque e despacho bagagem', valor: 210.0 },
 { id: 'item-ex-6', data: '2026-09-22', tipo_gasto: 6, tipo_doc: 'Rec', descricao: 'Papelaria Express - Cópias de documentos e encadernações técnicas', valor: 145.0 },
 ]);
 };

 // Cálculos dinâmicos em tempo real
 const totalDespesas = itens.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
 const totalPorNatureza: Record<number, number> = {};
 tiposGasto.forEach((tg) => {
 totalPorNatureza[tg.codigo] = 0;
 });
 itens.forEach((it) => {
 const cod = Number(it.tipo_gasto);
 totalPorNatureza[cod] = (totalPorNatureza[cod] || 0) + (Number(it.valor) || 0);
 });

 const saldoDevolucao = valorSolicitado - totalDespesas;
 const valorARessarcir = saldoDevolucao < 0 ? Math.abs(saldoDevolucao) : 0;

 const handleValorSolicitadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const raw = e.target.value;
 setValorSolicitadoRaw(raw);
 const limpo = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
 const num = parseFloat(limpo);
 setValorSolicitado(isNaN(num) ? 0 : num);
 };

 const handleAdicionarItem = () => {
 const novo: ItemGastoRdc = {
 id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
 data: dataEntregaRdc || dataHojeIso(),
 tipo_gasto: tiposGasto[0]?.codigo || 1,
 tipo_doc: tiposDoc[0]?.codigo || 'Rec',
 descricao: '',
 valor: 0,
 };
 setItens([...itens, novo]);
 };

 const handleRemoverItem = (id: string) => {
 setItens(itens.filter((it) => it.id !== id));
 };

 const handleItemChange = (id: string, campo: keyof ItemGastoRdc, valor: string | number) => {
 setItens(
 itens.map((it) => {
 if (it.id !== id) return it;
 if (campo === 'valor') {
 return { ...it, valor: Number(valor) || 0 };
 }
 if (campo === 'tipo_gasto') {
 return { ...it, tipo_gasto: Number(valor) || 1 };
 }
 return { ...it, [campo]: valor };
 })
 );
 };

 const validarFormulario = (): boolean => {
 setErro(null);

 if (!empresaEmissoraId) {
 setErro('Selecione a empresa pagadora/emissora.');
 return false;
 }
 if (!numeroPedido.trim()) {
 setErro('Informe o número do pedido.');
 return false;
 }
 if (!nomeSolicitante.trim()) {
 setErro('Informe o nome do solicitante.');
 return false;
 }
 if (!cpfSolicitante.trim()) {
 setErro('Informe o CPF do solicitante.');
 return false;
 }
 if (!objetivoViagem.trim()) {
 setErro('Informe o objetivo da viagem ou despesas corporativas.');
 return false;
 }
 if (itens.length === 0) {
 setErro('Adicione ao menos um item na descrição dos gastos.');
 return false;
 }
 if (totalDespesas <= 0) {
 setErro('O valor total das despesas deve ser superior a R$ 0,00.');
 return false;
 }

 return true;
 };

 const executarEmissao = () => {
 if (!validarFormulario()) return;

 setIsSubmitting(true);

 const meses = [
 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
 ];
 const dataPartes = dataEntregaRdc.split('-');
 const mesIndex = dataPartes.length === 3 ? parseInt(dataPartes[1]) - 1 : new Date().getMonth();
 const anoAtualStr = dataPartes.length === 3 ? dataPartes[0] : '2026';
 const competenciaStr = `${meses[mesIndex]} / ${anoAtualStr}`;

 const modeloObj = modelosDespesa.find((m) => m.id === modeloSelecionadoId);

 try {
 const doc = StorageService.emitirDocumento({
 tipo: 'rdc',
 empresa_emissora_id: empresaEmissoraId,
 empresa_destinataria_id: empresaDestinatariaId,
 valor: totalDespesas,
 referente: `Prestação de Contas e Reembolso de Despesas Corporativa - ${objetivoViagem}`,
 competencia: competenciaStr,
 data_emissao: dataEntregaRdc,
 cidade_emissao: localPartida || 'Brasília/DF',
 observacoes: `Solicitante: ${nomeSolicitante} | N.º Pedido: ${numeroPedido} | Saldo: ${saldoDevolucao < 0 ? `A ressarcir ${formatarMoeda(valorARessarcir)}` : `A devolver ${formatarMoeda(saldoDevolucao)}`}`,
 usuario: currentUser,
 rdc_detalhes: {
 modelo_despesa_id: modeloSelecionadoId || undefined,
 modelo_despesa_nome: modeloObj?.nome || undefined,
 linha_gasto: linhaGasto,
 data_pedido: dataPedido,
 numero_pedido: numeroPedido,
 local_partida: localPartida,
 destino: destino,
 nome_solicitante: nomeSolicitante,
 cpf_solicitante: cpfSolicitante,
 setor_funcao: setorFuncao,
 objetivo_viagem: objetivoViagem,
 valor_solicitado: valorSolicitado,
 nome_banco: nomeBanco,
 agencia: agencia,
 conta: conta,
 tipo_conta: tipoConta,
 chave_pix: chavePix,
 data_entrega_rdc: dataEntregaRdc,
 itens: itens,
 total_despesas: totalDespesas,
 valor_adiantamento: valorSolicitado,
 saldo_devolucao_ressarcimento: saldoDevolucao,
 valor_ressarcir_solicitante: valorARessarcir,
 assinatura_profissional: assinaturaProfissional,
 diretoria_direta: diretoriaDireta,
 contabil_financeiro: contabilFinanceiro,
 },
 });

 if (onDocumentCreated) {
 onDocumentCreated(doc);
 } else if (onSuccess) {
 onSuccess(doc);
 }
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Erro ao emitir a RDC.';
 setErro(msg);
 setIsSubmitting(false);
 }
 };

 const { setActivePrintItem } = usePrint();

 useEffect(() => {
 if (!isOpen || !modoPreVisualizar) {
 return;
 }

 setActivePrintItem({
 tipo: 'rdc',
 numero: numeroRdcAuto,
 dadosRdc: {
 numero: numeroRdcAuto,
 detalhes: {
 linha_gasto: linhaGasto,
 data_pedido: dataPedido,
 numero_pedido: numeroPedido,
 local_partida: localPartida,
 destino: destino,
 nome_solicitante: nomeSolicitante,
 cpf_solicitante: cpfSolicitante,
 setor_funcao: setorFuncao,
 objetivo_viagem: objetivoViagem,
 valor_solicitado: valorSolicitado,
 nome_banco: nomeBanco,
 agencia: agencia,
 conta: conta,
 tipo_conta: tipoConta,
 chave_pix: chavePix,
 data_entrega_rdc: dataEntregaRdc,
 itens: itens,
 total_despesas: totalDespesas,
 valor_adiantamento: valorSolicitado,
 saldo_devolucao_ressarcimento: saldoDevolucao,
 valor_ressarcir_solicitante: valorARessarcir,
 assinatura_profissional: assinaturaProfissional,
 diretoria_direta: diretoriaDireta,
 contabil_financeiro: contabilFinanceiro,
 },
 tiposGasto,
 tiposDoc,
 },
 });

 return () => {
 setActivePrintItem(null);
 };
 }, [
 isOpen,
 modoPreVisualizar,
 numeroRdcAuto,
 linhaGasto,
 dataPedido,
 numeroPedido,
 localPartida,
 destino,
 nomeSolicitante,
 cpfSolicitante,
 setorFuncao,
 objetivoViagem,
 valorSolicitado,
 nomeBanco,
 agencia,
 conta,
 tipoConta,
 chavePix,
 dataEntregaRdc,
 totalDespesas,
 saldoDevolucao,
 valorARessarcir,
 assinaturaProfissional,
 diretoriaDireta,
 contabilFinanceiro,
 setActivePrintItem,
 ]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 executarEmissao();
 };

 if (!isOpen) return null;

 return (
 <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto ${
 modoPreVisualizar ? 'print-modal-overlay' : 'no-print'
 }`}>
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden transition-colors print-modal-content">
 {/* Header do Modal / Toolbar de Pré-Visualização */}
 {modoPreVisualizar ? (
 <UnifiedPrintToolbar
 titulo="PRÉ-VISUALIZAÇÃO DA RDC"
 subtitulo={`Nº ${numeroRdcAuto} • Relatório de Despesas com Comprovantes`}
 isPreVisualizacao={true}
 onVoltarEdicao={() => setModoPreVisualizar(false)}
 onConfirmarEmissao={executarEmissao}
 onFechar={onClose}
 isSubmitting={isSubmitting}
 documentoNumero={numeroRdcAuto}
 tipoDocumento="RDC"
 />
 ) : (
 <div className="no-print flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
 📄
 </div>
 <div>
 <h2 className="text-sm font-bold text-slate-900 tracking-tight">
 PRESTAÇÃO DE CONTAS E REEMBOLSO DE DESPESAS CORPORATIVA - RDC
 </h2>
 <p className="text-xs text-slate-500 ">
 Modelo Oficial Institucional ABEAS - Formulário completo com controle de gastos e rateio
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Conteúdo Principal */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
 {erro && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erro}</span>
 </div>
 )}

 {notificacaoModelo && (
 <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
 <Check className="w-4 h-4 text-emerald-600 shrink-0" />
 <span className="font-medium">{notificacaoModelo}</span>
 </div>
 )}

 {modoPreVisualizar ? (
 <div className="print-document bg-slate-100 p-4 sm:p-6 rounded-xl flex justify-center print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible">
 <UnifiedRdcPrint
 dados={{
 numero: numeroRdcAuto,
 detalhes: {
 linha_gasto: linhaGasto,
 data_pedido: dataPedido,
 numero_pedido: numeroPedido,
 local_partida: localPartida,
 destino: destino,
 nome_solicitante: nomeSolicitante,
 cpf_solicitante: cpfSolicitante,
 setor_funcao: setorFuncao,
 objetivo_viagem: objetivoViagem,
 valor_solicitado: valorSolicitado,
 nome_banco: nomeBanco,
 agencia: agencia,
 conta: conta,
 tipo_conta: tipoConta,
 chave_pix: chavePix,
 data_entrega_rdc: dataEntregaRdc,
 itens: itens,
 total_despesas: totalDespesas,
 valor_adiantamento: valorSolicitado,
 saldo_devolucao_ressarcimento: saldoDevolucao,
 valor_ressarcir_solicitante: valorARessarcir,
 assinatura_profissional: assinaturaProfissional,
 diretoria_direta: diretoriaDireta,
 contabil_financeiro: contabilFinanceiro,
 },
 tiposGasto,
 tiposDoc,
 }}
 />
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-5">
 {/* BLOCO: Selecionar Modelo de Despesa */}
 <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <Layers className="w-4 h-4 text-blue-700 " />
 <div>
 <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
 Modelo de Despesa Pré-Configurado
 </span>
 <p className="text-[11px] text-blue-800/80 ">
 Carregue uma configuração salva no banco para preencher automaticamente os campos e despesas padrão.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={handlePreencherExemplo}
 className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
 title="Preencher com dados de exemplo para testes rápidos"
 >
 <Sparkles className="w-3 h-3 text-amber-500" />
 <span>Exemplo Rápido</span>
 </button>
 </div>
 </div>

 <div className="pt-1">
 <select
 value={modeloSelecionadoId}
 onChange={(e) => handleSelecionarModelo(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg text-slate-900 font-medium focus:border-blue-700 outline-none"
 >
 <option value="">Selecione um Modelo de Despesa salvo para carregar...</option>
 {modelosDespesa.map((m) => (
 <option key={m.id} value={m.id}>
 📌 {m.nome} ({m.linha_gasto === 'corporativa' ? 'Corporativa' : m.linha_gasto === 'ambas' ? 'Ambas' : 'Viagem'}) — {m.itens_padrao?.length || 0} itens padrão
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* 1. SEÇÃO: Informações do Solicitante da Viagem ou Despesas Corporativas */}
 <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 transition-colors">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
 <div>
 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
 1. INFORMAÇÕES DO SOLICITANTE DA VIAGEM OU DESPESAS CORPORATIVAS
 </h3>
 <p className="text-[11px] text-slate-500 mt-0.5">
 Esta RDC pode registrar despesas com viagens técnicas, despesas corporativas gerais ou ambas as linhas.
 </p>
 </div>

 {/* Seletor de Linha de Gastos */}
 <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0">
 <button
 type="button"
 onClick={() => setLinhaGasto('viagem')}
 className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
 linhaGasto === 'viagem'
 ? 'bg-white text-slate-900 shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 '
 }`}
 >
 ✈️ Viagem
 </button>
 <button
 type="button"
 onClick={() => setLinhaGasto('corporativa')}
 className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
 linhaGasto === 'corporativa'
 ? 'bg-white text-slate-900 shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 '
 }`}
 >
 🏢 Corporativa
 </button>
 <button
 type="button"
 onClick={() => setLinhaGasto('ambas')}
 className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
 linhaGasto === 'ambas'
 ? 'bg-white text-slate-900 shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 '
 }`}
 >
 🌐 Ambas
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Data do pedido *
 </label>
 <input
 type="date"
 required
 value={dataPedido}
 onChange={(e) => setDataPedido(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 N.º Pedido *
 </label>
 <input
 type="text"
 required
 value={numeroPedido}
 onChange={(e) => setNumeroPedido(e.target.value)}
 placeholder="Ex: 2026/089"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 {linhaGasto === 'corporativa' ? 'Local / Origem Corporativa *' : 'Local de partida *'}
 </label>
 <input
 type="text"
 required
 value={localPartida}
 onChange={(e) => setLocalPartida(e.target.value)}
 placeholder={linhaGasto === 'corporativa' ? 'Ex: Sede Central' : 'Ex: Brasília/DF'}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 {linhaGasto === 'corporativa' ? 'Destino / Unidade Beneficiada *' : 'Destino *'}
 </label>
 <input
 type="text"
 required
 value={destino}
 onChange={(e) => setDestino(e.target.value)}
 placeholder={linhaGasto === 'corporativa' ? 'Ex: Departamento Local' : 'Ex: São Paulo/SP'}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Nome - Solicitante *
 </label>
 <input
 type="text"
 required
 value={nomeSolicitante}
 onChange={(e) => {
 setNomeSolicitante(e.target.value);
 setAssinaturaProfissional(e.target.value);
 }}
 placeholder="Ex: Lucas Oliveira"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-medium"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Nº CPF *
 </label>
 <input
 type="text"
 required
 value={cpfSolicitante}
 onChange={(e) => setCpfSolicitante(mascaraCpf(e.target.value))}
 placeholder="000.000.000-00"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Setor / Função *
 </label>
 <input
 type="text"
 required
 value={setorFuncao}
 onChange={(e) => setSetorFuncao(e.target.value)}
 placeholder="Ex: Auditor de Sistemas"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 {linhaGasto === 'corporativa'
 ? 'Objetivo das despesas corporativas *'
 : 'Objetivo da viagem / despesas *'}
 </label>
 <textarea
 rows={2}
 required
 value={objetivoViagem}
 onChange={(e) => setObjetivoViagem(e.target.value)}
 placeholder="Descreva detalhadamente o motivo e objetivo das despesas realizadas..."
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 {/* 2. SEÇÃO: Informações bancária e financeira */}
 <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 transition-colors">
 <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
 2. INFORMAÇÕES BANCÁRIA E FINANCEIRA
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Valor solicitado (Adiantamento)
 </label>
 <div className="relative">
 <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-semibold">
 R$
 </span>
 <input
 type="text"
 value={valorSolicitadoRaw}
 onChange={handleValorSolicitadoChange}
 placeholder="0,00"
 className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
 />
 </div>
 </div>

 <div className="sm:col-span-1">
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Nome do Banco
 </label>
 <input
 type="text"
 value={nomeBanco}
 onChange={(e) => setNomeBanco(e.target.value)}
 placeholder="Ex: Banco do Brasil"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 N.º Agência
 </label>
 <input
 type="text"
 value={agencia}
 onChange={(e) => setAgencia(e.target.value)}
 placeholder="Ex: 1820-1"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 N.º Conta
 </label>
 <input
 type="text"
 value={conta}
 onChange={(e) => setConta(e.target.value)}
 placeholder="Ex: 45.890-2"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Tipo da Conta
 </label>
 <input
 type="text"
 value={tipoConta}
 onChange={(e) => setTipoConta(e.target.value)}
 placeholder="Ex: Conta Corrente / Poupança"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Chave do PIX
 </label>
 <input
 type="text"
 value={chavePix}
 onChange={(e) => setChavePix(e.target.value)}
 placeholder="Ex: email@dominio.com ou CPF"
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
 />
 </div>
 </div>
 </div>

 {/* 3. SEÇÃO: Descrição dos gastos */}
 <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 transition-colors">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
 3. DESCRIÇÃO DOS GASTOS
 </span>
 <span className="text-[11px] text-slate-500 ">
 ({itens.length} itens cadastrados)
 </span>
 </div>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1.5">
 <label className="text-[11px] font-semibold text-slate-700 ">
 Data entrega - RDC:
 </label>
 <input
 type="date"
 value={dataEntregaRdc}
 onChange={(e) => setDataEntregaRdc(e.target.value)}
 className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none"
 />
 </div>

 <button
 type="button"
 onClick={handleAdicionarItem}
 className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Adicionar Item</span>
 </button>
 </div>
 </div>

 {/* Tabela de Itens Editáveis */}
 <div className="overflow-x-auto border border-slate-200 rounded-lg">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 ">
 <th className="px-2 py-1.5 w-32">Data</th>
 <th className="px-2 py-1.5 w-36">Tipo de Gasto</th>
 <th className="px-2 py-1.5 w-28">Tipo Doc.</th>
 <th className="px-2 py-1.5">Fornecedor / Observação / Nº Doc.</th>
 <th className="px-2 py-1.5 w-28 text-right">Valor (R$)</th>
 <th className="px-2 py-1.5 w-10 text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 ">
 {itens.length === 0 ? (
 <tr>
 <td colSpan={6} className="py-6 text-center text-xs text-slate-400 ">
 Nenhum item adicionado. Clique no botão &ldquo;+ Adicionar Item&rdquo; ou carregue um Modelo acima.
 </td>
 </tr>
 ) : (
 itens.map((it) => (
 <tr key={it.id} className="hover:bg-slate-50/50 ">
 <td className="p-1">
 <input
 type="date"
 value={it.data || ''}
 onChange={(e) => handleItemChange(it.id, 'data', e.target.value)}
 className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none font-mono"
 title="Data da despesa"
 />
 </td>
 <td className="p-1">
 <select
 value={it.tipo_gasto}
 onChange={(e) => handleItemChange(it.id, 'tipo_gasto', e.target.value)}
 className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none"
 >
 {tiposGasto.map((tg) => (
 <option key={tg.codigo} value={tg.codigo}>
 {tg.codigo} - {tg.nome}
 </option>
 ))}
 </select>
 </td>
 <td className="p-1">
 <select
 value={it.tipo_doc}
 onChange={(e) => handleItemChange(it.id, 'tipo_doc', e.target.value)}
 className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none"
 >
 {tiposDoc.map((td) => (
 <option key={td.codigo} value={td.codigo}>
 {td.codigo} ({td.nome})
 </option>
 ))}
 </select>
 </td>
 <td className="p-1">
 <input
 type="text"
 value={it.descricao}
 onChange={(e) => handleItemChange(it.id, 'descricao', e.target.value)}
 placeholder="Ex: Restaurante Central - Almoço diretoria - NF 982"
 className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none"
 />
 </td>
 <td className="p-1">
 <input
 type="number"
 step="0.01"
 min="0"
 value={it.valor === 0 ? '' : it.valor}
 onChange={(e) => handleItemChange(it.id, 'valor', e.target.value)}
 placeholder="0,00"
 className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 outline-none font-mono text-right"
 />
 </td>
 <td className="p-1 text-center">
 <button
 type="button"
 onClick={() => handleRemoverItem(it.id)}
 className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
 title="Remover item"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* 4. SEÇÃO: Totais e Fechamento Financeiro */}
 <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 transition-colors">
 <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
 4. TOTAIS E FECHAMENTO FINANCEIRO
 </div>

 <div className="space-y-1.5 text-xs text-slate-800 ">
 <div className="flex justify-between items-center py-1 border-b border-slate-100 ">
 <span className="font-semibold">Total das Despesas:</span>
 <span className="font-mono font-bold text-sm text-slate-900 ">
 {formatarMoeda(totalDespesas)}
 </span>
 </div>

 <div className="flex justify-between items-center py-1 border-b border-slate-100 ">
 <span>Valor recebido de adiantamento:</span>
 <span className="font-mono font-semibold">
 {formatarMoeda(valorSolicitado)}
 </span>
 </div>

 <div className="flex justify-between items-center py-1 border-b border-slate-100 ">
 <div>
 <span className="font-semibold">Saldo devolução/ressarcimento:</span>
 <div className="text-[10px] text-slate-400 ">
 (Saldo negativo, a receber. Saldo positivo, devolver na conta de origem)
 </div>
 </div>
 <span
 className={`font-mono font-bold text-xs ${
 saldoDevolucao < 0
 ? 'text-blue-600 '
 : saldoDevolucao > 0
 ? 'text-amber-600 '
 : 'text-slate-700 '
 }`}
 >
 {formatarMoeda(saldoDevolucao)}
 </span>
 </div>

 <div className="flex justify-between items-center py-2 bg-blue-50/70 px-3 rounded-lg">
 <span className="font-bold text-blue-900 ">
 {saldoDevolucao < 0
 ? 'Valor a ressarcir na conta do solicitante:'
 : 'Valor a devolver na conta de origem:'}
 </span>
 <span className="font-mono font-bold text-blue-900 text-sm">
 {formatarMoeda(saldoDevolucao < 0 ? valorARessarcir : saldoDevolucao)}
 </span>
 </div>
 </div>

 {/* Aviso Obrigatório em Destaque */}
 <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-center text-red-700 font-bold text-[11px] tracking-wide uppercase">
 DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
 </div>
 </div>

 {/* 5. SEÇÃO: Assinaturas e aprovação das despesas */}
 <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 transition-colors">
 <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
 5. ASSINATURAS E APROVAÇÃO DAS DESPESAS
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Assinatura do profissional (Solicitante)
 </label>
 <input
 type="text"
 value={assinaturaProfissional}
 onChange={(e) => setAssinaturaProfissional(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Diretoria direta
 </label>
 <input
 type="text"
 value={diretoriaDireta}
 onChange={(e) => setDiretoriaDireta(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Contábil / Financeiro
 </label>
 <input
 type="text"
 value={contabilFinanceiro}
 onChange={(e) => setContabilFinanceiro(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>
 </div>

 {/* Footer com Botões */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-200 ">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
 className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
 >
 <Eye className="w-3.5 h-3.5 text-blue-600 " />
 <span>PRÉ-VISUALIZAR RDC</span>
 </button>

 <button
 type="submit"
 disabled={isSubmitting}
 className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
 >
 <Check className="w-3.5 h-3.5 text-blue-400 " />
 <span>{isSubmitting ? 'EMITINDO...' : 'EMITIR RDC COM PRESTAÇÃO DE CONTAS'}</span>
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
