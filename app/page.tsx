'use client';

import React, { useState, useEffect } from 'react';
import { Usuario, Documento } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { LoginView } from '@/components/auth/LoginView';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { EmpresasManagement } from '@/components/admin/EmpresasManagement';
import { UsuariosManagement } from '@/components/admin/UsuariosManagement';
import { EmissoresPermissoes } from '@/components/admin/EmissoresPermissoes';
import { ConfiguracoesView } from '@/components/admin/ConfiguracoesView';
import { EmissorDashboard } from '@/components/emissor/EmissorDashboard';
import { MeusDocumentosView } from '@/components/documents/MeusDocumentosView';
import { NovoReciboModal } from '@/components/documents/NovoReciboModal';
import { NovoRdcModal } from '@/components/documents/NovoRdcModal';
import { DocumentSuccessModal } from '@/components/documents/DocumentSuccessModal';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    if (typeof window === 'undefined') return null;
    StorageService.init();
    return StorageService.getCurrentUser();
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Modais de Criação
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [modalRdcAberto, setModalRdcAberto] = useState(false);

  // Modais de Visualização e Sucesso
  const [docSucesso, setDocSucesso] = useState<Documento | null>(null);
  const [docVisualizando, setDocVisualizando] = useState<Documento | null>(null);

  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  const handleSwitchProfileDemo = (novoPerfil: 'admin' | 'emissor') => {
    const usuarios = StorageService.getUsuarios();
    const target = usuarios.find((u) => u.perfil === novoPerfil);
    if (target) {
      StorageService.setCurrentUser(target);
      setCurrentUser(target);
      setCurrentTab('dashboard');
    }
  };

  const handleEmissaoSucesso = (doc: Documento) => {
    setModalReciboAberto(false);
    setModalRdcAberto(false);
    setDocSucesso(doc);
  };

  const handleImprimirDocumento = (doc: Documento) => {
    setDocVisualizando(doc);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-500 font-medium">Carregando sistema...</div>
      </div>
    );
  }

  // Se não estiver autenticado, exibe a tela de login
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.perfil === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Bar seguindo o Top Bar Contract */}
      <Navbar
        user={currentUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNovoRecibo={() => setModalReciboAberto(true)}
        onOpenNovoRdc={() => setModalRdcAberto(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral com suporte a troca de perfil demonstrativa */}
        <Sidebar
          user={currentUser}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNovoRecibo={() => setModalReciboAberto(true)}
          onOpenNovoRdc={() => setModalRdcAberto(true)}
          onSwitchProfileDemo={handleSwitchProfileDemo}
        />

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {/* Roteamento de Abas */}
          {currentTab === 'dashboard' && (
            isAdmin ? (
              <AdminDashboard
                onSelectTab={setCurrentTab}
                onOpenNovoRecibo={() => setModalReciboAberto(true)}
                onOpenNovoRdc={() => setModalRdcAberto(true)}
                onVisualizarDocumento={(doc) => setDocVisualizando(doc)}
              />
            ) : (
              <EmissorDashboard
                currentUser={currentUser}
                onOpenNovoRecibo={() => setModalReciboAberto(true)}
                onOpenNovoRdc={() => setModalRdcAberto(true)}
                onVisualizarDocumento={(doc) => setDocVisualizando(doc)}
                onVerTodosDocumentos={() => setCurrentTab('meus-documentos')}
              />
            )
          )}

          {currentTab === 'empresas' && isAdmin && (
            <EmpresasManagement currentUser={currentUser} />
          )}

          {currentTab === 'empresas-consulta' && (
            <EmpresasManagement currentUser={currentUser} readOnly />
          )}

          {currentTab === 'usuarios' && isAdmin && (
            <UsuariosManagement currentUser={currentUser} />
          )}

          {currentTab === 'emissores' && isAdmin && (
            <EmissoresPermissoes />
          )}

          {(currentTab === 'documentos' || currentTab === 'meus-documentos') && (
            <MeusDocumentosView
              currentUser={currentUser}
              onVisualizarDocumento={(doc) => setDocVisualizando(doc)}
              onNovoRecibo={() => setModalReciboAberto(true)}
              onNovoRdc={() => setModalRdcAberto(true)}
            />
          )}

          {currentTab === 'configuracoes' && isAdmin && (
            <ConfiguracoesView />
          )}
        </main>
      </div>

      {/* Modal: Novo Recibo */}
      <NovoReciboModal
        isOpen={modalReciboAberto}
        onClose={() => setModalReciboAberto(false)}
        currentUser={currentUser}
        onSuccess={handleEmissaoSucesso}
      />

      {/* Modal: Novo RDC */}
      <NovoRdcModal
        isOpen={modalRdcAberto}
        onClose={() => setModalRdcAberto(false)}
        currentUser={currentUser}
        onSuccess={handleEmissaoSucesso}
      />

      {/* Modal: Confirmação de Sucesso Pós-Emissão */}
      <DocumentSuccessModal
        isOpen={!!docSucesso}
        documento={docSucesso}
        onClose={() => setDocSucesso(null)}
        onVisualizar={(doc) => {
          setDocSucesso(null);
          setDocVisualizando(doc);
        }}
        onImprimir={(doc) => {
          setDocSucesso(null);
          handleImprimirDocumento(doc);
        }}
        onNovoRecibo={() => {
          setDocSucesso(null);
          setModalReciboAberto(true);
        }}
        onNovoRdc={() => {
          setDocSucesso(null);
          setModalRdcAberto(true);
        }}
      />

      {/* Modal: Visualizador e Impressor de Documento */}
      <DocumentViewerModal
        isOpen={!!docVisualizando}
        documento={docVisualizando}
        onClose={() => setDocVisualizando(null)}
      />
    </div>
  );
}
