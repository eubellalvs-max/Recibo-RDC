'use client';

import React, { useState } from 'react';
import { Usuario, Empresa, UserRole, UserStatus } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import {
 Users,
 Plus,
 Search,
 Edit2,
 KeyRound,
 Power,
 ShieldCheck,
 FileText,
 X,
 Check,
 AlertCircle,
} from 'lucide-react';

interface UsuariosManagementProps {
 currentUser: Usuario;
}

export function UsuariosManagement({ currentUser }: UsuariosManagementProps) {
 const [usuarios, setUsuarios] = useState<Usuario[]>(() => StorageService.getUsuarios());
 const empresas = StorageService.getEmpresas();

 const [busca, setBusca] = useState('');
 const [filtroPerfil, setFiltroPerfil] = useState<string>('todos');

 // Modal de Criação / Edição
 const [modalAberto, setModalAberto] = useState(false);
 const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

 // Modal de Redefinir Senha
 const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
 const [usuarioRedefinir, setUsuarioRedefinir] = useState<Usuario | null>(null);
 const [novaSenha, setNovaSenha] = useState('123');
 const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('123');

 // Formulário de Usuário
 const [nome, setNome] = useState('');
 const [login, setLogin] = useState('');
 const [email, setEmail] = useState('');
 const [senha, setSenha] = useState('123');
 const [confirmarSenha, setConfirmarSenha] = useState('123');
 const [perfil, setPerfil] = useState<UserRole>('emissor');
 const [empresaId, setEmpresaId] = useState('');
 const [status, setStatus] = useState<UserStatus>('ativo');
 const [erroForm, setErroForm] = useState<string | null>(null);

 const recarregarUsuarios = () => {
 setUsuarios(StorageService.getUsuarios());
 };

 const abrirNovo = () => {
 setUsuarioEditando(null);
 setNome('');
 setLogin('');
 setEmail('');
 setSenha('123');
 setConfirmarSenha('123');
 setPerfil('emissor');
 setEmpresaId(empresas[0]?.id || '');
 setStatus('ativo');
 setErroForm(null);
 setModalAberto(true);
 };

 const abrirEdicao = (usr: Usuario) => {
 setUsuarioEditando(usr);
 setNome(usr.nome);
 setLogin(usr.login);
 setEmail(usr.email);
 setSenha(usr.senha);
 setConfirmarSenha(usr.senha);
 setPerfil(usr.perfil);
 setEmpresaId(usr.empresa_id || '');
 setStatus(usr.status);
 setErroForm(null);
 setModalAberto(true);
 };

 const handleSalvar = (e: React.FormEvent) => {
 e.preventDefault();
 setErroForm(null);

 if (!nome.trim()) {
 setErroForm('O Nome é obrigatório.');
 return;
 }
 if (!login.trim()) {
 setErroForm('O Usuário/Login é obrigatório.');
 return;
 }

 const loginLimpo = login.trim().toLowerCase();
 const loginJaExiste = usuarios.some(
 (u) => u.login.toLowerCase() === loginLimpo && (!usuarioEditando || u.id !== usuarioEditando.id)
 );
 if (loginJaExiste) {
 setErroForm(`O login "${loginLimpo}" já está em uso por outro usuário.`);
 return;
 }

 if (!email.trim() || !email.includes('@')) {
 setErroForm('Informe um e-mail válido.');
 return;
 }

 if (!usuarioEditando) {
 if (!senha.trim()) {
 setErroForm('A senha é obrigatória para novos usuários.');
 return;
 }
 if (senha !== confirmarSenha) {
 setErroForm('As senhas digitadas não coincidem.');
 return;
 }
 }

 const novoUsuario: Usuario = {
 id: usuarioEditando ? usuarioEditando.id : `usr-${Date.now()}`,
 nome: nome.trim(),
 login: loginLimpo,
 email: email.trim().toLowerCase(),
 senha: usuarioEditando ? usuarioEditando.senha : senha.trim(),
 perfil,
 empresa_id: empresaId || undefined,
 empresas_permitidas: usuarioEditando?.empresas_permitidas || (empresaId ? [empresaId] : []),
 status,
 created_at: usuarioEditando ? usuarioEditando.created_at : new Date().toISOString(),
 };

 StorageService.saveUsuario(novoUsuario);
 recarregarUsuarios();
 setModalAberto(false);
 };

 const abrirRedefinirSenha = (usr: Usuario) => {
 setUsuarioRedefinir(usr);
 setNovaSenha('123');
 setConfirmarNovaSenha('123');
 setErroForm(null);
 setModalSenhaAberto(true);
 };

 const handleSalvarRedefinirSenha = (e: React.FormEvent) => {
 e.preventDefault();
 if (!novaSenha.trim()) {
 setErroForm('Informe a nova senha.');
 return;
 }
 if (novaSenha !== confirmarNovaSenha) {
 setErroForm('A confirmação de senha não confere.');
 return;
 }
 if (usuarioRedefinir) {
 StorageService.saveUsuario({
 ...usuarioRedefinir,
 senha: novaSenha.trim(),
 });
 recarregarUsuarios();
 setModalSenhaAberto(false);
 }
 };

 const handleAlternarStatus = (usr: Usuario) => {
 if (usr.id === currentUser.id) {
 return;
 }
 const novoStatus: UserStatus = usr.status === 'ativo' ? 'inativo' : 'ativo';
 StorageService.saveUsuario({ ...usr, status: novoStatus });
 recarregarUsuarios();
 };

 const usuariosFiltrados = usuarios.filter((usr) => {
 if (filtroPerfil !== 'todos' && usr.perfil !== filtroPerfil) {
 return false;
 }
 if (busca.trim()) {
 const q = busca.toLowerCase();
 const nomeMatch = usr.nome.toLowerCase().includes(q);
 const loginMatch = usr.login.toLowerCase().includes(q);
 const emailMatch = usr.email.toLowerCase().includes(q);
 return nomeMatch || loginMatch || emailMatch;
 }
 return true;
 });

 const getNomeEmpresa = (id?: string) => {
 if (!id) return 'Nenhuma empresa vinculada';
 const emp = empresas.find((e) => e.id === id);
 return emp ? emp.nome_fantasia || emp.razao_social : 'Empresa não encontrada';
 };

 return (
 <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
 {/* Top Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-slate-900 ">
 Cadastro de Usuários
 </h1>
 <p className="text-xs text-slate-500 mt-1">
 Gestão de acessos, perfis (Administrador / Emissor) e empresas vinculadas
 </p>
 </div>

 <button
 onClick={abrirNovo}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Novo Usuário</span>
 </button>
 </div>

 {/* Barra de Filtros */}
 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 transition-colors">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Buscar usuário
 </label>
 <div className="relative">
 <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 " />
 <input
 type="text"
 value={busca}
 onChange={(e) => setBusca(e.target.value)}
 placeholder="Nome, login ou e-mail..."
 className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">
 Perfil de Acesso
 </label>
 <select
 value={filtroPerfil}
 onChange={(e) => setFiltroPerfil(e.target.value)}
 className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="todos">Todos os perfis</option>
 <option value="admin">Administrador</option>
 <option value="emissor">Emissor</option>
 </select>
 </div>
 </div>

 <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
 <span>{usuariosFiltrados.length} usuário(s) encontrado(s)</span>
 {(busca || filtroPerfil !== 'todos') && (
 <button
 onClick={() => {
 setBusca('');
 setFiltroPerfil('todos');
 }}
 className="text-slate-700 hover:underline font-medium"
 >
 Limpar filtros
 </button>
 )}
 </div>
 </div>

 {/* Tabela de Usuários */}
 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
 <tr>
 <th className="px-4 py-3">Nome / Login</th>
 <th className="px-4 py-3">E-mail</th>
 <th className="px-4 py-3">Perfil</th>
 <th className="px-4 py-3">Empresa Principal</th>
 <th className="px-4 py-3 text-center">Status</th>
 <th className="px-4 py-3 text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {usuariosFiltrados.map((usr) => {
 const isAtivo = usr.status === 'ativo';
 const isAdmin = usr.perfil === 'admin';

 return (
 <tr
 key={usr.id}
 className={`hover:bg-slate-50 transition-colors ${
 !isAtivo ? 'opacity-60 bg-slate-50/50 ' : ''
 }`}
 >
 <td className="px-4 py-3">
 <div className="font-semibold text-slate-900 flex items-center gap-1.5">
 {isAdmin ? (
 <ShieldCheck className="w-3.5 h-3.5 text-blue-600 " />
 ) : (
 <FileText className="w-3.5 h-3.5 text-emerald-600 " />
 )}
 <span>{usr.nome}</span>
 </div>
 <div className="text-[11px] text-slate-500 font-mono">
 login: {usr.login}
 </div>
 </td>
 <td className="px-4 py-3 text-slate-600 ">{usr.email}</td>
 <td className="px-4 py-3">
 <span
 className={`text-[11px] font-semibold ${
 isAdmin ? 'text-blue-700 ' : 'text-slate-700 '
 }`}
 >
 {isAdmin ? 'Administrador' : 'Emissor'}
 </span>
 </td>
 <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
 {getNomeEmpresa(usr.empresa_id)}
 </td>
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <span
 className={`text-[10px] font-medium px-2 py-0.5 rounded ${
 isAtivo
 ? 'bg-emerald-50 text-emerald-700 '
 : 'bg-slate-100 text-slate-500 '
 }`}
 >
 {isAtivo ? 'Ativo' : 'Inativo'}
 </span>
 </td>
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1">
 <button
 onClick={() => abrirEdicao(usr)}
 className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Editar usuário"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => abrirRedefinirSenha(usr)}
 className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Redefinir senha"
 >
 <KeyRound className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleAlternarStatus(usr)}
 disabled={usr.id === currentUser.id}
 className={`p-1 rounded transition-colors ${
 usr.id === currentUser.id
 ? 'opacity-20 cursor-not-allowed'
 : isAtivo
 ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 '
 : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 '
 }`}
 title={isAtivo ? 'Inativar usuário' : 'Ativar usuário'}
 >
 <Power className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal de Cadastro / Edição de Usuário */}
 {modalAberto && (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full my-8 overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 ">
 <div className="flex items-center gap-2">
 <Users className="w-5 h-5 text-slate-700 " />
 <h2 className="text-sm font-bold text-slate-900 ">
 {usuarioEditando ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}
 </h2>
 </div>
 <button
 onClick={() => setModalAberto(false)}
 className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSalvar} className="p-6 space-y-4">
 {erroForm && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erroForm}</span>
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nome Completo *
 </label>
 <input
 type="text"
 required
 value={nome}
 onChange={(e) => setNome(e.target.value)}
 placeholder="Ex: João da Silva"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Usuário / Login *
 </label>
 <input
 type="text"
 required
 value={login}
 onChange={(e) => setLogin(e.target.value)}
 placeholder="Ex: joao.silva"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 E-mail *
 </label>
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="joao@empresa.com.br"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 {/* Senhas */}
 {!usuarioEditando && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Senha *
 </label>
 <input
 type="password"
 required
 value={senha}
 onChange={(e) => setSenha(e.target.value)}
 placeholder="••••••••"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Confirmar Senha *
 </label>
 <input
 type="password"
 required
 value={confirmarSenha}
 onChange={(e) => setConfirmarSenha(e.target.value)}
 placeholder="••••••••"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>
 )}

 {/* Perfil e Empresa Vinculada */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Perfil *
 </label>
 <select
 value={perfil}
 onChange={(e) => setPerfil(e.target.value as UserRole)}
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="emissor">Emissor</option>
 <option value="admin">Administrador</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Empresa Vinculada
 </label>
 <select
 value={empresaId}
 onChange={(e) => setEmpresaId(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="">Nenhuma / Todas</option>
 {empresas.map((e) => (
 <option key={e.id} value={e.id}>
 {e.nome_fantasia || e.razao_social}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Status */}
 <div className="pt-2">
 <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 ">
 <input
 type="checkbox"
 checked={status === 'ativo'}
 onChange={(e) => setStatus(e.target.checked ? 'ativo' : 'inativo')}
 className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
 />
 <span>Usuário Ativo</span>
 </label>
 </div>

 {/* Botões */}
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ">
 <button
 type="button"
 onClick={() => setModalAberto(false)}
 className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
 >
 <Check className="w-3.5 h-3.5" />
 <span>{usuarioEditando ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Modal Redefinir Senha */}
 {modalSenhaAberto && usuarioRedefinir && (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-sm w-full p-6 transition-colors">
 <h3 className="text-sm font-bold text-slate-900 mb-1">
 Redefinir Senha
 </h3>
 <p className="text-xs text-slate-500 mb-4">
 Usuário: <b className="text-slate-800 ">{usuarioRedefinir.nome}</b> ({usuarioRedefinir.login})
 </p>

 {erroForm && (
 <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
 {erroForm}
 </div>
 )}

 <form onSubmit={handleSalvarRedefinirSenha} className="space-y-3">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nova Senha
 </label>
 <input
 type="password"
 required
 value={novaSenha}
 onChange={(e) => setNovaSenha(e.target.value)}
 placeholder="••••••••"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-900 placeholder:text-slate-400 focus:border-slate-800 "
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Confirmar Nova Senha
 </label>
 <input
 type="password"
 required
 value={confirmarNovaSenha}
 onChange={(e) => setConfirmarNovaSenha(e.target.value)}
 placeholder="••••••••"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-900 placeholder:text-slate-400 focus:border-slate-800 "
 />
 </div>

 <div className="flex justify-end gap-2 pt-3">
 <button
 type="button"
 onClick={() => setModalSenhaAberto(false)}
 className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 "
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-colors"
 >
 Salvar Nova Senha
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
