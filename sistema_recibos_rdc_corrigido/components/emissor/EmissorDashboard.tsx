'use client';

import React from 'react';
import { Usuario, Documento, Empresa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { formatarMoeda, formatarDataBr, mascaraCnpj } from '@/lib/masks';
import { FileText, PlusCircle, ArrowUpRight, Eye, Printer, FolderOpen, Building2, HeartPulse, Edit3 } from 'lucide-react';

interface EmissorDashboardProps {
 currentUser: Usuario;
 onOpenNovoRecibo: () => void;
 onOpenNovoRdc: () => void;
 onOpenNovoReciboMedico?: () => void;
 onVisualizarDocumento: (doc: Documento) => void;
 onEditarDocumento?: (doc: Documento) => void;
 onVerTodosDocumentos: () => void;
 onIrParaEmpresas?: () => void;
}

export function EmissorDashboard({
 currentUser,
 onOpenNovoRecibo,
 onOpenNovoRdc,
 onOpenNovoReciboMedico,
 onVisualizarDocumento,
 onEditarDocumento,
 onVerTodosDocumentos,
 onIrParaEmpresas,
}: EmissorDashboardProps) {
 const todosDocs = StorageService.getDocumentos();
 const empresas = StorageService.getEmpresas();

 // Filtrar documentos emitidos por este usuário (ou todos se for admin)
 const meusDocs = todosDocs.filter(
 (d) => currentUser.perfil === 'admin' || d.usuario_id === currentUser.id
 );

 const totalValorMeusDocs = meusDocs
 .filter((d) => d.status === 'emitido')
 .reduce((acc, curr) => acc + curr.valor, 0);

 const recibosCount = meusDocs.filter((d) => d.tipo === 'recibo' && d.status === 'emitido').length;
 const recibosMedicosCount = meusDocs.filter((d) => d.tipo === 'recibo_medico' && d.status === 'emitido').length;
 const rdcCount = meusDocs.filter((d) => d.tipo === 'rdc' && d.status === 'emitido').length;

 const ultimosDocs = meusDocs.slice(0, 5);

 const getNomeEmpresa = (id: string) => {
 const emp = empresas.find((e) => e.id === id);
 return emp ? emp.nome_fantasia || emp.razao_social : 'Empresa';
 };

 return (
 <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
 {/* Mensagem de Boas-vindas */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-slate-900 ">
 Olá, {currentUser.nome.split(' ')[0]}!
 </h1>
 <p className="text-xs text-slate-500 mt-1">
 Selecione uma das opções abaixo para iniciar uma nova emissão instantânea.
 </p>
 </div>

 <div className="flex items-center gap-2.5">
 {onIrParaEmpresas && (
 <button
 onClick={onIrParaEmpresas}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
 >
 <Building2 className="w-3.5 h-3.5 text-slate-600 " />
 <span>Cadastrar Empresas ({empresas.length})</span>
 </button>
 )}

 <button
 onClick={onVerTodosDocumentos}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
 >
 <FolderOpen className="w-3.5 h-3.5 text-slate-500 " />
 <span>Meus Documentos ({meusDocs.length})</span>
 </button>
 </div>
 </div>

 {/* Cards de Ação Principal: O que você deseja emitir ou cadastrar? */}
 <div>
 <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
 O que você deseja emitir ou gerenciar hoje?
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Card Recibo Médico */}
 {onOpenNovoReciboMedico && (
 <button
 onClick={onOpenNovoReciboMedico}
 className="group text-left p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
 <HeartPulse className="w-6 h-6 text-emerald-600 " />
 </div>
 <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
 Emitir <ArrowUpRight className="w-3.5 h-3.5" />
 </span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 ">
 RECIBO MÉDICO
 </h3>
 <p className="text-[11px] text-slate-500 mt-1 leading-snug">
 Serviços médicos particulares • Modelo Oficial ABEAS com numeração automática 001/2026.
 </p>
 </div>
 </button>
 )}

 {/* Card Novo Recibo */}
 <button
 onClick={onOpenNovoRecibo}
 className="group text-left p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
 🧾
 </div>
 <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
 Emitir <ArrowUpRight className="w-3.5 h-3.5" />
 </span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-900 ">
 RECIBO COMUM
 </h3>
 <p className="text-[11px] text-slate-500 mt-1 leading-snug">
 Comprovante padrão com logotipo de empresas, numeração sequencial e extenso.
 </p>
 </div>
 </button>

 {/* Card Novo RDC */}
 <button
 onClick={onOpenNovoRdc}
 className="group text-left p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
 📄
 </div>
 <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
 Emitir <ArrowUpRight className="w-3.5 h-3.5" />
 </span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 ">
 RDC
 </h3>
 <p className="text-[11px] text-slate-500 mt-1 leading-snug">
 Prestação de contas de viagem ou despesas corporativas no modelo oficial ABEAS.
 </p>
 </div>
 </button>

 {/* Card Cadastro de Empresa */}
 {onIrParaEmpresas && (
 <button
 onClick={onIrParaEmpresas}
 className="group text-left p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all shadow-xs hover:shadow-sm flex flex-col justify-between"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
 🏢
 </div>
 <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
 Cadastrar <ArrowUpRight className="w-3.5 h-3.5" />
 </span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 ">
 EMPRESAS
 </h3>
 <p className="text-[11px] text-slate-500 mt-1 leading-snug">
 Cadastre empresas emissoras ou pagadoras e vincule seus logos oficiais.
 </p>
 </div>
 </button>
 )}
 </div>
 </div>

 {/* Métricas Resumidas do Emissor */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-4 bg-white border border-slate-200 rounded-xl transition-colors">
 <div className="text-[11px] font-semibold text-slate-500 uppercase">
 Total Emitido por Você
 </div>
 <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
 {formatarMoeda(totalValorMeusDocs)}
 </div>
 <div className="text-[11px] text-slate-400 mt-0.5">
 {meusDocs.length} documentos gerados
 </div>
 </div>

 <div className="p-4 bg-white border border-slate-200 rounded-xl transition-colors">
 <div className="text-[11px] font-semibold text-slate-500 uppercase">
 Recibos Emitidos
 </div>
 <div className="text-lg font-bold text-emerald-700 mt-1 tabular-nums">
 {recibosCount}
 </div>
 <div className="text-[11px] text-slate-400 mt-0.5">
 Com numeração sequencial
 </div>
 </div>

 <div className="p-4 bg-white border border-slate-200 rounded-xl transition-colors">
 <div className="text-[11px] font-semibold text-slate-500 uppercase">
 RDC Emitidos
 </div>
 <div className="text-lg font-bold text-blue-700 mt-1 tabular-nums">
 {rdcCount}
 </div>
 <div className="text-[11px] text-slate-400 mt-0.5">
 Com competência informada
 </div>
 </div>
 </div>

 {/* Últimos Documentos Emitidos */}
 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
 <div>
 <h2 className="text-sm font-bold text-slate-900 ">Últimos Documentos Emitidos</h2>
 <p className="text-xs text-slate-500 ">Histórico recente de emissões geradas</p>
 </div>
 <button
 onClick={onVerTodosDocumentos}
 className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
 >
 Ver todos
 </button>
 </div>

 {ultimosDocs.length === 0 ? (
 <div className="p-8 text-center text-xs text-slate-500 ">
 Nenhum documento emitido até o momento. Clique em &quot;Novo Recibo&quot; ou &quot;Novo RDC&quot; para começar.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3">Nº</th>
 <th className="px-4 py-3">Tipo</th>
 <th className="px-4 py-3">Destinatário</th>
 <th className="px-4 py-3">Emissor</th>
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
 <td className="px-4 py-3 font-mono font-semibold text-slate-800 ">
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
 <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[180px]">
 {getNomeEmpresa(doc.empresa_destinataria_id)}
 </td>
 <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">
 {getNomeEmpresa(doc.empresa_emissora_id)}
 </td>
 <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
 {formatarDataBr(doc.data_emissao)}
 </td>
 <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
 {formatarMoeda(doc.valor)}
 </td>
 <td className="px-4 py-3 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 onClick={() => onVisualizarDocumento(doc)}
 className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
 >
 <Eye className="w-3 h-3 text-slate-500 " />
 <span>Visualizar</span>
 </button>
 {onEditarDocumento && doc.status !== 'cancelado' && (
 <button
 onClick={() => onEditarDocumento(doc)}
 className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
 title="Editar documento (Manter mesmo número)"
 >
 <Edit3 className="w-3 h-3 text-blue-600 " />
 <span>Editar</span>
 </button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}
