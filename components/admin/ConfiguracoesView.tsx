'use client';

import React, { useState } from 'react';
import { SistemaConfig, TipoGastoConfig, TipoDocConfig } from '@/lib/types';
import { StorageService, DEFAULT_TIPOS_GASTO, DEFAULT_TIPOS_DOC } from '@/lib/storage';
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
} from 'lucide-react';

type TabConfig = 'geral' | 'tipos-gasto' | 'tipos-doc' | 'manutencao';

export function ConfiguracoesView() {
  const [activeTab, setActiveTab] = useState<TabConfig>('geral');
  const [config, setConfig] = useState<SistemaConfig>(() => StorageService.getConfig());
  const [tiposGasto, setTiposGasto] = useState<TipoGastoConfig[]>(() => StorageService.getTiposGasto());
  const [tiposDoc, setTiposDoc] = useState<TipoDocConfig[]>(() => StorageService.getTiposDoc());

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

  // --- Estados de Confirmação de Exclusão ---
  const [itemExcluindo, setItemExcluindo] = useState<{
    tipo: 'gasto' | 'doc';
    id: string;
    titulo: string;
  } | null>(null);

  const notificarSucesso = (msg: string) => {
    setSucesso(msg);
    setErro(null);
    setTimeout(() => setSucesso(null), 3500);
  };

  const handleSalvarGeral = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (config.proximo_recibo_num <= 0 || config.proximo_rdc_num <= 0) {
      setErro('Os números sequenciais devem ser maiores que zero.');
      return;
    }

    StorageService.saveConfig(config);
    notificarSucesso('Configurações gerais salvas com sucesso!');
  };

  // ==========================================
  // MANIPULAÇÃO DE TIPOS DE GASTO (RDC)
  // ==========================================
  const handleAbrirNovoGasto = () => {
    setGastoEditando(null);
    // Sugerir o próximo código numérico livre
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

    // Verificar unicidade de código
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

  const [modalConfirmReset, setModalConfirmReset] = useState<'gastos' | 'docs' | 'fabrica' | null>(null);

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
      setErroDoc('A sigla / código do Tipo de Documento é obrigatória (ex: Rec, Nf, CF).');
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

    // Verificar unicidade da sigla
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
    setModalConfirmReset(null);
    notificarSucesso('Todos os dados foram restaurados para o padrão original com sucesso!');
  };

  const handleExportJson = () => {
    const dados = {
      usuarios: StorageService.getUsuarios(),
      empresas: StorageService.getEmpresas(),
      documentos: StorageService.getDocumentos(),
      config: StorageService.getConfig(),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Configurações do Sistema
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle institucional, numeração sequencial e parametrização dos Tipos de Gasto e Documentos da RDC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
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
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          onClick={() => setActiveTab('manutencao')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'manutencao'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          {/* Bloco 1: Numeração Sequencial Automática */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>Controle de Numeração Automática Sequencial</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                O sistema controla a sequência numérica independente para Recibos e RDC com sufixo do ano corrente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número de RECIBO
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximo_recibo_num}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      proximo_recibo_num: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ex: RECIBO Nº {String(config.proximo_recibo_num).padStart(6, '0')}/{config.ano_corrente}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número de RDC
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.proximo_rdc_num}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      proximo_rdc_num: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ex: RDC Nº {String(config.proximo_rdc_num).padStart(6, '0')}/{config.ano_corrente}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ano do Exercício
                </label>
                <input
                  type="number"
                  value={config.ano_corrente}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ano_corrente: parseInt(e.target.value) || 2026,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sufixo aplicado aos documentos
                </p>
              </div>
            </div>
          </div>

          {/* Bloco 2: Cabeçalho do Documento e Cidade Padrão */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Dados do Cabeçalho e Emissão Padrão</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informações impressas no topo de cada folha de Recibo e RDC gerado.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Organização no Cabeçalho
                </label>
                <input
                  type="text"
                  value={config.nome_organizacao}
                  onChange={(e) =>
                    setConfig({ ...config, nome_organizacao: e.target.value })
                  }
                  placeholder="Ex: ABEAS - Associação Brasileira..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sigla da Organização
                </label>
                <input
                  type="text"
                  value={config.sigla_organizacao}
                  onChange={(e) =>
                    setConfig({ ...config, sigla_organizacao: e.target.value })
                  }
                  placeholder="Ex: ABEAS"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade / UF Padrão para Emissão
                </label>
                <input
                  type="text"
                  value={config.cidade_padrao}
                  onChange={(e) =>
                    setConfig({ ...config, cidade_padrao: e.target.value })
                  }
                  placeholder="Ex: Brasília/DF"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Utilizada para a data por extenso nos documentos
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem Institucional do Rodapé
                </label>
                <input
                  type="text"
                  value={config.mensagem_rodape}
                  onChange={(e) =>
                    setConfig({ ...config, mensagem_rodape: e.target.value })
                  }
                  placeholder="Ex: Documento emitido eletronicamente..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botão de Salvar Configurações Gerais */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Configurações Gerais</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ABA 2: TIPOS DE GASTO NA RDC (INCLUIR / EDITAR / EXCLUIR) */}
      {/* ======================================================== */}
      {activeTab === 'tipos-gasto' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <span>Tipos de Gasto na RDC (Natureza dos Gastos)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie as naturezas de despesas disponibilizadas na emissão da RDC e totalizadas no quadro resumo da folha oficial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestaurarPadraoGastos}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  title="Restaura os 6 tipos clássicos (1 Alimentação a 6 Outros gastos)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Padrões RDC</span>
                </button>

                <button
                  type="button"
                  onClick={handleAbrirNovoGasto}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Tipo de Gasto</span>
                </button>
              </div>
            </div>

            {/* Tabela de Tipos de Gasto */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5 w-24 text-center">Código</th>
                    <th className="px-3.5 py-2.5 font-semibold">Nome da Categoria / Natureza</th>
                    <th className="px-3.5 py-2.5 text-slate-500 hidden md:table-cell">Descrição / Finalidade</th>
                    <th className="px-3.5 py-2.5 w-28 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiposGasto.map((tg) => (
                    <tr key={tg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-900">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                          {tg.codigo}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {tg.nome}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 text-[11px] hidden md:table-cell">
                        {tg.descricao || <span className="text-slate-300 italic">Sem observações</span>}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarGasto(tg)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
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
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir Tipo de Gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tiposGasto.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Nenhum tipo de gasto cadastrado. Clique no botão acima para incluir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b>Dica de parametrização:</b> Todos os tipos de gastos cadastrados aqui aparecem instantaneamente no seletor de linhas da emissão de RDC e geram o somatório automático no <i>Quadro Resumo de Gastos</i> na folha de impressão.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: TIPOS DE DOC NA RDC (INCLUIR / EDITAR / EXCLUIR)  */}
      {/* ======================================================== */}
      {activeTab === 'tipos-doc' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                  <span>Tipos de Documento na RDC (Tipo Doc)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie os comprovantes fiscais e recibos aceitos na prestação de contas da RDC (Rec, Nf, CF, etc.).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestaurarPadraoDocs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  title="Restaura os tipos padrão (Rec, Nf, CF)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Padrões RDC</span>
                </button>

                <button
                  type="button"
                  onClick={handleAbrirNovoDoc}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Tipo de Doc</span>
                </button>
              </div>
            </div>

            {/* Tabela de Tipos de Doc */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5 w-28 text-center">Sigla / Código</th>
                    <th className="px-3.5 py-2.5 font-semibold">Nome Completo do Documento</th>
                    <th className="px-3.5 py-2.5 text-slate-500 hidden md:table-cell">Descrição / Exemplos</th>
                    <th className="px-3.5 py-2.5 w-28 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiposDoc.map((td) => (
                    <tr key={td.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-900">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs uppercase">
                          {td.codigo}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {td.nome}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 text-[11px] hidden md:table-cell">
                        {td.descricao || <span className="text-slate-300 italic">Sem observações</span>}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarDoc(td)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
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
                                titulo: `${td.codigo} (${td.nome})`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir Tipo de Doc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tiposDoc.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Nenhum tipo de documento cadastrado. Clique no botão acima para incluir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b>Legenda oficial no rodapé:</b> As siglas e nomes cadastrados são formatados automaticamente na coluna <i>Legenda</i> do quadro de conferência da RDC (ex: <i>{tiposDoc.map((d) => `${d.codigo}: ${d.nome}`).join(' | ')}</i>).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 4: MANUTENÇÃO & RESTAURAÇÃO */}
      {/* ======================================================== */}
      {activeTab === 'manutencao' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-700" />
                <span>Restauração e Manutenção dos Dados</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Opções para restaurar o estado original de fábrica ou efetuar cópia de segurança dos dados locais.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-red-900">
                    Restaurar Dados Iniciais de Demonstração
                  </h3>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Restaura as empresas oficiais, usuários padrão, tipos de gastos clássicos e zera documentos de teste.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Fábrica</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Backup Completo do Sistema (JSON)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Faça download de todo o banco de dados local com empresas, usuários, documentos emitidos e configurações.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Baixar Backup JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INCLUIR / EDITAR TIPO DE GASTO */}
      {/* ======================================================== */}
      {modalGastoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-300" />
                <h3 className="text-sm font-bold">
                  {gastoEditando ? 'Editar Tipo de Gasto' : 'Incluir Novo Tipo de Gasto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalGastoAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                    Código Numérico *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={gastoCodigo}
                    onChange={(e) => setGastoCodigo(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ex: 1, 2, 7...</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Natureza do Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    value={gastoNome}
                    onChange={(e) => setGastoNome(e.target.value)}
                    placeholder="Ex: Alimentação, Combustível, Correios"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Impresso na folha da RDC</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Finalidade das Despesas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={gastoDescricao}
                  onChange={(e) => setGastoDescricao(e.target.value)}
                  placeholder="Ex: Despesas com refeições, café da manhã, almoço e jantar corporativo..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
      {/* MODAL: INCLUIR / EDITAR TIPO DE DOC */}
      {/* ======================================================== */}
      {modalDocAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                <h3 className="text-sm font-bold">
                  {docEditando ? 'Editar Tipo de Documento' : 'Incluir Novo Tipo de Documento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDocAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                    placeholder="Ex: Rec, Nf, CF"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ex: Rec, Nf, CF</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNome}
                    onChange={(e) => setDocNome(e.target.value)}
                    placeholder="Ex: Recibo, Nota Fiscal, Cupom"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Impresso na legenda oficial</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={docDescricao}
                  onChange={(e) => setDocDescricao(e.target.value)}
                  placeholder="Ex: Nota fiscal eletrônica (NFe, NFCe ou NFSe modelo 55/65)..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ======================================================== */}
      {itemExcluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Confirmar Exclusão
              </h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir o item{' '}
                <strong className="text-slate-800">{itemExcluindo.titulo}</strong>?
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
                onClick={itemExcluindo.tipo === 'gasto' ? confirmarExcluirGasto : confirmarExcluirDoc}
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {modalConfirmReset === 'gastos' && 'Restaurar Tipos de Gastos Padrão?'}
                {modalConfirmReset === 'docs' && 'Restaurar Tipos de Documentos Padrão?'}
                {modalConfirmReset === 'fabrica' && 'Restaurar Padrão de Fábrica?'}
              </h3>
              <p className="text-xs text-slate-500">
                {modalConfirmReset === 'gastos' &&
                  'Deseja restaurar os 6 Tipos de Gastos originais padrão da RDC (1 Alimentação a 6 Outros gastos)? Itens personalizados serão substituídos.'}
                {modalConfirmReset === 'docs' &&
                  'Deseja restaurar os Tipos de Documentos originais (Rec: Recibo, Nf: Nota Fiscal, CF: Cupom Fiscal)?'}
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
