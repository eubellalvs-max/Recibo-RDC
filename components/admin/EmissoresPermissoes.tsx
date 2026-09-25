'use client';

import React, { useState } from 'react';
import { Usuario, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj } from '@/lib/masks';
import { Shield, Check, Save, UserCheck, AlertCircle } from 'lucide-react';

export function EmissoresPermissoes() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
    StorageService.getUsuarios().filter((u) => u.perfil === 'emissor')
  );
  const empresasEmissoras = StorageService.getEmpresas().filter(
    (e) => e.tipo === 'emissora' || e.tipo === 'ambas'
  );

  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<string>(
    usuarios[0]?.id || ''
  );
  const [empresasPermitidas, setEmpresasPermitidas] = useState<string[]>(() => {
    const u = usuarios.find((item) => item.id === usuarios[0]?.id);
    return u?.empresas_permitidas || [];
  });
  const [todasLiberadas, setTodasLiberadas] = useState<boolean>(() => {
    const u = usuarios.find((item) => item.id === usuarios[0]?.id);
    return !u?.empresas_permitidas || u.empresas_permitidas.length === 0;
  });

  const [sucesso, setSucesso] = useState(false);

  const handleSelectUsuario = (id: string) => {
    setUsuarioSelecionadoId(id);
    setSucesso(false);
    const u = usuarios.find((item) => item.id === id);
    if (u) {
      if (!u.empresas_permitidas || u.empresas_permitidas.length === 0) {
        setTodasLiberadas(true);
        setEmpresasPermitidas([]);
      } else {
        setTodasLiberadas(false);
        setEmpresasPermitidas(u.empresas_permitidas);
      }
    }
  };

  const handleToggleEmpresa = (empresaId: string) => {
    setSucesso(false);
    if (todasLiberadas) {
      // Se estava em "todas liberadas", inicia desmarcando apenas a clicada
      const todas = empresasEmissoras.map((e) => e.id).filter((id) => id !== empresaId);
      setTodasLiberadas(false);
      setEmpresasPermitidas(todas);
      return;
    }

    if (empresasPermitidas.includes(empresaId)) {
      setEmpresasPermitidas(empresasPermitidas.filter((id) => id !== empresaId));
    } else {
      setEmpresasPermitidas([...empresasPermitidas, empresaId]);
    }
  };

  const handleSalvar = () => {
    const u = usuarios.find((item) => item.id === usuarioSelecionadoId);
    if (!u) return;

    const listaFinal = todasLiberadas ? [] : empresasPermitidas;
    const atualizado = StorageService.saveUsuario({
      ...u,
      empresas_permitidas: listaFinal,
    });

    setUsuarios(StorageService.getUsuarios().filter((user) => user.perfil === 'emissor'));
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const usuarioAtual = usuarios.find((u) => u.id === usuarioSelecionadoId);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Permissões de Emissores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Defina quais empresas cadastradas cada emissor tem permissão para emitir recibos e RDCs
          </p>
        </div>

        <button
          onClick={handleSalvar}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar Permissões</span>
        </button>
      </div>

      {sucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Permissões atualizadas com sucesso para o emissor <b>{usuarioAtual?.nome}</b>!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Emissores */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            1. Selecione o Emissor
          </h3>
          <div className="space-y-1.5">
            {usuarios.length === 0 ? (
              <div className="text-xs text-slate-500 p-4">
                Nenhum usuário com perfil de emissor cadastrado.
              </div>
            ) : (
              usuarios.map((usr) => {
                const isSelected = usr.id === usuarioSelecionadoId;
                return (
                  <button
                    key={usr.id}
                    onClick={() => handleSelectUsuario(usr.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{usr.nome}</div>
                      <div className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        login: {usr.login}
                      </div>
                    </div>
                    <UserCheck className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2 e 3: Empresas Permitidas */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Empresas Permitidas para {usuarioAtual?.nome || 'o Emissor'}
              </h3>
              <p className="text-xs text-slate-500">
                Ao preencher um novo Recibo ou RDC, somente estas empresas emissoras estarão disponíveis no seletor.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={todasLiberadas}
                onChange={(e) => {
                  setTodasLiberadas(e.target.checked);
                  if (e.target.checked) {
                    setEmpresasPermitidas([]);
                  }
                }}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span>Acesso a todas as empresas emissoras</span>
            </label>
          </div>

          {/* Lista de Empresas Emissoras */}
          <div className="space-y-2">
            {empresasEmissoras.map((emp) => {
              const isChecked = todasLiberadas || empresasPermitidas.includes(emp.id);

              return (
                <div
                  key={emp.id}
                  onClick={() => !todasLiberadas && handleToggleEmpresa(emp.id)}
                  className={`p-3 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    todasLiberadas
                      ? 'bg-slate-50 border-slate-200 cursor-default opacity-85'
                      : isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 cursor-pointer'
                      : 'bg-white hover:bg-slate-50 border-slate-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={todasLiberadas}
                      checked={isChecked}
                      onChange={() => handleToggleEmpresa(emp.id)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">
                        {emp.razao_social}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        CNPJ: {mascaraCnpj(emp.cnpj)} · {emp.cidade}/{emp.uf}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      isChecked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isChecked ? 'Permitida' : 'Bloqueada'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSalvar}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
