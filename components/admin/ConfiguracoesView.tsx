'use client';

import React, { useState } from 'react';
import { SistemaConfig } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { Settings, Save, RotateCcw, Download, Check, AlertCircle } from 'lucide-react';

export function ConfiguracoesView() {
  const [config, setConfig] = useState<SistemaConfig>(() => StorageService.getConfig());
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (config.proximo_recibo_num <= 0 || config.proximo_rdc_num <= 0) {
      setErro('Os números sequenciais devem ser maiores que zero.');
      return;
    }

    StorageService.saveConfig(config);
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja restaurar os dados originais de demonstração do sistema? Todas as empresas, documentos e usuários serão restaurados para o padrão de demonstração.'
      )
    ) {
      StorageService.resetToDefault();
      setConfig(StorageService.getConfig());
      alert('Dados restaurados com sucesso para o padrão de demonstração!');
      window.location.reload();
    }
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
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de numeração automática sequencial, dados do cabeçalho institucional e manutenção
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

      {sucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Bloco 1: Numeração Sequencial Automática */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Controle de Numeração Automática (Seção 9)
            </h2>
            <p className="text-xs text-slate-500">
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
            <h2 className="text-sm font-bold text-slate-900">
              Dados do Cabeçalho e Emissão Padrão
            </h2>
            <p className="text-xs text-slate-500">
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

        {/* Botão de Salvar Configurações */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Iniciais de Demonstração</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
}
