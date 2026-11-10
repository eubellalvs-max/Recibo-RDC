'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Usuario, Documento, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr } from '@/lib/masks';
import {
  ItemRelatorioAnalitico,
  ResumoFinanceiro,
  calcularResumoFinanceiro,
  mapearDocumentosParaItensAnaliticos,
  exportarRelatorioExcel,
} from '@/lib/financeiro';
import { usePrint } from '@/lib/printContext';
import { UnifiedRelatorioFinanceiroPrint } from './UnifiedRelatorioFinanceiroPrint';
import { UnifiedPrintToolbar } from '../documents/unified/UnifiedPrintToolbar';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Receipt,
  AlertTriangle,
  Building2,
  User,
  ArrowUpDown,
  Share2,
} from 'lucide-react';

interface RelatorioFinanceiroViewProps {
  currentUser: Usuario;
  onVisualizarDocumento?: (doc: Documento) => void;
  onNovoReciboMedico?: () => void;
}

export function RelatorioFinanceiroView({
  currentUser,
  onVisualizarDocumento,
  onNovoReciboMedico,
}: RelatorioFinanceiroViewProps) {
  const isAdmin = currentUser.perfil === 'admin';
  const { setActivePrintItem } = usePrint();

  // Dados do storage
  const [documentos, setDocumentos] = useState<Documento[]>(() =>
    StorageService.getDocumentos().filter((d) => d.tipo === 'recibo_medico')
  );
  const empresas = useMemo(() => StorageService.getEmpresas(), []);
  const usuarios = useMemo(() => StorageService.getUsuarios(), []);

  // Map de nomes de empresas
  const empresaMap = useMemo(() => {
    const map: Record<string, string> = {};
    empresas.forEach((e) => {
      map[e.id] = e.nome_fantasia || e.razao_social;
    });
    return map;
  }, [empresas]);

  // Lista de emissores cadastrados
  const emissoresList = useMemo(() => {
    return usuarios.filter((u) => u.perfil === 'emissor' || u.perfil === 'admin');
  }, [usuarios]);

  // Estados de Filtros
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}-01`;
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState<string>('TODAS');
  const [busca, setBusca] = useState<string>('');
  const [emissorFiltro, setEmissorFiltro] = useState<string>(isAdmin ? 'TODOS' : currentUser.id);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('TODAS');
  const [incluirCancelados, setIncluirCancelados] = useState<boolean>(false);
  const [orientacao, setOrientacao] = useState<'retrato' | 'paisagem'>('retrato');
  const [modalPreviaAberto, setModalPreviaAberto] = useState(false);

  const recarregar = () => {
    setDocumentos(StorageService.getDocumentos().filter((d) => d.tipo === 'recibo_medico'));
  };

  useEffect(() => {
    const handleSync = () => recarregar();
    window.addEventListener('storage_sync_updated', handleSync);
    return () => window.removeEventListener('storage_sync_updated', handleSync);
  }, []);

  const aplicarAtalhoData = (tipo: 'hoje' | 'ontem' | '7dias' | 'mes' | 'todos') => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);

    if (tipo === 'hoje') {
      setDataInicio(hojeStr);
      setDataFim(hojeStr);
    } else if (tipo === 'ontem') {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().slice(0, 10);
      setDataInicio(ontemStr);
      setDataFim(ontemStr);
    } else if (tipo === '7dias') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setDataInicio(d7.toISOString().slice(0, 10));
      setDataFim(hojeStr);
    } else if (tipo === 'mes') {
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      setDataInicio(`${ano}-${mes}-01`);
      setDataFim(hojeStr);
    } else if (tipo === 'todos') {
      setDataInicio('');
      setDataFim('');
    }
  };

  const limparFiltros = () => {
    aplicarAtalhoData('mes');
    setFormaPagamentoFiltro('TODAS');
    setBusca('');
    setEmissorFiltro(isAdmin ? 'TODOS' : currentUser.id);
    setEmpresaFiltro('TODAS');
    setIncluirCancelados(false);
  };

  const todosItensAnaliticos = useMemo(() => {
    return mapearDocumentosParaItensAnaliticos(documentos, empresaMap);
  }, [documentos, empresaMap]);

  const itensFiltrados = useMemo(() => {
    return todosItensAnaliticos.filter((item) => {
      // Regra de Permissão da Área do Emissor vs Admin:
      if (!isAdmin && item.emissorId !== currentUser.id) {
        return false;
      }

      // Filtro de Emissor (para Admin)
      if (isAdmin && emissorFiltro !== 'TODOS' && item.emissorId !== emissorFiltro) {
        return false;
      }

      // Filtro de Empresa
      if (empresaFiltro !== 'TODOS' && item.empresaEmissoraId !== empresaFiltro) {
        return false;
      }

      // Filtro de Status
      if (!incluirCancelados && item.status === 'cancelado') {
        return false;
      }

      // Filtro de Período (Data Início e Data Fim)
      if (dataInicio && item.dataEmissao < dataInicio) {
        return false;
      }
      if (dataFim && item.dataEmissao > dataFim) {
        return false;
      }

      // Filtro de Forma de Pagamento
      if (formaPagamentoFiltro !== 'TODAS') {
        const possuiModalidade = item.modalidades.some(
          (m) => m.categoria === formaPagamentoFiltro
        );
        if (!possuiModalidade) {
          return false;
        }
      }

      // Filtro de Busca Textual
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const numMatch = item.numero.toLowerCase().includes(q);
        const pacienteMatch = item.pacienteNome.toLowerCase().includes(q);
        const pacienteCpfMatch = item.pacienteCpf.toLowerCase().includes(q);
        const pagadorMatch = item.pagadorNome.toLowerCase().includes(q);
        const pagadorDocMatch = item.pagadorDocumento.toLowerCase().includes(q);
        const servicoMatch = item.servicoPrestado.toLowerCase().includes(q);
        const emissorMatch = item.emissorNome.toLowerCase().includes(q);

        if (
          !numMatch &&
          !pacienteMatch &&
          !pacienteCpfMatch &&
          !pagadorMatch &&
          !pagadorDocMatch &&
          !servicoMatch &&
          !emissorMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    todosItensAnaliticos,
    isAdmin,
    currentUser.id,
    emissorFiltro,
    empresaFiltro,
    incluirCancelados,
    dataInicio,
    dataFim,
    formaPagamentoFiltro,
    busca,
  ]);

  const resumo = useMemo(() => {
    return calcularResumoFinanceiro(itensFiltrados);
  }, [itensFiltrados]);

  const periodoFormatado = useMemo(() => {
    if (dataInicio && dataFim) {
      if (dataInicio === dataFim) {
        return formatarDataBr(dataInicio);
      }
      return `${formatarDataBr(dataInicio)} até ${formatarDataBr(dataFim)}`;
    }
    if (dataInicio) {
      return `A partir de ${formatarDataBr(dataInicio)}`;
    }
    if (dataFim) {
      return `Até ${formatarDataBr(dataFim)}`;
    }
    return 'Geral (Todos os Períodos)';
  }, [dataInicio, dataFim]);

  const nomeEmpresaRelatorio = useMemo(() => {
    if (empresaFiltro !== 'TODOS' && empresaMap[empresaFiltro]) {
      return empresaMap[empresaFiltro];
    }
    return 'ABEAS - Associação Brasileira de Entidades de Assistência Social';
  }, [empresaFiltro, empresaMap]);

  const dataHoraGeracaoFormatada = useMemo(() => {
    const agora = new Date();
    return `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  const handleExportarExcel = () => {
    exportarRelatorioExcel({
      empresaNome: nomeEmpresaRelatorio,
      periodoFormatado,
      dataGeracaoFormatada: dataHoraGeracaoFormatada,
      resumo,
      itens: itensFiltrados,
    });
  };

  const dadosRelatorio = useMemo(() => ({
    empresaNome: nomeEmpresaRelatorio,
    periodoFormatado,
    dataGeracaoFormatada: dataHoraGeracaoFormatada,
    usuarioGeradorNome: currentUser.nome,
    resumo,
    itens: itensFiltrados,
    orientacao,
  }), [nomeEmpresaRelatorio, periodoFormatado, dataHoraGeracaoFormatada, currentUser.nome, resumo, itensFiltrados, orientacao]);

  useEffect(() => {
    if (!modalPreviaAberto) return;
    setActivePrintItem({
      tipo: 'relatorio_financeiro',
      numero: 'REL-MED-FIN',
      dadosRelatorioFinanceiro: dadosRelatorio,
    });
    return () => {
      setActivePrintItem(null);
    };
  }, [modalPreviaAberto, dadosRelatorio, setActivePrintItem]);

  const handleImprimirRelatorio = () => {
    setActivePrintItem({
      tipo: 'relatorio_financeiro',
      numero: 'REL-MED-FIN',
      dadosRelatorioFinanceiro: dadosRelatorio,
    });

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleAbrirDocumento = (docId: string) => {
    if (!onVisualizarDocumento) return;
    const doc = documentos.find((d) => d.id === docId);
    if (doc) {
      onVisualizarDocumento(doc);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. TOPO: Título, Contexto e Botões de Ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                RELATÓRIO FINANCEIRO • RECIBOS MÉDICOS
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isAdmin ? 'Visão Consolidada Admin' : 'Área do Emissor'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conferência diária, prestação de contas e conciliação por forma de pagamento
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Orientação para Impressão */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setOrientacao('retrato')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                orientacao === 'retrato'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Configurar impressão em formato A4 Retrato (Vertical)"
            >
              📄 Retrato
            </button>
            <button
              type="button"
              onClick={() => setOrientacao('paisagem')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                orientacao === 'paisagem'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Configurar impressão em formato A4 Paisagem (Horizontal)"
            >
              📑 Paisagem
            </button>
          </div>

          {/* Botão Pré-visualizar Impressão */}
          <button
            type="button"
            onClick={() => setModalPreviaAberto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            title="Conferir a prévia exata do relatório antes de imprimir"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Pré-visualizar</span>
          </button>

          {/* Botão Exportar Excel */}
          <button
            type="button"
            onClick={handleExportarExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            title="Exportar planilha analítica e resumo para arquivo Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          {/* Botão Imprimir / PDF */}
          <button
            type="button"
            onClick={handleImprimirRelatorio}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
            title="Imprimir relatório oficial timbrado ou Salvar em PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* 2. ÁREA DE FILTROS E CONSULTAS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filtros e Parâmetros de Consulta</span>
          </div>

          {/* Atalhos Rápidos de Período */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Atalhos:</span>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('hoje')}
              className="text-[11px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('ontem')}
              className="text-[11px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('7dias')}
              className="text-[11px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('mes')}
              className="text-[11px] px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('todos')}
              className="text-[11px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Período: Data Inicial */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>

          {/* Período: Data Final */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={formaPagamentoFiltro}
              onChange={(e) => setFormaPagamentoFiltro(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-medium"
            >
              <option value="TODAS">Todas as formas de pagamento</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="OUTRAS">Outras formas / Transferência</option>
            </select>
          </div>

          {/* Emissor Responsável */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Emissor Responsável
            </label>
            {isAdmin ? (
              <select
                value={emissorFiltro}
                onChange={(e) => setEmissorFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-medium"
              >
                <option value="TODOS">Todos os emissores da empresa</option>
                {emissoresList.map((em) => (
                  <option key={em.id} value={em.id}>
                    {em.nome} ({em.perfil})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium truncate">
                {currentUser.nome} (Você)
              </div>
            )}
          </div>

          {/* Empresa / Filial */}
          {isAdmin ? (
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Empresa / Filial
              </label>
              <select
                value={empresaFiltro}
                onChange={(e) => setEmpresaFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-medium"
              >
                <option value="TODAS">Todas as empresas</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia || emp.razao_social}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Status
              </label>
              <label className="flex items-center gap-2 mt-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirCancelados}
                  onChange={(e) => setIncluirCancelados(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Exibir cancelados</span>
              </label>
            </div>
          )}
        </div>

        {/* Linha Inferior de Busca Textual */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-8 lg:col-span-9">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por Paciente, Pagador, CPF/CNPJ, Serviço Prestado ou Nº do Recibo..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-4 lg:col-span-3 flex items-center justify-between sm:justify-end gap-3">
            {isAdmin && (
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={incluirCancelados}
                  onChange={(e) => setIncluirCancelados(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Ver cancelados</span>
              </label>
            )}

            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* 3. RESUMO FINANCEIRO (CARDS / INDICADORES POR MODALIDADE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>1. Resumo Financeiro da Movimentação ({periodoFormatado})</span>
          </div>
          {resumo.quantidadeCancelados > 0 && (
            <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {resumo.quantidadeCancelados} recibo(s) cancelado(s) desconsiderado(s) dos valores
              </span>
            </div>
          )}
        </div>

        {/* Grid de Cards de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card: PIX */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                PIX
              </span>
              <Smartphone className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(resumo.totalPix)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {resumo.valorTotalGeral > 0
                ? `${((resumo.totalPix / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                : '0%'}
            </div>
          </div>

          {/* Card: Dinheiro */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Dinheiro
              </span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(resumo.totalDinheiro)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {resumo.valorTotalGeral > 0
                ? `${((resumo.totalDinheiro / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                : '0%'}
            </div>
          </div>

          {/* Card: Cartão de Crédito */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Cartão de Crédito
              </span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(resumo.totalCartaoCredito)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {resumo.valorTotalGeral > 0
                ? `${((resumo.totalCartaoCredito / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                : '0%'}
            </div>
          </div>

          {/* Card: Cartão de Débito */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Cartão de Débito
              </span>
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(resumo.totalCartaoDebito)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {resumo.valorTotalGeral > 0
                ? `${((resumo.totalCartaoDebito / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                : '0%'}
            </div>
          </div>

          {/* Card: Outras Formas */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Outras Formas
              </span>
              <Wallet className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(resumo.totalOutras)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {resumo.valorTotalGeral > 0
                ? `${((resumo.totalOutras / resumo.valorTotalGeral) * 100).toFixed(1)}% do total`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Card Destaque: Total Geral & Indicadores Operacionais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-950 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Total Geral da Movimentação</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-400 mt-2 tabular-nums">
              {formatarMoeda(resumo.valorTotalGeral)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Soma total de todos os recibos válidos do período
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Quantidade de Recibos</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 tabular-nums">
              {resumo.quantidadeEmitidos}{' '}
              <span className="text-xs font-normal text-slate-500">recibos válidos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {resumo.quantidadeCancelados > 0
                ? `+ ${resumo.quantidadeCancelados} cancelados (sem valor financeiro)`
                : 'Nenhum cancelamento no período'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Valor Médio por Recibo</span>
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-blue-700 mt-2 tabular-nums">
              {formatarMoeda(resumo.valorMedioPorRecibo)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Ticket médio por atendimento realizado
            </div>
          </div>
        </div>
      </div>

      {/* 4. RELATÓRIO ANALÍTICO – FORMATO DE PLANILHA */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>2. Relatório Analítico de Recibos Médicos (Planilha Detalhada)</span>
          </div>
          <span className="text-xs text-slate-500">
            Exibindo <b>{itensFiltrados.length}</b> recibo(s)
          </span>
        </div>

        {/* Tabela Planilha */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3.5 py-3 w-28">1. Nº Recibo</th>
                  <th className="px-3.5 py-3">2. Paciente / Pagador</th>
                  <th className="px-3.5 py-3">3. Forma de Pagamento</th>
                  <th className="px-3.5 py-3 w-28">4. Data Emissão</th>
                  <th className="px-3.5 py-3 text-right w-32">5. Valor (R$)</th>
                  <th className="px-3.5 py-3">6. Emissor Responsável</th>
                  <th className="px-3.5 py-3 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      Nenhum recibo médico encontrado para os critérios e filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item) => {
                    const isCancelado = item.status === 'cancelado';
                    return (
                      <tr
                        key={item.documentoId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelado ? 'bg-red-50/30 opacity-60' : ''
                        }`}
                      >
                        {/* 1. Número do Recibo */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleAbrirDocumento(item.documentoId)}
                            className="font-mono font-bold text-slate-900 hover:text-emerald-700 hover:underline"
                            title="Clique para visualizar o recibo"
                          >
                            {item.numero}
                          </button>
                          {isCancelado && (
                            <span className="block text-[9px] text-red-600 font-bold uppercase">
                              [Cancelado]
                            </span>
                          )}
                        </td>

                        {/* 2. Paciente / Pagador */}
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-900">
                            {item.pacienteNome}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            CPF: {item.pacienteCpf || 'Não informado'}
                          </div>
                          {item.pagadorNome && item.pagadorNome !== item.pacienteNome && (
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              <span className="font-medium">Pagador:</span> {item.pagadorNome}{' '}
                              <span className="font-mono">({item.pagadorDocumento})</span>
                            </div>
                          )}
                        </td>

                        {/* 3. Forma de Pagamento */}
                        <td className="px-3.5 py-2.5">
                          {item.modalidades && item.modalidades.length > 1 ? (
                            <div className="space-y-1">
                              {item.modalidades.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 mr-1.5 mb-1"
                                >
                                  <span className="font-bold">{m.nomeExibicao}:</span>
                                  <span className="tabular-nums font-semibold text-emerald-700">
                                    {formatarMoeda(m.valor)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                              {item.formaPagamentoOriginal || 'Pix'}
                            </span>
                          )}
                        </td>

                        {/* 4. Data de Emissão */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 font-medium">
                          {formatarDataBr(item.dataEmissao)}
                        </td>

                        {/* 5. Valor do Recibo */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-bold tabular-nums text-sm ${
                              isCancelado
                                ? 'text-red-500 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {formatarMoeda(item.valorTotal)}
                          </span>
                        </td>

                        {/* 6. Emissor Responsável */}
                        <td className="px-3.5 py-2.5">
                          <div className="font-medium text-slate-800 truncate max-w-[160px]">
                            {item.emissorNome}
                          </div>
                          {isAdmin && item.empresaNome && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {item.empresaNome}
                            </div>
                          )}
                        </td>

                        {/* Ações Rápidas */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleAbrirDocumento(item.documentoId)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Visualizar Recibo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Rodapé da Tabela: Linha de SOMA TOTAL */}
              <tfoot className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-950">
                <tr>
                  <td colSpan={4} className="px-3.5 py-3 text-right uppercase tracking-wider">
                    Soma Total das Movimentações Listadas:
                  </td>
                  <td className="px-3.5 py-3 text-right text-emerald-300 font-black text-sm tabular-nums whitespace-nowrap">
                    {formatarMoeda(resumo.valorTotalGeral)}
                  </td>
                  <td colSpan={2} className="px-3.5 py-3 text-[11px] text-slate-400 font-normal">
                    {resumo.quantidadeEmitidos} recibos válidos somados
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Pré-Visualização Fiel do Relatório */}
      {modalPreviaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
          <div className={`bg-white border border-slate-200 rounded-xl shadow-2xl ${
            orientacao === 'paisagem' ? 'max-w-6xl' : 'max-w-4xl'
          } w-full my-4 flex flex-col max-h-[94vh] transition-colors print-modal-content`}>
            <div className="no-print">
              <UnifiedPrintToolbar
                titulo="PRÉ-VISUALIZAÇÃO • RELATÓRIO FINANCEIRO"
                subtitulo={`${nomeEmpresaRelatorio} • Período: ${periodoFormatado} • Modo: ${
                  orientacao === 'paisagem' ? 'Paisagem (Horizontal)' : 'Retrato (Vertical)'
                }`}
                isPreVisualizacao={false}
                onFechar={() => setModalPreviaAberto(false)}
                documentoNumero="REL-MED-FIN"
                tipoDocumento="relatorio_financeiro"
              />
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Formato da Folha A4:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setOrientacao('retrato')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      orientacao === 'retrato' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📄 Retrato (Vertical)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientacao('paisagem')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      orientacao === 'paisagem' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📑 Paisagem (Horizontal)
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex justify-center">
              <div className="bg-white shadow border border-slate-300 p-4 w-full flex justify-center">
                <UnifiedRelatorioFinanceiroPrint dados={dadosRelatorio} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
