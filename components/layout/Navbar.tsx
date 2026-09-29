'use client';

import React from 'react';
import { Usuario } from '@/lib/types';
import { LogOut, User, Building2, Plus, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/lib/theme';

interface NavbarProps {
  user: Usuario;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNovoRecibo: () => void;
  onOpenNovoRdc: () => void;
  onOpenNovoReciboMedico: () => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  currentTab,
  onSelectTab,
  onOpenNovoRecibo,
  onOpenNovoRdc,
  onOpenNovoReciboMedico,
  onLogout,
}: NavbarProps) {
  const isAdmin = user.perfil === 'admin';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      {/* Zone 1: Single text element wordmark with clean subtle metadata */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="text-left group flex items-center gap-2"
        >
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            Recibo & RDC
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isAdmin ? 'Painel Administrativo' : 'Área do Emissor'}
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Clean text links with hover state) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
            currentTab === 'dashboard' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => onSelectTab('recibos-medicos')}
          className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
            currentTab === 'recibos-medicos' ? 'text-slate-900 dark:text-white font-semibold' : ''
          }`}
        >
          Recibos Médicos
        </button>

        {isAdmin ? (
          <>
            <button
              onClick={() => onSelectTab('empresas')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'empresas' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Empresas
            </button>
            <button
              onClick={() => onSelectTab('usuarios')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'usuarios' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Usuários
            </button>
            <button
              onClick={() => onSelectTab('emissores')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'emissores' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Permissões
            </button>
            <button
              onClick={() => onSelectTab('documentos')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'documentos' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => onSelectTab('configuracoes')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'configuracoes' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Configurações
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectTab('empresas')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'empresas' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Empresas
            </button>
            <button
              onClick={() => onSelectTab('meus-documentos')}
              className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
                currentTab === 'meus-documentos' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              Meus Documentos
            </button>
          </>
        )}
      </nav>

      {/* Zone 3: Fast Action Buttons, Theme Toggle & User Menu */}
      <div className="flex items-center gap-3">
        {/* Botões de Ação Rápida de Emissão */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenNovoReciboMedico}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Recibo Médico</span>
          </button>
          <button
            onClick={onOpenNovoRecibo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Recibo</span>
          </button>
          <button
            onClick={onOpenNovoRdc}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo RDC</span>
          </button>
        </div>

        {/* Separador vertical */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Botão de Alternar Aparência (Clara / Escura) */}
        <ThemeToggle variant="icon" />

        {/* Identificação do Usuário */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
            {user.nome.charAt(0)}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{user.nome}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{user.perfil}</div>
          </div>
        </div>

        {/* Botão Sair */}
        <button
          onClick={onLogout}
          title="Encerrar sessão"
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
