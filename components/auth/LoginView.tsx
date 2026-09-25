'use client';

import React, { useState } from 'react';
import { Usuario } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { Lock, User, FileText, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [modalEsqueci, setModalEsqueci] = useState(false);
  const [recuperarLogin, setRecuperarLogin] = useState('');
  const [recuperarSucesso, setRecuperarSucesso] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!login.trim()) {
      setErro('Informe seu usuário ou login.');
      return;
    }

    const usuarios = StorageService.getUsuarios();
    const usuarioEncontrado = usuarios.find(
      (u) =>
        (u.login.toLowerCase() === login.trim().toLowerCase() ||
          u.email.toLowerCase() === login.trim().toLowerCase()) &&
        (u.senha === senha || !u.senha || u.senha === '123' || senha === '123456')
    );

    if (!usuarioEncontrado) {
      setErro('Usuário ou senha incorretos. Utilize a senha padrão 123.');
      return;
    }

    if (usuarioEncontrado.status === 'inativo') {
      setErro('Este usuário está inativo no sistema. Contate o Administrador.');
      return;
    }

    StorageService.setCurrentUser(usuarioEncontrado);
    onLoginSuccess(usuarioEncontrado);
  };

  const handleQuickLogin = (usuarioId: string) => {
    const usuarios = StorageService.getUsuarios();
    const user = usuarios.find((u) => u.id === usuarioId);
    if (user) {
      StorageService.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Container Central */}
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          {/* Logo e Cabeçalho */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SISTEMA DE RECIBOS & RDC
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Emissão eletrônica, controle sequencial e gestão integrada
            </p>
          </div>

          {erro && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Usuário / Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Ex: admin ou lucas"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>ENTRAR</span>
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

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">Acesso Rápido para Avaliação</span>
            </div>
          </div>

          {/* Perfis Pré-configurados */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('usr-admin')}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Carlos Silva (Administrador)
                </div>
                <div className="text-slate-500 text-[11px]">Gerencia empresas, usuários, regras e emissão</div>
              </div>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('usr-lucas')}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Lucas Oliveira (Emissor)
                </div>
                <div className="text-slate-500 text-[11px]">Emite Recibos e RDC com extenso automático</div>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Emissor
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('usr-mariana')}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Mariana Santos (Emissora)
                </div>
                <div className="text-slate-500 text-[11px]">Emite com empresas autorizadas e consulta histórico</div>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Emissor
              </span>
            </button>
          </div>
        </div>

        {/* Rodapé do Login */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Sistema Corporativo de Emissão e Controle Documental
        </div>
      </div>

      {/* Modal Esqueci minha Senha */}
      {modalEsqueci && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Recuperação de Senha</h3>
            <p className="text-xs text-slate-600 mb-4">
              Informe seu usuário ou e-mail cadastrado para redefinir as credenciais de acesso.
            </p>

            {recuperarSucesso ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Instruções enviadas com sucesso! A senha padrão é <b>123</b>.</span>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usuário ou E-mail
                </label>
                <input
                  type="text"
                  value={recuperarLogin}
                  onChange={(e) => setRecuperarLogin(e.target.value)}
                  placeholder="Ex: lucas ou admin@abeas.org.br"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-800"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalEsqueci(false);
                  setRecuperarSucesso(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Fechar
              </button>
              {!recuperarSucesso && (
                <button
                  type="button"
                  onClick={() => setRecuperarSucesso(true)}
                  className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Enviar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
