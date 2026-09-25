'use client';

import React, { useState, useEffect } from 'react';
import { Empresa, Usuario, Documento } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { valorPorExtenso } from '@/lib/extenso';
import { formatarMoeda, dataHojeIso, mascaraCnpj } from '@/lib/masks';
import { X, FileText, Check, AlertCircle, Building2 } from 'lucide-react';

interface NovoReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onSuccess: (documento: Documento) => void;
}

export function NovoReciboModal({
  isOpen,
  onClose,
  currentUser,
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

  // Atualização em tempo real do valor por extenso
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValorRaw(raw);

    // Converte para número
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!empresaEmissoraId) {
      setErro('Selecione a empresa emissora.');
      return;
    }

    if (!empresaDestinatariaId) {
      setErro('Selecione a empresa destinatária.');
      return;
    }

    if (empresaEmissoraId === empresaDestinatariaId) {
      setErro('A empresa emissora e destinatária não podem ser a mesma.');
      return;
    }

    if (valorNumerico <= 0) {
      setErro('Informe um valor monetário válido maior que zero.');
      return;
    }

    if (!referente.trim()) {
      setErro('Informe a descrição do que se refere o pagamento.');
      return;
    }

    try {
      const doc = StorageService.emitirDocumento({
        tipo: 'recibo',
        empresa_emissora_id: empresaEmissoraId,
        empresa_destinataria_id: empresaDestinatariaId,
        valor: valorNumerico,
        referente: referente.trim(),
        data_emissao: dataEmissao,
        cidade_emissao: cidadeEmissao.trim(),
        observacoes: observacoes.trim() || undefined,
        usuario: currentUser,
      });

      onSuccess(doc);
    } catch (err) {
      setErro('Ocorreu um erro ao emitir o recibo. Tente novamente.');
    }
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              🧾
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">NOVO RECIBO</h2>
              <p className="text-xs text-slate-500">Emissão com numeração sequencial e extenso automático</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Grid: Empresa Emissora e Destinatária */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Empresa Emissora (Quem recebe) *
              </label>
              <select
                value={empresaEmissoraId}
                onChange={(e) => setEmpresaEmissoraId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              >
                <option value="">Selecione uma empresa emissora...</option>
                {emissorasDisponiveis.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia || emp.razao_social} ({mascaraCnpj(emp.cnpj)})
                  </option>
                ))}
              </select>
              {empresaEmissoraObj && (
                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  CNPJ: {mascaraCnpj(empresaEmissoraObj.cnpj)} · {empresaEmissoraObj.cidade}/{empresaEmissoraObj.uf}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Empresa Destinatária (Quem paga) *
              </label>
              <select
                value={empresaDestinatariaId}
                onChange={(e) => setEmpresaDestinatariaId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              >
                <option value="">Selecione uma empresa destinatária...</option>
                {destinatariasDisponiveis.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia || emp.razao_social} ({mascaraCnpj(emp.cnpj)})
                  </option>
                ))}
              </select>
              {empresaDestinatariaObj && (
                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  CNPJ: {mascaraCnpj(empresaDestinatariaObj.cnpj)} · {empresaDestinatariaObj.cidade}/{empresaDestinatariaObj.uf}
                </div>
              )}
            </div>
          </div>

          {/* Campo de Valor com Extenso Automático */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-slate-500">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorRaw}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:border-slate-800 outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor por Extenso <span className="font-normal text-slate-400">(automático)</span>
                </label>
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 min-h-[38px] flex items-center italic">
                  {valorExtenso || 'Zero reais'}
                </div>
              </div>
            </div>
          </div>

          {/* Referente a */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referente a *
            </label>
            <textarea
              rows={2}
              value={referente}
              onChange={(e) => setReferente(e.target.value)}
              placeholder="Ex: Prestação de serviços de consultoria contábil e suporte técnico no mês..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>

          {/* Grid: Data de Emissão e Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Emissão *
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade / UF do Documento
              </label>
              <input
                type="text"
                value={cidadeEmissao}
                onChange={(e) => setCidadeEmissao(e.target.value)}
                placeholder="Ex: Brasília/DF"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pagamento efetuado via PIX / Cheque nº... Quitação condicionada à compensação bancária."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            />
          </div>

          {/* Footer com Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>EMITIR RECIBO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
