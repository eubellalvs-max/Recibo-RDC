'use client';

import React from 'react';
import { Usuario, Documento, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr, mascaraCnpj } from '@/lib/masks';
import {
 Building2,
 Users,
 FileText,
 DollarSign,
 Plus,
 Eye,
 ArrowRight,
 TrendingUp,
 FileCheck2,
 HeartPulse,
} from 'lucide-react';

interface AdminDashboardProps {
 onSelectTab: (tab: string) => void;
 onOpenNovoRecibo: () => void;
 onOpenNovoRdc: () => void;
 onOpenNovoReciboMedico?: () => void;
 onVisualizarDocumento: (doc: Documento) => void;
}

export function AdminDashboard({
 onSelectTab,
 onOpenNovoRecibo,
 onOpenNovoRdc,
 onOpenNovoReciboMedico,
 onVisualizarDocumento,
}: AdminDashboardProps) {
 const empresas = StorageService.getEmpresas();
 const usuarios = StorageService.getUsuarios();
 const documentos = StorageService.getDocumentos();

 const empresasAtivas = empresas.filter((e) => e.status === 'ativa').length;
 const usuariosAtivos = usuarios.filter((u) => u.status === 'ativo').length;
 const docsValidos = documentos.filter((d) => d.status === 'emitido');
 const valorTotalGeral = docsValidos.reduce((acc, curr) => acc + curr.valor, 0);

 const recibosCount = docsValidos.filter((d) => d.tipo === 'recibo').length;
 const recibosMedicosCount = docsValidos.filter((d) => d.tipo === 'recibo_medico').length;
 const rdcCount = docsValidos.filter((d) => d.tipo === 'rdc').length;

 const ultimosDocs = documentos.slice(0, 6);

 const getNomeEmpresa = (id: string) => {
 const emp = empresas.find((e) => e.id === id);
 return emp ? emp.nome_fantasia || emp.razao_social : 'Não identificada';
 };

 return (
 <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
 {/* Top Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-slate-900 ">
 Painel do Administrador
 </h1>
 <p className="text-xs text-slate-500 mt-1">
 Visão consolidada de empresas, usuários cadastrados e documentos emitidos
 </p>
 </div>

 <div className="flex items-center gap-2">
 {onOpenNovoReciboMedico && (
 <button
 onClick={onOpenNovoReciboMedico}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
 >
 <HeartPulse className="w-3.5 h-3.5" />
 <span>Recibo Médico</span>
 </button>
 )}
 <button
 onClick={onOpenNovoRecibo}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Emitir Recibo</span>
 </button>
 <button
 onClick={onOpenNovoRdc}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Emitir RDC</span>
 </button>
 </div>
 </div>

 {/* Grid de Estatísticas Principais (Cards simples e limpos) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Card Empresas */}
 <div
 onClick={() => onSelectTab('empresas')}
 className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer shadow-2xs group"
 >
 <div className="flex items-center justify-between text-slate-500 ">
 <span className="text-[11px] font-semibold uppercase tracking-wider">
 Empresas
 </span>
 <Building2 className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
 </div>
 <div className="mt-2 flex items-baseline gap-2">
 <span className="text-2xl font-bold text-slate-900 tabular-nums">
 {empresas.length}
 </span>
 <span className="text-xs text-slate-500 ">
 ({empresasAtivas} ativas)
 </span>
 </div>
 <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
 <span>Emissoras e Destinatárias</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Card Usuários */}
 <div
 onClick={() => onSelectTab('usuarios')}
 className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer shadow-2xs group"
 >
 <div className="flex items-center justify-between text-slate-500 ">
 <span className="text-[11px] font-semibold uppercase tracking-wider">
 Usuários
 </span>
 <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
 </div>
 <div className="mt-2 flex items-baseline gap-2">
 <span className="text-2xl font-bold text-slate-900 tabular-nums">
 {usuarios.length}
 </span>
 <span className="text-xs text-slate-500 ">
 ({usuariosAtivos} ativos)
 </span>
 </div>
 <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
 <span>Administradores e Emissores</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Card Documentos */}
 <div
 onClick={() => onSelectTab('documentos')}
 className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer shadow-2xs group"
 >
 <div className="flex items-center justify-between text-slate-500 ">
 <span className="text-[11px] font-semibold uppercase tracking-wider">
 Documentos
 </span>
 <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
 </div>
 <div className="mt-2 flex items-baseline gap-2">
 <span className="text-2xl font-bold text-slate-900 tabular-nums">
 {documentos.length}
 </span>
 <span className="text-xs text-slate-500 ">
 ({recibosMedicosCount} Méd / {recibosCount} Rec / {rdcCount} RDC)
 </span>
 </div>
 <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
 <span>Sequencial ativo</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Card Volume Total */}
 <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
 <div className="flex items-center justify-between text-slate-500 ">
 <span className="text-[11px] font-semibold uppercase tracking-wider">
 Volume Emitido
 </span>
 <DollarSign className="w-4 h-4 text-emerald-600 " />
 </div>
 <div className="mt-2">
 <span className="text-xl font-bold text-slate-900 tabular-nums">
 {formatarMoeda(valorTotalGeral)}
 </span>
 </div>
 <div className="mt-2 text-[11px] text-slate-400 ">
 Total acumulado no exercício 2026
 </div>
 </div>
 </div>

 {/* Tabela dos Últimos Documentos Emitidos */}
 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">
 Últimos Documentos Emitidos no Sistema
 </h2>
 <p className="text-xs text-slate-500 ">
 Acompanhamento em tempo real de emissões de Recibos e RDC
 </p>
 </div>

 <button
 onClick={() => onSelectTab('documentos')}
 className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
 >
 <span>Ver todos</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3">Nº</th>
 <th className="px-4 py-3">Tipo</th>
 <th className="px-4 py-3">Empresa Emissora</th>
 <th className="px-4 py-3">Empresa Destinatária</th>
 <th className="px-4 py-3">Data</th>
 <th className="px-4 py-3 text-right">Valor</th>
 <th className="px-4 py-3 text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {ultimosDocs.map((doc) => {
 const isRecibo = doc.tipo === 'recibo';
 const isReciboMedico = doc.tipo === 'recibo_medico';
 return (
 <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
 {doc.numero}
 </td>
 <td className="px-4 py-3">
 <span
 className={`text-[11px] font-semibold ${
 isReciboMedico
 ? 'text-teal-700 bg-teal-50 px-2 py-0.5 rounded'
 : isRecibo
 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'
 : 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded'
 }`}
 >
 {isReciboMedico ? 'REC.M' : isRecibo ? 'REC.' : 'RDC'}
 </span>
 </td>
 <td className="px-4 py-3 text-slate-700 max-w-[170px] truncate">
 {getNomeEmpresa(doc.empresa_emissora_id)}
 </td>
 <td className="px-4 py-3 text-slate-900 font-medium max-w-[170px] truncate">
 {getNomeEmpresa(doc.empresa_destinataria_id)}
 </td>
 <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
 {formatarDataBr(doc.data_emissao)}
 </td>
 <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
 {formatarMoeda(doc.valor)}
 </td>
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <button
 onClick={() => onVisualizarDocumento(doc)}
 className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
 >
 <Eye className="w-3 h-3 text-slate-500 " />
 <span>Visualizar</span>
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
