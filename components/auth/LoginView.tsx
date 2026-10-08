'use client';

import React, { useState } from 'react';
import { Usuario } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { Lock, User, FileText, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

interface LoginViewProps {
 onLoginSuccess: (user: Usuario) => void;
}

type TipoAcesso = 'admin' | 'emissor';

export function LoginView({ onLoginSuccess }: LoginViewProps) {
 const [tipoAcesso, setTipoAcesso] = useState<TipoAcesso>('admin');
 const [login, setLogin] = useState('admin');
 const [senha, setSenha] = useState('123');
 const [carregando, setCarregando] = useState(false);
 const [erro, setErro] = useState<string | null>(null);
 const [modalEsqueci, setModalEsqueci] = useState(false);

 const handleMudarTipoAcesso = (tipo: TipoAcesso) => {
 setTipoAcesso(tipo);
 setErro(null);
 if (tipo === 'admin') {
 setLogin('admin');
 setSenha('123');
 } else {
 setLogin('lucas');
 setSenha('123');
 }
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setErro(null);

 const loginLimpo = login.trim().toLowerCase();
 if (!loginLimpo) {
 setErro('Informe seu usuário ou login de acesso.');
 return;
 }

 setCarregando(true);

 setTimeout(() => {
 // Garantir dados inicializados
 StorageService.init();
 const usuarios = StorageService.getUsuarios();

 // Busca usuário por login
 const usuarioEncontrado = usuarios.find(
 (u) => u.login.toLowerCase() === loginLimpo
 );

 if (!usuarioEncontrado) {
 setCarregando(false);
 setErro('Usuário não localizado no sistema. Verifique o login digitado.');
 return;
 }

 // Verificação de status
 if (usuarioEncontrado.status !== 'ativo') {
 setCarregando(false);
 setErro('Este usuário encontra-se inativo. Contate o administrador do sistema.');
 return;
 }

 // Validação estrita de senha: sem bypass de senha mestra
 const senhaCorreta = usuarioEncontrado.senha === senha;

 if (!senhaCorreta) {
 setCarregando(false);
 setErro('Senha incorreta. Verifique a senha digitada ou contate o administrador.');
 return;
 }

 // Validação do perfil selecionado na aba
 if (tipoAcesso === 'admin' && usuarioEncontrado.perfil !== 'admin') {
 setCarregando(false);
 setErro('O usuário informado não possui privilégios de Administrador.');
 return;
 }

 // Login bem-sucedido
 StorageService.setCurrentUser(usuarioEncontrado);
 setCarregando(false);
 onLoginSuccess(usuarioEncontrado);
 }, 250);
 };

 return (
 <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative">
 <div className="w-full max-w-md">
 {/* Card Principal */}
 <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm transition-colors">
 {/* Logo e Cabeçalho */}
 <div className="text-center mb-6">
 <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border ">
 <FileText className="w-7 h-7 text-emerald-400" />
 </div>
 <h1 className="text-lg font-bold text-slate-900 tracking-tight">
 SISTEMA DE RECIBOS & RDC
 </h1>
 <p className="text-xs text-slate-500 mt-0.5">
 Portal Oficial de Emissão e Controle Documental
 </p>
 </div>

 {/* Abas de Seleção de Acesso */}
 <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200/80 ">
 <button
 type="button"
 onClick={() => handleMudarTipoAcesso('admin')}
 className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
 tipoAcesso === 'admin'
 ? 'bg-white text-slate-900 shadow-xs border border-slate-200 '
 : 'text-slate-500 hover:text-slate-900 '
 }`}
 >
 <ShieldCheck
 className={`w-4 h-4 ${tipoAcesso === 'admin' ? 'text-blue-600 ' : 'text-slate-400'}`}
 />
 <span>Acesso Admin</span>
 </button>

 <button
 type="button"
 onClick={() => handleMudarTipoAcesso('emissor')}
 className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
 tipoAcesso === 'emissor'
 ? 'bg-white text-slate-900 shadow-xs border border-slate-200 '
 : 'text-slate-500 hover:text-slate-900 '
 }`}
 >
 <User
 className={`w-4 h-4 ${tipoAcesso === 'emissor' ? 'text-emerald-600 ' : 'text-slate-400'}`}
 />
 <span>Área do Emissor</span>
 </button>
 </div>

 {/* Banner Informativo */}
 <div
 className={`mb-5 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
 tipoAcesso === 'admin'
 ? 'bg-blue-50/70 border-blue-200/80 text-blue-900 '
 : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 '
 }`}
 >
 {tipoAcesso === 'admin' ? (
 <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
 ) : (
 <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
 )}
 <div className="leading-relaxed">
 <div className="font-bold">
 {tipoAcesso === 'admin'
 ? 'Painel Geral do Administrador'
 : 'Área Operacional do Emissor'}
 </div>
 <p className="text-[11px] opacity-90 mt-0.5">
 {tipoAcesso === 'admin'
 ? 'Gestão de empresas, usuários, permissões, histórico e numeração.'
 : 'Emissão rápida de Recibos, RDC corporativa e consulta.'}
 </p>
 </div>
 </div>

 {/* Mensagem de Erro */}
 {erro && (
 <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erro}</span>
 </div>
 )}

 {/* Formulário de Login */}
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">
 Usuário / Login
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 ">
 <User className="w-4 h-4" />
 </div>
 <input
 type="text"
 required
 value={login}
 onChange={(e) => setLogin(e.target.value)}
 placeholder="Digite seu usuário"
 className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">
 Senha de Acesso
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 ">
 <Lock className="w-4 h-4" />
 </div>
 <input
 type="password"
 required
 value={senha}
 onChange={(e) => setSenha(e.target.value)}
 placeholder="••••••••"
 className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
 />
 </div>
 </div>

 <div className="pt-2">
 <button
 type="submit"
 disabled={carregando}
 className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
 >
 <span>{carregando ? 'ENTRANDO...' : 'ACESSAR O SISTEMA'}</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>

 <div className="text-center pt-2">
 <button
 type="button"
 onClick={() => setModalEsqueci(true)}
 className="text-xs text-slate-500 hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
 >
 Esqueci minha senha
 </button>
 </div>
 </form>
 </div>

 {/* Rodapé */}
 <div className="text-center mt-5 text-[11px] text-slate-400 space-y-1">
 <div>Sistema de Emissão e Gestão de Recibos & RDC</div>
 <div className="text-slate-500 ">Desenvolvido para conformidade e controle interno</div>
 </div>
 </div>

 {/* Modal Esqueci minha Senha */}
 {modalEsqueci && (
 <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
 <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
 <h3 className="text-sm font-bold text-slate-900 mb-2">Recuperação de Senha</h3>
 <p className="text-xs text-slate-600 mb-4 leading-relaxed">
 Para redefinir sua senha, solicite ao <b>Administrador</b> a atualização no menu &quot;Cadastro de Usuários&quot;.
 </p>
 <div className="flex justify-end">
 <button
 type="button"
 onClick={() => setModalEsqueci(false)}
 className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
 >
 Entendido
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
