'use client';

import React, { useState } from 'react';
import { Usuario, Empresa, Documento } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj, formatarMoeda, dataHojeIso } from '@/lib/masks';
import { valorPorExtenso } from '@/lib/extenso';
import { X, Check, AlertCircle, Upload, Eye } from 'lucide-react';
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

  if (!isOpen) return null;

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
    <div className={`fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto ${
      modoPreVisualizar ? 'print-modal-overlay' : 'no-print'
    }`}>
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden transition-colors print-modal-content ${
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
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                🧾
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">NOVO RECIBO</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Emissão com numeração sequencial e extenso automático</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Conteúdo: Pré-Visualização ou Formulário */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {erro && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {modoPreVisualizar ? (
            <div className="print-document bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-xl flex justify-center print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa Emissora (Quem recebe) *
                  </label>
                  <select
                    value={empresaEmissoraId}
                    onChange={(e) => handleEmissoraChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                  >
                    <option value="">Selecione uma empresa emissora...</option>
                    {emissorasDisponiveis.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome_fantasia || emp.razao_social} ({mascaraCnpj(emp.cnpj)})
                      </option>
                    ))}
                  </select>
                  {empresaEmissoraObj && (
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      CNPJ: {mascaraCnpj(empresaEmissoraObj.cnpj)} · {empresaEmissoraObj.cidade}/{empresaEmissoraObj.uf}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    RECEBEMOS DE: (Empresa Destinatária / Quem paga) *
                  </label>
                  <select
                    value={empresaDestinatariaId}
                    onChange={(e) => setEmpresaDestinatariaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                  >
                    <option value="">Selecione uma empresa destinatária...</option>
                    {destinatariasDisponiveis.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome_fantasia || emp.razao_social} ({mascaraCnpj(emp.cnpj)})
                      </option>
                    ))}
                  </select>
                  {empresaDestinatariaObj && (
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      CNPJ: {mascaraCnpj(empresaDestinatariaObj.cnpj)} · {empresaDestinatariaObj.cidade}/{empresaDestinatariaObj.uf}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Logo da Empresa */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Logotipo da Empresa Emissora <span className="font-normal text-slate-400 dark:text-slate-500">(opcional para este recibo)</span>
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remover Logo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
                    className="flex-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none"
                  />

                  {logoUrl ? (
                    <div className="w-14 h-8 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded flex items-center justify-center p-1 shrink-0">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      Sem logo
                    </div>
                  )}
                </div>
              </div>

              {/* Grid: Valor Numérico e Extenso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      value={valorRaw}
                      onChange={handleValorChange}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor por Extenso <span className="font-normal text-slate-400 dark:text-slate-500">(gerado automaticamente)</span>
                  </label>
                  <div className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium italic min-h-[38px] flex items-center">
                    {valorExtenso}
                  </div>
                </div>
              </div>

              {/* Referente a */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Referente a (Descrição detalhada) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={referente}
                  onChange={(e) => setReferente(e.target.value)}
                  placeholder="Ex: Serviços de consultoria em gestão contábil e tributária referente ao mês de Setembro/2026..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                />
              </div>

              {/* Grid: Data de Emissão e Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Emissão *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade / UF do Documento
                  </label>
                  <input
                    type="text"
                    value={cidadeEmissao}
                    onChange={(e) => setCidadeEmissao(e.target.value)}
                    placeholder="Ex: Brasília/DF"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Pagamento efetuado via PIX / Cheque nº... Quitação condicionada à compensação bancária."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:border-slate-800 dark:focus:border-slate-600 outline-none"
                />
              </div>

              {/* Footer com Botões */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>PRÉ-VISUALIZAR RECIBO</span>
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
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
