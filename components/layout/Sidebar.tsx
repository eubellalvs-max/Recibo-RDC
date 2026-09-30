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
  HeartPulse,
} from 'lucide-react';
import { ThemeToggle } from '@/lib/theme';

interface SidebarProps {
  user: Usuario;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNovoRecibo: () => void;
  onOpenNovoRdc: () => void;
  onOpenNovoReciboMedico: () => void;
}

export function Sidebar({
  user,
  currentTab,
  onSelectTab,
  onOpenNovoRecibo,
  onOpenNovoRdc,
  onOpenNovoReciboMedico,
}: SidebarProps) {
  const isAdmin = user.perfil === 'admin';

  return (
    <aside className="sidebar navigation w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 no-print min-h-[calc(100vh-53px)] transition-colors">
      {/* Botões de Ação Primária de Emissão */}
      <div className="p-4 space-y-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onOpenNovoReciboMedico}
          className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-start gap-2 shadow-xs transition-colors"
        >
          <HeartPulse className="w-4 h-4 text-emerald-200" />
          <span>Emitir Recibo Médico</span>
        </button>

        <button
          onClick={onOpenNovoRecibo}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-start gap-2 shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Emitir Novo Recibo</span>
        </button>

        <button
          onClick={onOpenNovoRdc}
          className="w-full py-2 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-start gap-2 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-blue-500" />
          <span>Emitir Novo RDC</span>
        </button>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Seção Principal */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Navegação Principal
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('recibos-medicos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                currentTab === 'recibos-medicos'
                  ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recibos Médicos</span>
            </button>

            {!isAdmin && (
              <>
                <button
                  onClick={() => onSelectTab('empresas')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'empresas'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Cadastrar Empresas</span>
                </button>

                <button
                  onClick={() => onSelectTab('meus-documentos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'meus-documentos'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Meus Documentos</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Módulos do Administrador */}
        {isAdmin && (
          <>
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Cadastros & Gestão
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => onSelectTab('empresas')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'empresas'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Empresas</span>
                </button>

                <button
                  onClick={() => onSelectTab('usuarios')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'usuarios'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Usuários</span>
                </button>

                <button
                  onClick={() => onSelectTab('emissores')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'emissores'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Permissões de Emissores</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Documentos & Auditoria
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => onSelectTab('recibos-medicos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'recibos-medicos'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recibos Médicos</span>
                </button>

                <button
                  onClick={() => onSelectTab('documentos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'documentos'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Todos os Documentos</span>
                </button>

                <button
                  onClick={() => onSelectTab('configuracoes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    currentTab === 'configuracoes'
                      ? 'bg-slate-200/70 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Configurações do Sistema</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Alternância Rápida de Tema na Barra Lateral */}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
        <ThemeToggle variant="button" className="w-full justify-center" />
      </div>

      {/* Rodapé da Barra Lateral - Identificação do Perfil Autenticado */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            {isAdmin ? 'A' : 'E'}
          </div>
          <div className="text-left overflow-hidden flex-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {isAdmin ? 'Painel do Administrador' : 'Área do Emissor'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAdmin ? 'Login: admin' : `Login: ${user.login}`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
