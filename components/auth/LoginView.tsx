'use client';

import React, { useState } from 'react';
import { Usuario } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { Lock, User, FileText, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { ThemeToggle } from '@/lib/theme';

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors relative">
      {/* Botão de Alternância de Aparência Clara/Escura */}
      <div className="absolute top-5 right-5">
        <ThemeToggle variant="icon" />
      </div>

      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 shadow-sm transition-colors">
          {/* Logo e Cabeçalho */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border dark:border-slate-700">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              SISTEMA DE RECIBOS & RDC
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Portal Oficial de Emissão e Controle Documental
            </p>
          </div>

          {/* Abas de Seleção de Acesso */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleMudarTipoAcesso('admin')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tipoAcesso === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 ${tipoAcesso === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
              />
              <span>Acesso Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleMudarTipoAcesso('emissor')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tipoAcesso === 'emissor'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User
                className={`w-4 h-4 ${tipoAcesso === 'emissor' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
              />
              <span>Área do Emissor</span>
            </button>
          </div>

          {/* Banner Informativo */}
          <div
            className={`mb-5 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
              tipoAcesso === 'admin'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {tipoAcesso === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
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
              <div className="text-[11px] font-mono mt-1 font-semibold pt-1 border-t border-black/10 dark:border-white/10">
                {tipoAcesso === 'admin'
                  ? 'Usuário padrão: admin | Senha: 123'
                  : 'Usuário padrão: lucas ou mariana | Senha: 123'}
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Usuário / Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={tipoAcesso === 'admin' ? 'admin' : 'Ex: lucas ou mariana'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-slate-800 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-slate-800 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>Senha padrão: 123 ou Mestra: 123456</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>{carregando ? 'ENTRANDO...' : 'ACESSAR O SISTEMA'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setModalEsqueci(true)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-5 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
          <div>Sistema de Emissão e Gestão de Recibos & RDC</div>
          <div className="text-slate-500 dark:text-slate-400">Desenvolvido para conformidade e controle interno</div>
        </div>
      </div>

      {/* Modal Esqueci minha Senha */}
      {modalEsqueci && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Recuperação de Senha</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Para redefinir sua senha, solicite ao <b>Administrador</b> a atualização no menu
              &quot;Cadastro de Usuários&quot; ou utilize a senha de contingência mestra <b>123456</b>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 mb-4 space-y-1 font-mono">
              <div>Admin: admin | Senha: 123</div>
              <div>Emissor: lucas | Senha: 123</div>
              <div>Mestra: 123456</div>
            </div>
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
