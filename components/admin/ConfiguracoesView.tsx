'use client';

import React, { useState } from 'react';
import {
 SistemaConfig,
 TipoGastoConfig,
 TipoDocConfig,
 ModeloDespesa,
 ItemModeloDespesa,
 Empresa,
} from '@/lib/types';
import {
 StorageService,
 DEFAULT_TIPOS_GASTO,
 DEFAULT_TIPOS_DOC,
 INITIAL_MODELOS_DESPESA,
} from '@/lib/storage';
import { formatarMoeda, mascaraCnpj, mascaraCpf } from '@/lib/masks';
import {
 Settings,
 Save,
 RotateCcw,
 Download,
 Check,
 AlertCircle,
 Plus,
 Pencil,
 Trash2,
 Receipt,
 FileSpreadsheet,
 FileText,
 Layers,
 X,
 Sparkles,
 Eye,
 Info,
 Building2,
 Search,
} from 'lucide-react';

type TabConfig = 'geral' | 'tipos-gasto' | 'tipos-doc' | 'modelos-despesa' | 'manutencao';

export function ConfiguracoesView() {
 const [activeTab, setActiveTab] = useState<TabConfig>('geral');
 const [config, setConfig] = useState<SistemaConfig>(() => StorageService.getConfig());
 const [tiposGasto, setTiposGasto] = useState<TipoGastoConfig[]>(() =>
 StorageService.getTiposGasto()
 );
 const [tiposDoc, setTiposDoc] = useState<TipoDocConfig[]>(() =>
 StorageService.getTiposDoc()
 );
 const [modelosDespesa, setModelosDespesa] = useState<ModeloDespesa[]>(() =>
  StorageService.getModelosDespesa()
 );
 const [empresas, setEmpresas] = useState<Empresa[]>(() => StorageService.getEmpresas());
 const [buscaFornecedor, setBuscaFornecedor] = useState('');

 const handleAtualizarNumeroFornecedor = (empresaId: string, novoValor: number) => {
  const valor = Math.max(1, Math.floor(novoValor) || 1);
  setConfig((prev) => ({
   ...prev,
   numeracao_fornecedores: {
    ...(prev.numeracao_fornecedores || {}),
    [empresaId]: valor,
   },
  }));
 };

 const handleSalvarNumeroIndividual = (empresaId: string, nomeEmpresa: string) => {
  const valor = config.numeracao_fornecedores?.[empresaId] ?? StorageService.getProximoNumeroReciboFornecedor(empresaId);
  StorageService.setProximoNumeroReciboFornecedor(empresaId, valor);
  setEmpresas(StorageService.getEmpresas());
  notificarSucesso(`Sequência do fornecedor "${nomeEmpresa}" atualizada para o próximo Nº ${String(valor).padStart(3, '0')} com sucesso!`);
 };

 const [sucesso, setSucesso] = useState<string | null>(null);
 const [erro, setErro] = useState<string | null>(null);

 // --- Estados do Modal de Tipo de Gasto ---
 const [modalGastoAberto, setModalGastoAberto] = useState(false);
 const [gastoEditando, setGastoEditando] = useState<TipoGastoConfig | null>(null);
 const [gastoCodigo, setGastoCodigo] = useState<number>(1);
 const [gastoNome, setGastoNome] = useState('');
 const [gastoDescricao, setGastoDescricao] = useState('');
 const [erroGasto, setErroGasto] = useState<string | null>(null);

 // --- Estados do Modal de Tipo de Doc ---
 const [modalDocAberto, setModalDocAberto] = useState(false);
 const [docEditando, setDocEditando] = useState<TipoDocConfig | null>(null);
 const [docCodigo, setDocCodigo] = useState('');
 const [docNome, setDocNome] = useState('');
 const [docDescricao, setDocDescricao] = useState('');
 const [erroDoc, setErroDoc] = useState<string | null>(null);

 // --- Estados do Modal de Modelo de Despesa ---
 const [modalModeloAberto, setModalModeloAberto] = useState(false);
 const [modeloEditando, setModeloEditando] = useState<ModeloDespesa | null>(null);
 const [modeloNome, setModeloNome] = useState('');
 const [modeloDescricao, setModeloDescricao] = useState('');
 const [modeloLinhaGasto, setModeloLinhaGasto] = useState<'viagem' | 'corporativa' | 'ambas'>('viagem');
 const [modeloLocalPartida, setModeloLocalPartida] = useState('Brasília/DF');
 const [modeloDestino, setModeloDestino] = useState('');
 const [modeloSetorFuncao, setModeloSetorFuncao] = useState('');
 const [modeloObjetivo, setModeloObjetivo] = useState('');
 const [modeloAdiantamento, setModeloAdiantamento] = useState<number>(0);
 const [modeloNomeBanco, setModeloNomeBanco] = useState('Banco do Brasil');
 const [modeloAgencia, setModeloAgencia] = useState('');
 const [modeloConta, setModeloConta] = useState('');
 const [modeloTipoConta, setModeloTipoConta] = useState('Conta Corrente');
 const [modeloPix, setModeloPix] = useState('');
 const [modeloDiretoria, setModeloDiretoria] = useState('');
 const [modeloContabil, setModeloContabil] = useState('Setor Contábil / Financeiro ABEAS');
 const [modeloItens, setModeloItens] = useState<ItemModeloDespesa[]>([]);
 const [erroModelo, setErroModelo] = useState<string | null>(null);

 // Modal de Detalhes do Modelo
 const [modeloVisualizando, setModeloVisualizando] = useState<ModeloDespesa | null>(null);

 // --- Estados de Confirmação de Exclusão ---
 const [itemExcluindo, setItemExcluindo] = useState<{
 tipo: 'gasto' | 'doc' | 'modelo';
 id: string;
 titulo: string;
 } | null>(null);

 const [modalConfirmReset, setModalConfirmReset] = useState<
 'gastos' | 'docs' | 'modelos' | 'fabrica' | null
 >(null);

 const notificarSucesso = (msg: string) => {
 setSucesso(msg);
 setErro(null);
 setTimeout(() => setSucesso(null), 3500);
 };

 const handleSalvarGeral = (e: React.FormEvent) => {
 e.preventDefault();
 setErro(null);

 if (!config.nome_organizacao.trim()) {
 setErro('O Nome da Organização / Instituição é obrigatório.');
 return;
 }

 if (!config.sigla_organizacao?.trim()) {
 setErro('A Sigla da Organização é obrigatória (ex: ABEAS).');
 return;
 }

 if (!config.cidade_padrao?.trim()) {
 setErro('A Cidade/UF Padrão é obrigatória (ex: Brasília/DF).');
 return;
 }

 if (!config.ano_corrente || config.ano_corrente < 2000 || config.ano_corrente > 2100) {
 setErro('Informe um Ano Fiscal Corrente válido (entre 2000 e 2100).');
 return;
 }

 if (
 !config.proximo_recibo_num ||
 isNaN(config.proximo_recibo_num) ||
 config.proximo_recibo_num <= 0 ||
 !config.proximo_rdc_num ||
 isNaN(config.proximo_rdc_num) ||
 config.proximo_rdc_num <= 0 ||
 (config.proximo_recibo_medico_num !== undefined &&
 (isNaN(config.proximo_recibo_medico_num) || config.proximo_recibo_medico_num <= 0))
 ) {
 setErro('Os números sequenciais devem ser numéricos válidos e maiores que zero.');
 return;
 }

 StorageService.saveConfig(config);
 if (config.numeracao_fornecedores) {
 Object.entries(config.numeracao_fornecedores).forEach(([empId, proxNum]) => {
 StorageService.setProximoNumeroReciboFornecedor(empId, proxNum);
 });
 }
 setEmpresas(StorageService.getEmpresas());
 notificarSucesso('Configurações gerais e numerações por fornecedor salvas com sucesso!');
 };

 // ==========================================
 // MANIPULAÇÃO DE TIPOS DE GASTO (RDC)
 // ==========================================
 const handleAbrirNovoGasto = () => {
 setGastoEditando(null);
 const codigosExistentes = tiposGasto.map((g) => g.codigo);
 let proxCod = 1;
 while (codigosExistentes.includes(proxCod)) {
 proxCod++;
 }
 setGastoCodigo(proxCod);
 setGastoNome('');
 setGastoDescricao('');
 setErroGasto(null);
 setModalGastoAberto(true);
 };

 const handleAbrirEditarGasto = (tg: TipoGastoConfig) => {
 setGastoEditando(tg);
 setGastoCodigo(tg.codigo);
 setGastoNome(tg.nome);
 setGastoDescricao(tg.descricao || '');
 setErroGasto(null);
 setModalGastoAberto(true);
 };

 const handleSalvarGasto = (e: React.FormEvent) => {
 e.preventDefault();
 setErroGasto(null);

 if (gastoCodigo <= 0) {
 setErroGasto('O código numérico deve ser maior que zero.');
 return;
 }

 if (!gastoNome.trim()) {
 setErroGasto('O nome do Tipo de Gasto é obrigatório.');
 return;
 }

 const codJaExiste = tiposGasto.some(
 (g) => g.codigo === gastoCodigo && (!gastoEditando || g.id !== gastoEditando.id)
 );
 if (codJaExiste) {
 setErroGasto(`Já existe um tipo de gasto cadastrado com o código ${gastoCodigo}. Escolha outro número.`);
 return;
 }

 const itemSalvo: TipoGastoConfig = {
 id: gastoEditando ? gastoEditando.id : `tg-${Date.now()}`,
 codigo: gastoCodigo,
 nome: gastoNome.trim(),
 descricao: gastoDescricao.trim() || undefined,
 };

 const atualizados = StorageService.saveTipoGasto(itemSalvo);
 setTiposGasto(atualizados);
 setModalGastoAberto(false);
 notificarSucesso(
 gastoEditando
 ? `Tipo de Gasto "${itemSalvo.nome}" atualizado com sucesso!`
 : `Novo Tipo de Gasto "${itemSalvo.nome}" cadastrado com sucesso!`
 );
 };

 const confirmarExcluirGasto = () => {
 if (!itemExcluindo || itemExcluindo.tipo !== 'gasto') return;
 if (tiposGasto.length <= 1) {
 setErro('Não é possível excluir todos os tipos de gastos. Mantenha pelo menos um cadastrado.');
 setItemExcluindo(null);
 return;
 }

 const atualizados = StorageService.deleteTipoGasto(itemExcluindo.id);
 setTiposGasto(atualizados);
 setItemExcluindo(null);
 notificarSucesso(`Tipo de Gasto "${itemExcluindo.titulo}" excluído.`);
 };

 const handleRestaurarPadraoGastos = () => {
 setModalConfirmReset('gastos');
 };

 const executarRestaurarPadraoGastos = () => {
 const padroes = StorageService.resetTiposGastoPadrao();
 setTiposGasto(padroes);
 setModalConfirmReset(null);
 notificarSucesso('Tipos de Gastos restaurados para a lista padrão original!');
 };

 // ==========================================
 // MANIPULAÇÃO DE TIPOS DE DOCUMENTO (RDC)
 // ==========================================
 const handleAbrirNovoDoc = () => {
 setDocEditando(null);
 setDocCodigo('');
 setDocNome('');
 setDocDescricao('');
 setErroDoc(null);
 setModalDocAberto(true);
 };

 const handleAbrirEditarDoc = (td: TipoDocConfig) => {
 setDocEditando(td);
 setDocCodigo(td.codigo);
 setDocNome(td.nome);
 setDocDescricao(td.descricao || '');
 setErroDoc(null);
 setModalDocAberto(true);
 };

 const handleSalvarDoc = (e: React.FormEvent) => {
 e.preventDefault();
 setErroDoc(null);

 const siglaLimpa = docCodigo.trim();
 if (!siglaLimpa) {
 setErroDoc('A sigla / código do Tipo de Documento é obrigatória (ex: Rec, NF, CF).');
 return;
 }

 if (siglaLimpa.length > 8) {
 setErroDoc('A sigla deve conter no máximo 8 caracteres.');
 return;
 }

 if (!docNome.trim()) {
 setErroDoc('O nome completo do documento é obrigatório.');
 return;
 }

 const siglaExiste = tiposDoc.some(
 (d) =>
 d.codigo.toLowerCase() === siglaLimpa.toLowerCase() &&
 (!docEditando || d.id !== docEditando.id)
 );
 if (siglaExiste) {
 setErroDoc(`Já existe um Tipo de Documento cadastrado com a sigla "${siglaLimpa}".`);
 return;
 }

 const itemSalvo: TipoDocConfig = {
 id: docEditando ? docEditando.id : `td-${Date.now()}`,
 codigo: siglaLimpa,
 nome: docNome.trim(),
 descricao: docDescricao.trim() || undefined,
 };

 const atualizados = StorageService.saveTipoDoc(itemSalvo);
 setTiposDoc(atualizados);
 setModalDocAberto(false);
 notificarSucesso(
 docEditando
 ? `Tipo de Documento "${itemSalvo.codigo} - ${itemSalvo.nome}" atualizado!`
 : `Tipo de Documento "${itemSalvo.codigo} - ${itemSalvo.nome}" cadastrado com sucesso!`
 );
 };

 const confirmarExcluirDoc = () => {
 if (!itemExcluindo || itemExcluindo.tipo !== 'doc') return;
 if (tiposDoc.length <= 1) {
 setErro('Não é possível excluir todos os tipos de documentos. Mantenha pelo menos um cadastrado.');
 setItemExcluindo(null);
 return;
 }

 const atualizados = StorageService.deleteTipoDoc(itemExcluindo.id);
 setTiposDoc(atualizados);
 setItemExcluindo(null);
 notificarSucesso(`Tipo de Documento "${itemExcluindo.titulo}" excluído.`);
 };

 const handleRestaurarPadraoDocs = () => {
 setModalConfirmReset('docs');
 };

 const executarRestaurarPadraoDocs = () => {
 const padroes = StorageService.resetTiposDocPadrao();
 setTiposDoc(padroes);
 setModalConfirmReset(null);
 notificarSucesso('Tipos de Documento restaurados para o padrão original!');
 };

 // ==========================================
 // MANIPULAÇÃO DE MODELOS DE DESPESA (RDC)
 // ==========================================
 const handleAbrirNovoModelo = () => {
 setModeloEditando(null);
 setModeloNome('');
 setModeloDescricao('');
 setModeloLinhaGasto('viagem');
 setModeloLocalPartida('');
 setModeloDestino('');
 setModeloSetorFuncao('');
 setModeloObjetivo('');
 setModeloAdiantamento(1000);
 setModeloNomeBanco('Banco do Brasil');
 setModeloAgencia('1820-1');
 setModeloConta('45.890-2');
 setModeloTipoConta('Conta Corrente');
 setModeloPix('');
 setModeloDiretoria('');
 setModeloContabil('Setor Contábil / Financeiro ABEAS');
 setModeloItens([
 {
 id: `item-${Date.now()}-1`,
 tipo_gasto: 1,
 tipo_doc: 'NF',
 descricao: 'Almoço de trabalho equipe',
 valor: 150.0,
 },
 ]);
 setErroModelo(null);
 setModalModeloAberto(true);
 };

 const handleAbrirEditarModelo = (mod: ModeloDespesa) => {
 setModeloEditando(mod);
 setModeloNome(mod.nome);
 setModeloDescricao(mod.descricao || '');
 setModeloLinhaGasto(mod.linha_gasto || 'viagem');
 setModeloLocalPartida(mod.local_partida_padrao || '');
 setModeloDestino(mod.destino_padrao || '');
 setModeloSetorFuncao(mod.setor_funcao_padrao || '');
 setModeloObjetivo(mod.objetivo_padrao || '');
 setModeloAdiantamento(mod.valor_adiantamento_sugerido || 0);
 setModeloNomeBanco(mod.nome_banco_padrao || 'Banco do Brasil');
 setModeloAgencia(mod.agencia_padrao || '');
 setModeloConta(mod.conta_padrao || '');
 setModeloTipoConta(mod.tipo_conta_padrao || 'Conta Corrente');
 setModeloPix(mod.chave_pix_padrao || '');
 setModeloDiretoria(mod.diretoria_direta_padrao || '');
 setModeloContabil(mod.contabil_financeiro_padrao || 'Setor Contábil / Financeiro ABEAS');
 setModeloItens(
 mod.itens_padrao && mod.itens_padrao.length > 0
 ? [...mod.itens_padrao]
 : []
 );
 setErroModelo(null);
 setModalModeloAberto(true);
 };

 const handleAdicionarItemModelo = () => {
 const novo: ItemModeloDespesa = {
 id: `mod-item-${Date.now()}`,
 tipo_gasto: tiposGasto[0]?.codigo || 1,
 tipo_doc: tiposDoc[0]?.codigo || 'NF',
 descricao: '',
 valor: 0,
 };
 setModeloItens([...modeloItens, novo]);
 };

 const handleRemoverItemModelo = (id: string) => {
 setModeloItens(modeloItens.filter((it) => it.id !== id));
 };

 const handleAtualizarItemModelo = (
 id: string,
 campo: keyof ItemModeloDespesa,
 valor: string | number
 ) => {
 setModeloItens(
 modeloItens.map((it) => {
 if (it.id === id) {
 return { ...it, [campo]: valor };
 }
 return it;
 })
 );
 };

 const handleSalvarModelo = (e: React.FormEvent) => {
 e.preventDefault();
 setErroModelo(null);

 if (!modeloNome.trim()) {
 setErroModelo('O nome do modelo de despesa é obrigatório.');
 return;
 }

 const modeloSalvo: ModeloDespesa = {
 id: modeloEditando ? modeloEditando.id : `mod-${Date.now()}`,
 nome: modeloNome.trim(),
 descricao: modeloDescricao.trim() || undefined,
 linha_gasto: modeloLinhaGasto,
 local_partida_padrao: modeloLocalPartida.trim() || undefined,
 destino_padrao: modeloDestino.trim() || undefined,
 setor_funcao_padrao: modeloSetorFuncao.trim() || undefined,
 objetivo_padrao: modeloObjetivo.trim() || undefined,
 valor_adiantamento_sugerido: Number(modeloAdiantamento) || 0,
 nome_banco_padrao: modeloNomeBanco.trim() || undefined,
 agencia_padrao: modeloAgencia.trim() || undefined,
 conta_padrao: modeloConta.trim() || undefined,
 tipo_conta_padrao: modeloTipoConta.trim() || undefined,
 chave_pix_padrao: modeloPix.trim() || undefined,
 diretoria_direta_padrao: modeloDiretoria.trim() || undefined,
 contabil_financeiro_padrao: modeloContabil.trim() || undefined,
 itens_padrao: modeloItens.map((it) => ({
 id: it.id,
 data: it.data || undefined,
 tipo_gasto: Number(it.tipo_gasto) || 1,
 tipo_doc: String(it.tipo_doc || 'NF'),
 descricao: it.descricao.trim(),
 valor: Number(it.valor) || 0,
 })),
 created_at: modeloEditando ? modeloEditando.created_at : new Date().toISOString(),
 };

 StorageService.saveModeloDespesa(modeloSalvo);
 setModelosDespesa(StorageService.getModelosDespesa());
 setModalModeloAberto(false);
 notificarSucesso(
 modeloEditando
 ? `Modelo de despesa "${modeloSalvo.nome}" atualizado com sucesso!`
 : `Modelo de despesa "${modeloSalvo.nome}" salvo com sucesso no banco de dados!`
 );
 };

 const confirmarExcluirModelo = () => {
 if (!itemExcluindo || itemExcluindo.tipo !== 'modelo') return;
 StorageService.deleteModeloDespesa(itemExcluindo.id);
 setModelosDespesa(StorageService.getModelosDespesa());
 setItemExcluindo(null);
 notificarSucesso(`Modelo de Despesa "${itemExcluindo.titulo}" excluído.`);
 };

 const handleRestaurarPadraoModelos = () => {
 setModalConfirmReset('modelos');
 };

 const executarRestaurarPadraoModelos = () => {
 const padroes = StorageService.resetModelosDespesaPadrao();
 setModelosDespesa(padroes);
 setModalConfirmReset(null);
 notificarSucesso('Modelos de Despesa padrão restaurados com sucesso!');
 };

 // ==========================================
 // MANUTENÇÃO & BACKUP
 // ==========================================
 const handleResetDemo = () => {
 setModalConfirmReset('fabrica');
 };

 const executarResetFabrica = () => {
 StorageService.resetToDefault();
 setConfig(StorageService.getConfig());
 setTiposGasto(StorageService.getTiposGasto());
 setTiposDoc(StorageService.getTiposDoc());
 setModelosDespesa(StorageService.getModelosDespesa());
 setModalConfirmReset(null);
 notificarSucesso('Todos os dados foram restaurados para o padrão original com sucesso!');
 };

 const handleExportJson = () => {
 const dados = {
 usuarios: StorageService.getUsuarios(),
 empresas: StorageService.getEmpresas(),
 documentos: StorageService.getDocumentos(),
 config: StorageService.getConfig(),
 modelos_despesa: StorageService.getModelosDespesa(),
 exportado_em: new Date().toISOString(),
 };

 const blob = new Blob([JSON.stringify(dados, null, 2)], {
 type: 'application/json',
 });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `backup_recibos_rdc_${new Date().toISOString().slice(0, 10)}.json`;
 a.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
 {/* Top Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
 <Settings className="w-4 h-4" />
 </div>
 <h1 className="text-xl font-bold tracking-tight text-slate-900 ">
 Configurações do Sistema
 </h1>
 </div>
 <p className="text-xs text-slate-500 mt-1">
 Controle institucional, numeração sequencial e parametrização dos Tipos de Gasto, Documentos e Modelos de Despesa da RDC
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handleExportJson}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
 >
 <Download className="w-3.5 h-3.5 text-slate-500 " />
 <span>Exportar Backup (JSON)</span>
 </button>
 </div>
 </div>

 {/* Alertas de Notificação */}
 {sucesso && (
 <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
 <Check className="w-4 h-4 text-emerald-600 shrink-0" />
 <span className="font-medium">{sucesso}</span>
 </div>
 )}

 {erro && (
 <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span className="font-medium">{erro}</span>
 </div>
 )}

 {/* Navegação por Abas de Configuração */}
 <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
 <button
 type="button"
 onClick={() => setActiveTab('geral')}
 className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
 activeTab === 'geral'
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 '
 }`}
 >
 <Settings className="w-3.5 h-3.5" />
 <span>Geral & Numeração</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('tipos-gasto')}
 className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
 activeTab === 'tipos-gasto'
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 '
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 <span>Tipos de Gasto na RDC</span>
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
 {tiposGasto.length}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('tipos-doc')}
 className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
 activeTab === 'tipos-doc'
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 '
 }`}
 >
 <FileSpreadsheet className="w-3.5 h-3.5" />
 <span>Tipos de Doc na RDC</span>
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
 {tiposDoc.length}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('modelos-despesa')}
 className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
 activeTab === 'modelos-despesa'
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 '
 }`}
 >
 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
 <span>Modelos de Despesa</span>
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
 {modelosDespesa.length}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('manutencao')}
 className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
 activeTab === 'manutencao'
 ? 'bg-slate-900 text-white shadow-2xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 '
 }`}
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Manutenção & Restauração</span>
 </button>
 </div>

 {/* ======================================================== */}
 {/* ABA 1: GERAL & NUMERAÇÃO */}
 {/* ======================================================== */}
 {activeTab === 'geral' && (
 <form onSubmit={handleSalvarGeral} className="space-y-6">
 {/* Bloco 1: Organização Institucional */}
 <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 transition-colors">
 <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 ">
 Identificação Institucional
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-900 mb-1">
 Nome da Organização / Instituição *
 </label>
 <input
 type="text"
 required
 value={config.nome_organizacao}
 onChange={(e) => setConfig({ ...config, nome_organizacao: e.target.value })}
 placeholder="Ex: ABEAS - Associação Brasileira de Entidades de Assistência Social"
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-900 mb-1">
 Sigla da Organização *
 </label>
 <input
 type="text"
 required
 value={config.sigla_organizacao || ''}
 onChange={(e) => setConfig({ ...config, sigla_organizacao: e.target.value })}
 placeholder="Ex: ABEAS"
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 uppercase font-bold focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-900 mb-1">
 Cidade / UF Padrão de Emissão *
 </label>
 <input
 type="text"
 required
 value={config.cidade_padrao || ''}
 onChange={(e) => setConfig({ ...config, cidade_padrao: e.target.value })}
 placeholder="Ex: Brasília/DF ou Itapuranga/GO"
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-900 mb-1">
 Ano Fiscal Corrente *
 </label>
 <input
 type="number"
 required
 min="2000"
 max="2100"
 value={config.ano_corrente}
 onChange={(e) => setConfig({ ...config, ano_corrente: parseInt(e.target.value, 10) || 2026 })}
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-bold"
 />
 </div>
 </div>
 </div>

 {/* Bloco 2: Numeração Sequencial */}
 <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 transition-colors">
 <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 ">
 Controle de Numeração Sequencial de Documentos
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
 <div className="flex items-center gap-2">
 <Receipt className="w-4 h-4 text-emerald-600 " />
 <span className="text-xs font-semibold text-slate-900 ">
 Próximo Nº Recibo Geral
 </span>
 </div>
 <input
 type="number"
 min="1"
 value={config.proximo_recibo_num}
 onChange={(e) =>
 setConfig({ ...config, proximo_recibo_num: parseInt(e.target.value, 10) || 1 })
 }
 className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
 />
 <p className="text-[10px] text-slate-600 font-medium">
 Próximo formato: {String(config.proximo_recibo_num).padStart(6, '0')}/{config.ano_corrente}
 </p>
 </div>

 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
 <div className="flex items-center gap-2">
 <FileText className="w-4 h-4 text-blue-600 " />
 <span className="text-xs font-semibold text-slate-900 ">
 Próximo Nº RDC
 </span>
 </div>
 <input
 type="number"
 min="1"
 value={config.proximo_rdc_num}
 onChange={(e) =>
 setConfig({ ...config, proximo_rdc_num: parseInt(e.target.value, 10) || 1 })
 }
 className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
 />
 <p className="text-[10px] text-slate-600 font-medium">
 Próximo formato: {String(config.proximo_rdc_num).padStart(6, '0')}/{config.ano_corrente}
 </p>
 </div>

 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-emerald-600 " />
 <span className="text-xs font-semibold text-slate-900 ">
 Próximo Nº Recibo Médico
 </span>
 </div>
 <input
 type="number"
 min="1"
 value={config.proximo_recibo_medico_num || 1}
 onChange={(e) =>
 setConfig({ ...config, proximo_recibo_medico_num: parseInt(e.target.value, 10) || 1 })
 }
 className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
 />
 <p className="text-[10px] text-slate-600 font-medium">
 Próximo formato: {String(config.proximo_recibo_medico_num || 1).padStart(3, '0')}/{config.ano_corrente}
 </p>
 </div>
 </div>

 {/* Subseção: Numeração Individual e Independente por Fornecedor */}
 <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
 <span>Numeração Sequencial de Recibos por Fornecedor</span>
 </h3>
 <p className="text-[11px] text-slate-600 mt-0.5">
 Cada fornecedor possui sequência própria e independente. Um fornecedor novo inicia em 001. A emissão de um recibo para um fornecedor não altera a numeração dos demais.
 </p>
 </div>
 <div className="relative w-full sm:w-64 shrink-0">
 <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
 <input
 type="text"
 value={buscaFornecedor}
 onChange={(e) => setBuscaFornecedor(e.target.value)}
 placeholder="Buscar fornecedor por nome ou CNPJ/CPF..."
 className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-4 py-2.5">Fornecedor / Razão Social</th>
 <th className="px-3 py-2.5 text-center">Último Número Emitido</th>
 <th className="px-3 py-2.5 text-center">Próximo Número (Sequencial)</th>
 <th className="px-3 py-2.5 text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {empresas
 .filter((emp) => emp.status !== 'inativa' && !emp.excluida_logica)
 .filter((emp) => {
 if (!buscaFornecedor.trim()) return true;
 const q = buscaFornecedor.toLowerCase();
 return (
 (emp.razao_social && emp.razao_social.toLowerCase().includes(q)) ||
 (emp.nome_fantasia && emp.nome_fantasia.toLowerCase().includes(q)) ||
 (emp.cnpj && emp.cnpj.includes(q)) ||
 (emp.cidade && emp.cidade.toLowerCase().includes(q))
 );
 })
 .map((emp) => {
 const ultimoNum = StorageService.getUltimoNumeroReciboFornecedor(emp.id);
 const proxNum = config.numeracao_fornecedores?.[emp.id] ?? StorageService.getProximoNumeroReciboFornecedor(emp.id);
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;
 const docFormatado = isPf ? mascaraCpf(emp.cnpj) : mascaraCnpj(emp.cnpj);

 return (
 <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
 <td className="px-4 py-3">
 <div className="font-bold text-slate-900">
 {emp.nome_fantasia || emp.razao_social}
 </div>
 <div className="text-[10px] text-slate-600 font-mono mt-0.5">
 {isPf ? 'CPF' : 'CNPJ'}: {docFormatado} · {emp.cidade}/{emp.uf}
 </div>
 </td>
 <td className="px-3 py-3 text-center font-mono">
 {ultimoNum > 0 ? (
 <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
 {String(ultimoNum).padStart(3, '0')}
 </span>
 ) : (
 <span className="text-slate-600 font-medium italic text-[11px]">
 Nenhum (000)
 </span>
 )}
 </td>
 <td className="px-3 py-3 text-center">
 <div className="inline-flex items-center gap-2">
 <input
 type="number"
 min="1"
 value={proxNum}
 onChange={(e) => handleAtualizarNumeroFornecedor(emp.id, parseInt(e.target.value, 10) || 1)}
 className="w-20 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 text-center focus:bg-white focus:border-slate-800 outline-none"
 />
 <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
 {String(proxNum).padStart(3, '0')}/{config.ano_corrente}
 </span>
 </div>
 </td>
 <td className="px-3 py-3 text-center">
 <button
 type="button"
 onClick={() => handleSalvarNumeroIndividual(emp.id, emp.nome_fantasia || emp.razao_social)}
 className="px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
 title="Salvar sequência deste fornecedor"
 >
 Salvar
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 {/* Bloco 3: Opções de Emissão e Rodapé Oficial */}
 <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 transition-colors">
 <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 ">
 Opções de Emissão e Rodapé Oficial
 </h2>

 <div className="space-y-4">
 <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
 <input
 type="checkbox"
 checked={config.incluir_segunda_via !== false}
 onChange={(e) => setConfig({ ...config, incluir_segunda_via: e.target.checked })}
 className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
 />
 <div>
 <div className="text-xs font-semibold text-slate-900 ">
 Habilitar Emissão de 2ª Via nos Recibos
 </div>
 <p className="text-[11px] text-slate-600 mt-0.5">
 Quando ativo, permite alternar e emitir tanto a 1ª Via (Destinatário) quanto a 2ª Via (Emissor / Arquivo Contábil).
 </p>
 </div>
 </label>

 <div>
 <label className="block text-xs font-semibold text-slate-900 mb-1">
 Mensagem Padrão de Rodapé dos Recibos e Documentos
 </label>
 <textarea
 rows={2}
 value={config.mensagem_rodape || ''}
 onChange={(e) => setConfig({ ...config, mensagem_rodape: e.target.value })}
 placeholder="Ex: Documento emitido eletronicamente pelo Sistema Oficial de Recibos e RDC."
 className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-2">
 <button
 type="submit"
 className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Salvar Configurações Gerais</span>
 </button>
 </div>
 </form>
 )}

 {/* ======================================================== */}
 {/* ABA 2: TIPOS DE GASTO NA RDC */}
 {/* ======================================================== */}
 {activeTab === 'tipos-gasto' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">
 Tabela de Tipos de Gastos (Coluna 1 da RDC)
 </h2>
 <p className="text-xs text-slate-500 ">
 Códigos e naturezas de despesas utilizados no preenchimento e no rateio da Prestação de Contas
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleRestaurarPadraoGastos}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 <RotateCcw className="w-3.5 h-3.5 text-slate-500 " />
 <span>Restaurar Padrão</span>
 </button>

 <button
 type="button"
 onClick={handleAbrirNovoGasto}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Novo Tipo de Gasto</span>
 </button>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3 w-20 text-center">Código</th>
 <th className="px-4 py-3">Natureza do Gasto</th>
 <th className="px-4 py-3">Descrição / Exemplos de Aplicação</th>
 <th className="px-4 py-3 text-center w-28">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {tiposGasto.map((tg) => (
 <tr key={tg.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 ">
 <span className="inline-block w-6 h-6 leading-6 rounded bg-blue-100 text-blue-900 text-xs">
 {tg.codigo}
 </span>
 </td>
 <td className="px-4 py-3 font-semibold text-slate-900 ">
 {tg.nome}
 </td>
 <td className="px-4 py-3 text-slate-500 ">
 {tg.descricao || '—'}
 </td>
 <td className="px-4 py-3 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 type="button"
 onClick={() => handleAbrirEditarGasto(tg)}
 className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Editar Tipo de Gasto"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() =>
 setItemExcluindo({
 tipo: 'gasto',
 id: tg.id,
 titulo: `${tg.codigo} - ${tg.nome}`,
 })
 }
 className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Excluir Tipo de Gasto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* ABA 3: TIPOS DE DOC NA RDC */}
 {/* ======================================================== */}
 {activeTab === 'tipos-doc' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">
 Tipos de Comprovantes Aceitos (Coluna 2 da RDC)
 </h2>
 <p className="text-xs text-slate-500 ">
 Documentos fiscais e comprobatórios (Rec, NF, CF, Ticket) válidos para prestação de contas
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleRestaurarPadraoDocs}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 <RotateCcw className="w-3.5 h-3.5 text-slate-500 " />
 <span>Restaurar Padrão</span>
 </button>

 <button
 type="button"
 onClick={handleAbrirNovoDoc}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Novo Tipo de Documento</span>
 </button>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3 w-28 text-center">Sigla / Código</th>
 <th className="px-4 py-3">Nome do Comprovante</th>
 <th className="px-4 py-3">Descrição / Requisitos de Auditoria</th>
 <th className="px-4 py-3 text-center w-28">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {tiposDoc.map((td) => (
 <tr key={td.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 ">
 <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs">
 {td.codigo}
 </span>
 </td>
 <td className="px-4 py-3 font-semibold text-slate-900 ">
 {td.nome}
 </td>
 <td className="px-4 py-3 text-slate-500 ">
 {td.descricao || '—'}
 </td>
 <td className="px-4 py-3 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 type="button"
 onClick={() => handleAbrirEditarDoc(td)}
 className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Editar Tipo de Doc"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() =>
 setItemExcluindo({
 tipo: 'doc',
 id: td.id,
 titulo: `${td.codigo} - ${td.nome}`,
 })
 }
 className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Excluir Tipo de Doc"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* ABA 4: MODELOS DE DESPESA (RDC) */}
 {/* ======================================================== */}
 {activeTab === 'modelos-despesa' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-amber-500" />
 <span>Modelos de Despesa Pré-Configurados (RDC)</span>
 </h2>
 <p className="text-xs text-slate-500 ">
 Configure modelos pré-definidos para agilizar a emissão de RDCs. As alterações salvas aqui são transmitidas imediatamente para novas emissões.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleRestaurarPadraoModelos}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 <RotateCcw className="w-3.5 h-3.5 text-slate-500 " />
 <span>Restaurar Padrão</span>
 </button>

 <button
 type="button"
 onClick={handleAbrirNovoModelo}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Criar Novo Modelo</span>
 </button>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 {modelosDespesa.length === 0 ? (
 <div className="p-12 text-center text-xs text-slate-500 ">
 Nenhum modelo de despesa cadastrado. Clique no botão &ldquo;Criar Novo Modelo&rdquo; para adicionar.
 </div>
 ) : (
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3">Nome do Modelo</th>
 <th className="px-4 py-3">Linha de Gasto</th>
 <th className="px-4 py-3">Origem / Destino Padrão</th>
 <th className="px-4 py-3">Adiantamento Sugerido</th>
 <th className="px-4 py-3 text-center">Itens Padrão</th>
 <th className="px-4 py-3 text-center w-28">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {modelosDespesa.map((mod) => {
 const totalItens = mod.itens_padrao?.length || 0;
 const somaValorItens =
 mod.itens_padrao?.reduce((acc, it) => acc + (Number(it.valor) || 0), 0) || 0;

 return (
 <tr
 key={mod.id}
 className="hover:bg-slate-50 transition-colors"
 >
 <td className="px-4 py-3 max-w-[260px]">
 <div className="font-semibold text-slate-900 ">
 {mod.nome}
 </div>
 {mod.descricao && (
 <div className="text-[11px] text-slate-500 truncate mt-0.5">
 {mod.descricao}
 </div>
 )}
 </td>
 <td className="px-4 py-3 whitespace-nowrap">
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
 mod.linha_gasto === 'viagem'
 ? 'bg-sky-100 text-sky-800 '
 : mod.linha_gasto === 'corporativa'
 ? 'bg-purple-100 text-purple-800 '
 : 'bg-emerald-100 text-emerald-800 '
 }`}
 >
 {mod.linha_gasto === 'corporativa'
 ? '🏢 Corporativa'
 : mod.linha_gasto === 'ambas'
 ? '🔄 Ambas'
 : '✈️ Viagem'}
 </span>
 </td>
 <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
 {mod.local_partida_padrao || '—'} → {mod.destino_padrao || '—'}
 </td>
 <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
 {formatarMoeda(mod.valor_adiantamento_sugerido || 0)}
 </td>
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold">
 {totalItens} {totalItens === 1 ? 'item' : 'itens'} ({formatarMoeda(somaValorItens)})
 </span>
 </td>
 <td className="px-4 py-3 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 type="button"
 onClick={() => setModeloVisualizando(mod)}
 className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
 title="Visualizar Configurações do Modelo"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => handleAbrirEditarModelo(mod)}
 className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Editar Modelo de Despesa"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() =>
 setItemExcluindo({
 tipo: 'modelo',
 id: mod.id,
 titulo: mod.nome,
 })
 }
 className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Excluir Modelo de Despesa"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 )}
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* ABA 5: MANUTENÇÃO & RESTAURAÇÃO */}
 {/* ======================================================== */}
 {activeTab === 'manutencao' && (
 <div className="space-y-6">
 <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 transition-colors">
 <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 ">
 Exportação e Backup
 </h2>
 <p className="text-xs text-slate-500 ">
 Faça download de todos os cadastros de usuários, empresas, recibos emitidos, RDCs e parametrizações em formato JSON para arquivo de segurança.
 </p>

 <div>
 <button
 type="button"
 onClick={handleExportJson}
 className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
 >
 <Download className="w-4 h-4 text-slate-600 " />
 <span>Baixar Cópia de Segurança Completa</span>
 </button>
 </div>
 </div>

 <div className="bg-white border border-red-200 rounded-xl p-6 shadow-2xs space-y-4 transition-colors">
 <h2 className="text-sm font-bold text-red-700 pb-2 border-b border-red-100 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-red-600" />
 <span>Zona de Manutenção Crítica</span>
 </h2>
 <p className="text-xs text-slate-600 leading-relaxed">
 Restaura todo o banco de dados local com as empresas oficiais (ABEAS, Associação), modelos de despesa e usuários de teste. Útil para resetar demonstrações e testes de validação contábil.
 </p>

 <div>
 <button
 type="button"
 onClick={handleResetDemo}
 className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
 >
 <RotateCcw className="w-4 h-4" />
 <span>Restaurar Base de Dados Inicial (Reset de Demonstração)</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: TIPO DE GASTO */}
 {/* ======================================================== */}
 {modalGastoAberto && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
 <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 ">
 <div className="flex items-center gap-2">
 <Layers className="w-4 h-4 text-blue-600 " />
 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
 {gastoEditando ? 'Editar Tipo de Gasto' : 'Novo Tipo de Gasto'}
 </h3>
 </div>
 <button
 onClick={() => setModalGastoAberto(false)}
 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <form onSubmit={handleSalvarGasto} className="p-5 space-y-4">
 {erroGasto && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erroGasto}</span>
 </div>
 )}

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Código *
 </label>
 <input
 type="number"
 min="1"
 required
 value={gastoCodigo}
 onChange={(e) => setGastoCodigo(parseInt(e.target.value, 10) || 1)}
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold outline-none"
 />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nome da Natureza *
 </label>
 <input
 type="text"
 required
 value={gastoNome}
 onChange={(e) => setGastoNome(e.target.value)}
 placeholder="Ex: Hospedagem, Alimentação..."
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Descrição / Exemplos de Aplicação
 </label>
 <textarea
 rows={2}
 value={gastoDescricao}
 onChange={(e) => setGastoDescricao(e.target.value)}
 placeholder="Ex: Despesas com refeições durante viagens ou eventos corporativos..."
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 ">
 <button
 type="button"
 onClick={() => setModalGastoAberto(false)}
 className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Salvar Tipo de Gasto</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: TIPO DE DOCUMENTO */}
 {/* ======================================================== */}
 {modalDocAberto && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
 <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 ">
 <div className="flex items-center gap-2">
 <FileSpreadsheet className="w-4 h-4 text-emerald-600 " />
 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
 {docEditando ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}
 </h3>
 </div>
 <button
 onClick={() => setModalDocAberto(false)}
 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <form onSubmit={handleSalvarDoc} className="p-5 space-y-4">
 {erroDoc && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erroDoc}</span>
 </div>
 )}

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Sigla / Código *
 </label>
 <input
 type="text"
 required
 maxLength={8}
 value={docCodigo}
 onChange={(e) => setDocCodigo(e.target.value)}
 placeholder="NF, Rec, CF"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold outline-none uppercase"
 />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nome Completo *
 </label>
 <input
 type="text"
 required
 value={docNome}
 onChange={(e) => setDocNome(e.target.value)}
 placeholder="Ex: Nota Fiscal, Recibo Comercial..."
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Descrição / Instrução de Auditoria
 </label>
 <textarea
 rows={2}
 value={docDescricao}
 onChange={(e) => setDocDescricao(e.target.value)}
 placeholder="Ex: Nota fiscal eletrônica (NFe, NFCe ou NFSe modelo 55/65)..."
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 ">
 <button
 type="button"
 onClick={() => setModalDocAberto(false)}
 className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Salvar Tipo de Doc</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: CADASTRO / EDIÇÃO DE MODELO DE DESPESA */}
 {/* ======================================================== */}
 {modalModeloAberto && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
 <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-4 transition-colors max-h-[92vh] flex flex-col">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
 <div className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-amber-500" />
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
 {modeloEditando ? 'EDITAR MODELO DE DESPESA' : 'NOVO MODELO DE DESPESA PARA RDC'}
 </h3>
 </div>
 <button
 onClick={() => setModalModeloAberto(false)}
 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSalvarModelo} className="p-6 space-y-4 overflow-y-auto flex-1">
 {erroModelo && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erroModelo}</span>
 </div>
 )}

 {/* Informações Básicas do Modelo */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nome do Modelo *
 </label>
 <input
 type="text"
 required
 value={modeloNome}
 onChange={(e) => setModeloNome(e.target.value)}
 placeholder="Ex: Viagem Técnica e Auditoria Institucional"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Linha de Gasto *
 </label>
 <select
 value={modeloLinhaGasto}
 onChange={(e) =>
 setModeloLinhaGasto(e.target.value as 'viagem' | 'corporativa' | 'ambas')
 }
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 >
 <option value="viagem">✈️ Viagem</option>
 <option value="corporativa">🏢 Corporativa</option>
 <option value="ambas">🔄 Ambas</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Descrição / Finalidade do Modelo
 </label>
 <input
 type="text"
 value={modeloDescricao}
 onChange={(e) => setModeloDescricao(e.target.value)}
 placeholder="Ex: Padrão para deslocamentos de inspeção predial e visitas técnicas..."
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 {/* Origem, Destino, Setor e Objetivo Padrão */}
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
 <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
 Valores Padrão do Solicitante / Viagem
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Local de Partida Padrão
 </label>
 <input
 type="text"
 value={modeloLocalPartida}
 onChange={(e) => setModeloLocalPartida(e.target.value)}
 placeholder="Ex: Brasília/DF"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Destino Padrão
 </label>
 <input
 type="text"
 value={modeloDestino}
 onChange={(e) => setModeloDestino(e.target.value)}
 placeholder="Ex: São Paulo/SP"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Setor / Função Padrão
 </label>
 <input
 type="text"
 value={modeloSetorFuncao}
 onChange={(e) => setModeloSetorFuncao(e.target.value)}
 placeholder="Ex: Auditor de Sistemas"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Objetivo Padrão
 </label>
 <input
 type="text"
 value={modeloObjetivo}
 onChange={(e) => setModeloObjetivo(e.target.value)}
 placeholder="Ex: Auditoria técnica e vistoria in loco de infraestrutura predial..."
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>

 {/* Informações Financeiras e Bancárias */}
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
 <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
 Informações Bancárias e Adiantamento Padrão
 </span>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Adiantamento Sugerido (R$)
 </label>
 <input
 type="number"
 step="0.01"
 min="0"
 value={modeloAdiantamento}
 onChange={(e) => setModeloAdiantamento(parseFloat(e.target.value) || 0)}
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Banco
 </label>
 <input
 type="text"
 value={modeloNomeBanco}
 onChange={(e) => setModeloNomeBanco(e.target.value)}
 placeholder="Ex: Banco do Brasil"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Agência
 </label>
 <input
 type="text"
 value={modeloAgencia}
 onChange={(e) => setModeloAgencia(e.target.value)}
 placeholder="Ex: 1820-1"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Conta
 </label>
 <input
 type="text"
 value={modeloConta}
 onChange={(e) => setModeloConta(e.target.value)}
 placeholder="Ex: 45.890-2"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Diretoria Direta (Assinatura Padrão)
 </label>
 <input
 type="text"
 value={modeloDiretoria}
 onChange={(e) => setModeloDiretoria(e.target.value)}
 placeholder="Ex: Carlos Eduardo Silva"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Contábil / Financeiro (Assinatura Padrão)
 </label>
 <input
 type="text"
 value={modeloContabil}
 onChange={(e) => setModeloContabil(e.target.value)}
 placeholder="Ex: Setor Contábil / Financeiro ABEAS"
 className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
 />
 </div>
 </div>
 </div>

 {/* Tabela de Itens de Despesa Padrão */}
 <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-white ">
 <div className="flex items-center justify-between pb-2 border-b border-slate-100 ">
 <div>
 <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
 Itens de Gastos Padrão ({modeloItens.length})
 </span>
 <p className="text-[11px] text-slate-500 ">
 Estes itens serão preenchidos automaticamente na RDC ao selecionar este modelo.
 </p>
 </div>
 <button
 type="button"
 onClick={handleAdicionarItemModelo}
 className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Adicionar Despesa</span>
 </button>
 </div>

 {modeloItens.length === 0 ? (
 <div className="text-center py-6 text-xs text-slate-400">
 Nenhuma despesa pré-configurada neste modelo. Clique em &ldquo;Adicionar Despesa&rdquo;.
 </div>
 ) : (
 <div className="space-y-2 max-h-56 overflow-y-auto">
 {modeloItens.map((item, index) => (
 <div
 key={item.id}
 className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 "
 >
 <span className="text-[10px] font-mono font-bold text-slate-500 w-5 text-center">
 {index + 1}
 </span>

 <div className="w-full sm:w-36">
 <input
 type="date"
 value={item.data || ''}
 onChange={(e) =>
 handleAtualizarItemModelo(item.id, 'data', e.target.value)
 }
 className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 outline-none font-mono"
 title="Data da despesa"
 />
 </div>

 <div className="w-full sm:w-44">
 <select
 value={item.tipo_gasto}
 onChange={(e) =>
 handleAtualizarItemModelo(
 item.id,
 'tipo_gasto',
 parseInt(e.target.value, 10) || 1
 )
 }
 className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 outline-none"
 >
 {tiposGasto.map((tg) => (
 <option key={tg.id} value={tg.codigo}>
 {tg.codigo} - {tg.nome}
 </option>
 ))}
 </select>
 </div>

 <div className="w-full sm:w-28">
 <select
 value={item.tipo_doc}
 onChange={(e) =>
 handleAtualizarItemModelo(item.id, 'tipo_doc', e.target.value)
 }
 className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 outline-none uppercase font-mono"
 >
 {tiposDoc.map((td) => (
 <option key={td.id} value={td.codigo}>
 {td.codigo}
 </option>
 ))}
 </select>
 </div>

 <div className="flex-1 w-full">
 <input
 type="text"
 value={item.descricao}
 onChange={(e) =>
 handleAtualizarItemModelo(item.id, 'descricao', e.target.value)
 }
 placeholder="Descrição da despesa..."
 className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 outline-none"
 />
 </div>

 <div className="w-full sm:w-28">
 <input
 type="number"
 step="0.01"
 min="0"
 value={item.valor}
 onChange={(e) =>
 handleAtualizarItemModelo(
 item.id,
 'valor',
 parseFloat(e.target.value) || 0
 )
 }
 className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 font-mono font-bold outline-none text-right"
 />
 </div>

 <button
 type="button"
 onClick={() => handleRemoverItemModelo(item.id)}
 className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
 title="Remover Item"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 ">
 <button
 type="button"
 onClick={() => setModalModeloAberto(false)}
 className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
 >
 <Save className="w-3.5 h-3.5" />
 <span>SALVAR MODELO DE DESPESA</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: VISUALIZAÇÃO DE DETALHES DO MODELO */}
 {/* ======================================================== */}
 {modeloVisualizando && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
 <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 ">
 <div className="flex items-center gap-2">
 <Info className="w-4 h-4 text-blue-600 " />
 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
 DETALHES DO MODELO: {modeloVisualizando.nome}
 </h3>
 </div>
 <button
 onClick={() => setModeloVisualizando(null)}
 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="p-6 space-y-4 text-xs">
 <div className="space-y-1">
 <span className="font-semibold text-slate-700 ">Linha de Gastos:</span>
 <p className="text-slate-900 capitalize font-medium">
 {modeloVisualizando.linha_gasto}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <span className="font-semibold text-slate-700 ">Origem:</span>
 <p className="text-slate-900 ">
 {modeloVisualizando.local_partida_padrao || '—'}
 </p>
 </div>
 <div>
 <span className="font-semibold text-slate-700 ">Destino:</span>
 <p className="text-slate-900 ">
 {modeloVisualizando.destino_padrao || '—'}
 </p>
 </div>
 </div>

 <div>
 <span className="font-semibold text-slate-700 ">Objetivo Padrão:</span>
 <p className="text-slate-900 ">
 {modeloVisualizando.objetivo_padrao || '—'}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <span className="font-semibold text-slate-700 ">Adiantamento:</span>
 <p className="text-emerald-700 font-bold font-mono">
 {formatarMoeda(modeloVisualizando.valor_adiantamento_sugerido || 0)}
 </p>
 </div>
 <div>
 <span className="font-semibold text-slate-700 ">Banco:</span>
 <p className="text-slate-900 ">
 {modeloVisualizando.nome_banco_padrao || '—'}
 </p>
 </div>
 </div>

 <div className="border-t border-slate-100 pt-3">
 <span className="font-semibold text-slate-700 block mb-2">
 Itens de Despesa ({modeloVisualizando.itens_padrao?.length || 0}):
 </span>
 <div className="space-y-1.5 max-h-40 overflow-y-auto">
 {modeloVisualizando.itens_padrao?.map((it, idx) => (
 <div
 key={it.id || idx}
 className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]"
 >
 <span className="text-slate-800 ">
 [{it.tipo_gasto} - {it.tipo_doc}] {it.descricao}
 </span>
 <span className="font-mono font-bold text-slate-900 ">
 {formatarMoeda(it.valor)}
 </span>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end pt-3 border-t border-slate-100 ">
 <button
 type="button"
 onClick={() => setModeloVisualizando(null)}
 className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
 >
 Fechar
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
 {/* ======================================================== */}
 {itemExcluindo && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
 <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn transition-colors">
 <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
 <Trash2 className="w-5 h-5" />
 </div>

 <div className="text-center space-y-1">
 <h3 className="text-sm font-bold text-slate-900 ">
 Confirmar Exclusão
 </h3>
 <p className="text-xs text-slate-500 ">
 Tem certeza que deseja excluir o item{' '}
 <strong className="text-slate-800 ">{itemExcluindo.titulo}</strong>?
 </p>
 </div>

 <div className="flex items-center justify-center gap-2 pt-2">
 <button
 type="button"
 onClick={() => setItemExcluindo(null)}
 className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={
 itemExcluindo.tipo === 'gasto'
 ? confirmarExcluirGasto
 : itemExcluindo.tipo === 'doc'
 ? confirmarExcluirDoc
 : confirmarExcluirModelo
 }
 className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
 >
 Excluir Definitivamente
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ======================================================== */}
 {/* MODAL: CONFIRMAÇÃO DE RESTAURAÇÃO */}
 {/* ======================================================== */}
 {modalConfirmReset && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
 <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn transition-colors">
 <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
 <RotateCcw className="w-5 h-5" />
 </div>

 <div className="text-center space-y-1">
 <h3 className="text-sm font-bold text-slate-900 ">
 {modalConfirmReset === 'gastos' && 'Restaurar Tipos de Gastos Padrão?'}
 {modalConfirmReset === 'docs' && 'Restaurar Tipos de Documentos Padrão?'}
 {modalConfirmReset === 'modelos' && 'Restaurar Modelos de Despesa Padrão?'}
 {modalConfirmReset === 'fabrica' && 'Restaurar Padrão de Fábrica?'}
 </h3>
 <p className="text-xs text-slate-500 ">
 {modalConfirmReset === 'gastos' &&
 'Deseja restaurar os 6 Tipos de Gastos originais padrão da RDC (1 Alimentação a 6 Outros gastos)? Itens personalizados serão substituídos.'}
 {modalConfirmReset === 'docs' &&
 'Deseja restaurar os Tipos de Documentos originais (Rec: Recibo, Nf: Nota Fiscal, CF: Cupom Fiscal)?'}
 {modalConfirmReset === 'modelos' &&
 'Deseja restaurar os Modelos de Despesa originais (Viagem Técnica, Despesas Corporativas)?'}
 {modalConfirmReset === 'fabrica' &&
 'ATENÇÃO: Todas as empresas, documentos e configurações serão redefinidos para os valores de demonstração inicial.'}
 </p>
 </div>

 <div className="flex items-center justify-center gap-2 pt-2">
 <button
 type="button"
 onClick={() => setModalConfirmReset(null)}
 className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={() => {
 if (modalConfirmReset === 'gastos') executarRestaurarPadraoGastos();
 else if (modalConfirmReset === 'docs') executarRestaurarPadraoDocs();
 else if (modalConfirmReset === 'modelos') executarRestaurarPadraoModelos();
 else if (modalConfirmReset === 'fabrica') executarResetFabrica();
 }}
 className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
 >
 Confirmar Restauração
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
