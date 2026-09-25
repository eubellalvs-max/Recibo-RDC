'use client';

import React from 'react';
import { Usuario } from '@/lib/types';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  FileText,
  FileCheck2,
  Settings,
  PlusCircle,
  FolderOpen,
  Search,
  ArrowLeftRight,
} from 'lucide-react';

interface SidebarProps {
  user: Usuario;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNovoRecibo: () => void;
  onOpenNovoRdc: () => void;
  onSwitchProfileDemo?: (novoPerfil: 'admin' | 'emissor') => void;
}

export function Sidebar({
  user,
  currentTab,
  onSelectTab,
  onOpenNovoRecibo,
  onOpenNovoRdc,
  onSwitchProfileDemo,
}: SidebarProps) {
  const isAdmin = user.perfil === 'admin';

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 no-print min-h-[calc(100vh-53px)]">
      {/* Botões de Ação Primária de Emissão */}
      <div className="p-4 space-y-2 border-b border-slate-200">
        <button
          onClick={onOpenNovoRecibo}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-start gap-2 shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Emitir Novo Recibo</span>
        </button>

        <button
          onClick={onOpenNovoRdc}
          className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-start gap-2 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-blue-500" />
          <span>Emitir Novo RDC</span>
        </button>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Seção Principal */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navegação Principal
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-200/70 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Dashboard</span>
            </button>

            {!isAdmin && (
              <>
                <button
                  onClick={() => onSelectTab('meus-documentos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'meus-documentos'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                  <span>Meus Documentos</span>
                </button>

                <button
                  onClick={() => onSelectTab('empresas-consulta')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'empresas-consulta'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>Consultar Empresas</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Módulos do Administrador */}
        {isAdmin && (
          <>
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cadastros & Gestão
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => onSelectTab('empresas')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'empresas'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Empresas</span>
                </button>

                <button
                  onClick={() => onSelectTab('usuarios')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'usuarios'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Usuários</span>
                </button>

                <button
                  onClick={() => onSelectTab('emissores')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'emissores'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Permissões de Emissores</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Documentos & Auditoria
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => onSelectTab('documentos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'documentos'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Todos os Documentos</span>
                </button>

                <button
                  onClick={() => onSelectTab('configuracoes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'configuracoes'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Configurações do Sistema</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rodapé da Barra Lateral - Switch de Demonstração */}
      {onSwitchProfileDemo && (
        <div className="p-3 border-t border-slate-200 bg-slate-100/60">
          <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Alternar Perfil (Demo):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSwitchProfileDemo('admin')}
              className={`py-1 px-2 text-[11px] font-medium rounded border transition-colors ${
                isAdmin
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onSwitchProfileDemo('emissor')}
              className={`py-1 px-2 text-[11px] font-medium rounded border transition-colors ${
                !isAdmin
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Emissor
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
