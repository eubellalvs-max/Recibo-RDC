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
    StorageService.saveUsuario({
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
            Controle de quais empresas cada emissor tem permissão para emitir documentos
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Permissões atualizadas com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Emissores */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Selecione o Emissor
            </h2>
          </div>

          <div className="space-y-1">
            {usuarios.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Nenhum emissor cadastrado.</p>
            ) : (
              usuarios.map((u) => {
                const isSelected = u.id === usuarioSelecionadoId;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUsuario(u.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <div>{u.nome}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {u.login}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2 e 3: Empresas Autorizadas */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Empresas Autorizadas para Emissão
              </h2>
              {usuarioAtual && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina as empresas para as quais <b>{usuarioAtual.nome}</b> pode emitir documentos.
                </p>
              )}
            </div>

            <button
              onClick={handleSalvar}
              disabled={!usuarioAtual}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Permissões</span>
            </button>
          </div>

          {/* Opção Todas Liberadas */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={todasLiberadas}
                onChange={(e) => {
                  setTodasLiberadas(e.target.checked);
                  if (e.target.checked) {
                    setEmpresasPermitidas([]);
                  }
                }}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-800"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900">
                  Liberar todas as empresas emissoras atuais e futuras
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Quando marcado, o usuário poderá emitir em nome de qualquer empresa cadastrada.
                </p>
              </div>
            </label>
          </div>

          {/* Lista de Seleção Manual */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Ou selecione as empresas autorizadas individualmente:
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              {empresasEmissoras.map((emp) => {
                const isChecked = todasLiberadas || empresasPermitidas.includes(emp.id);

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmpresa(emp.id)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {emp.razao_social}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{mascaraCnpj(emp.cnpj)}</span>
                        <span>•</span>
                        <span>{emp.cidade}/{emp.uf}</span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-slate-900 pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
