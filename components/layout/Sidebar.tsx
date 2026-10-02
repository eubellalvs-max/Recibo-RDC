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
 <aside className="sidebar navigation w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 no-print min-h-[calc(100vh-53px)] transition-colors">
 {/* Botões de Ação Primária de Emissão */}
 <div className="p-4 space-y-2 border-b border-slate-200 ">
 <button
 onClick={onOpenNovoReciboMedico}
 className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-start gap-2 shadow-xs transition-colors"
 >
 <HeartPulse className="w-4 h-4 text-emerald-200" />
 <span>Emitir Recibo Médico</span>
 </button>

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
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <LayoutDashboard className="w-4 h-4 text-slate-500 " />
 <span>Dashboard</span>
 </button>

 <button
 onClick={() => onSelectTab('recibos-medicos')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'recibos-medicos'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <HeartPulse className="w-4 h-4 text-emerald-600 " />
 <span>Recibos Médicos</span>
 </button>

 {!isAdmin && (
 <>
 <button
 onClick={() => onSelectTab('empresas')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'empresas'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <Building2 className="w-4 h-4 text-slate-500 " />
 <span>Cadastrar Empresas</span>
 </button>

 <button
 onClick={() => onSelectTab('meus-documentos')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'meus-documentos'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <FolderOpen className="w-4 h-4 text-slate-500 " />
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
 <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
 Cadastros & Gestão
 </div>
 <div className="space-y-0.5">
 <button
 onClick={() => onSelectTab('empresas')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'empresas'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <Building2 className="w-4 h-4 text-slate-500 " />
 <span>Empresas</span>
 </button>

 <button
 onClick={() => onSelectTab('usuarios')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'usuarios'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <Users className="w-4 h-4 text-slate-500 " />
 <span>Usuários</span>
 </button>

 <button
 onClick={() => onSelectTab('emissores')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'emissores'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <Shield className="w-4 h-4 text-slate-500 " />
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
 onClick={() => onSelectTab('recibos-medicos')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'recibos-medicos'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <HeartPulse className="w-4 h-4 text-emerald-600 " />
 <span>Recibos Médicos</span>
 </button>

 <button
 onClick={() => onSelectTab('documentos')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'documentos'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <FileText className="w-4 h-4 text-slate-500 " />
 <span>Todos os Documentos</span>
 </button>

 <button
 onClick={() => onSelectTab('configuracoes')}
 className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
 currentTab === 'configuracoes'
 ? 'bg-slate-200/70 text-slate-900 font-semibold '
 : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 '
 }`}
 >
 <Settings className="w-4 h-4 text-slate-500 " />
 <span>Configurações do Sistema</span>
 </button>
 </div>
 </div>
 </>
 )}
 </div>

 {/* Rodapé da Barra Lateral - Identificação do Perfil Autenticado */}
 <div className="p-3 border-t border-slate-200 bg-slate-100/50 ">
 <div className="flex items-center gap-2">
 <div
 className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
 isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
 }`}
 >
 {isAdmin ? 'A' : 'E'}
 </div>
 <div className="text-left overflow-hidden flex-1">
 <div className="text-xs font-semibold text-slate-800 truncate">
 {isAdmin ? 'Painel do Administrador' : 'Área do Emissor'}
 </div>
 <div className="text-[10px] text-slate-500 ">
 {isAdmin ? 'Login: admin' : `Login: ${user.login}`}
 </div>
 </div>
 </div>
 </div>
 </aside>
 );
}
