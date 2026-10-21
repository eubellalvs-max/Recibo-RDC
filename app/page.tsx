'use client';

import React, { useState } from 'react';
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
import { RecibosMedicosView } from '@/components/documents/RecibosMedicosView';
import { NovoReciboModal } from '@/components/documents/NovoReciboModal';
import { NovoRdcModal } from '@/components/documents/NovoRdcModal';
import { NovoReciboMedicoModal } from '@/components/documents/NovoReciboMedicoModal';
import { DocumentSuccessModal } from '@/components/documents/DocumentSuccessModal';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';
import { PrintProvider } from '@/lib/printContext';
import { PrintLayoutArea } from '@/components/documents/unified/PrintLayoutArea';

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

 // Modais de Criação e Edição
 const [modalReciboAberto, setModalReciboAberto] = useState(false);
 const [modalRdcAberto, setModalRdcAberto] = useState(false);
 const [modalReciboMedicoAberto, setModalReciboMedicoAberto] = useState(false);
 const [reciboMedicoInitialData, setReciboMedicoInitialData] = useState<any>(undefined);
 const [documentoEmEdicao, setDocumentoEmEdicao] = useState<Documento | null>(null);

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

 const handleAbrirNovoRecibo = () => {
 setDocumentoEmEdicao(null);
 setModalReciboAberto(true);
 };

 const handleAbrirNovoRdc = () => {
 setDocumentoEmEdicao(null);
 setModalRdcAberto(true);
 };

 const handleAbrirNovoReciboMedico = (initialData?: any) => {
 setDocumentoEmEdicao(null);
 setReciboMedicoInitialData(initialData);
 setModalReciboMedicoAberto(true);
 };

 const handleEditarDocumento = (doc: Documento) => {
 setDocVisualizando(null);
 setDocSucesso(null);
 setDocumentoEmEdicao(doc);

 if (doc.tipo === 'recibo') {
 setModalReciboAberto(true);
 } else if (doc.tipo === 'recibo_medico') {
 setModalReciboMedicoAberto(true);
 } else if (doc.tipo === 'rdc') {
 setModalRdcAberto(true);
 }
 };

 const handleEmissaoSucesso = (doc: Documento) => {
 setModalReciboAberto(false);
 setModalRdcAberto(false);
 setModalReciboMedicoAberto(false);
 setDocumentoEmEdicao(null);
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

 const handleSelectTab = (tab: string) => {
 if (!isAdmin && ['usuarios', 'emissores', 'configuracoes'].includes(tab)) {
 setCurrentTab('dashboard');
 return;
 }
 setCurrentTab(tab);
 };

 return (
 <PrintProvider>
 <div id="system-app-root" className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 transition-colors">
 {/* Top Bar seguindo o Top Bar Contract */}
 <Navbar
 user={currentUser}
 currentTab={currentTab}
 onSelectTab={handleSelectTab}
 onOpenNovoRecibo={handleAbrirNovoRecibo}
 onOpenNovoRdc={handleAbrirNovoRdc}
 onOpenNovoReciboMedico={handleAbrirNovoReciboMedico}
 onLogout={handleLogout}
 />

 <div className="flex-1 flex overflow-hidden no-print">
 {/* Barra Lateral com navegação estrita por perfil */}
 <Sidebar
 user={currentUser}
 currentTab={currentTab}
 onSelectTab={handleSelectTab}
 onOpenNovoRecibo={handleAbrirNovoRecibo}
 onOpenNovoRdc={handleAbrirNovoRdc}
 onOpenNovoReciboMedico={handleAbrirNovoReciboMedico}
 />

 {/* Área de Conteúdo Principal */}
 <main className="dashboard flex-1 overflow-y-auto bg-slate-50 transition-colors no-print">
 {/* Roteamento de Abas */}
 {currentTab === 'dashboard' && (
 isAdmin ? (
 <AdminDashboard
 onSelectTab={setCurrentTab}
 onOpenNovoRecibo={handleAbrirNovoRecibo}
 onOpenNovoRdc={handleAbrirNovoRdc}
 onOpenNovoReciboMedico={handleAbrirNovoReciboMedico}
 onVisualizarDocumento={(doc) => setDocVisualizando(doc)}
 onEditarDocumento={handleEditarDocumento}
 />
 ) : (
 <EmissorDashboard
 currentUser={currentUser}
 onOpenNovoRecibo={handleAbrirNovoRecibo}
 onOpenNovoRdc={handleAbrirNovoRdc}
 onOpenNovoReciboMedico={handleAbrirNovoReciboMedico}
 onVisualizarDocumento={(doc) => setDocVisualizando(doc)}
 onEditarDocumento={handleEditarDocumento}
 onVerTodosDocumentos={() => setCurrentTab('meus-documentos')}
 onIrParaEmpresas={() => setCurrentTab('empresas')}
 />
 )
 )}

 {currentTab === 'recibos-medicos' && (
 <RecibosMedicosView
 currentUser={currentUser}
 onVisualizar={(doc) => setDocVisualizando(doc)}
 onEditar={handleEditarDocumento}
 onNovoReciboMedico={handleAbrirNovoReciboMedico}
 />
 )}

 {currentTab === 'empresas' && (
 <EmpresasManagement currentUser={currentUser} />
 )}

 {currentTab === 'empresas-consulta' && (
 <EmpresasManagement currentUser={currentUser} />
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
 onEditarDocumento={handleEditarDocumento}
 onNovoRecibo={handleAbrirNovoRecibo}
 onNovoRdc={handleAbrirNovoRdc}
 onNovoReciboMedico={handleAbrirNovoReciboMedico}
 />
 )}

 {currentTab === 'configuracoes' && isAdmin && (
 <ConfiguracoesView />
 )}
 </main>
 </div>

 {/* Modal: Novo Recibo ou Edição */}
 {modalReciboAberto && (
 <NovoReciboModal
 isOpen={modalReciboAberto}
 onClose={() => {
 setModalReciboAberto(false);
 setDocumentoEmEdicao(null);
 }}
 currentUser={currentUser}
 onSuccess={handleEmissaoSucesso}
 documentoEmEdicao={documentoEmEdicao}
 />
 )}

 {/* Modal: Novo RDC ou Edição */}
 {modalRdcAberto && (
 <NovoRdcModal
 isOpen={modalRdcAberto}
 onClose={() => {
 setModalRdcAberto(false);
 setDocumentoEmEdicao(null);
 }}
 currentUser={currentUser}
 onSuccess={handleEmissaoSucesso}
 documentoEmEdicao={documentoEmEdicao}
 />
 )}

 {/* Modal: Novo Recibo de Prestação de Serviços Médicos ou Edição */}
 {modalReciboMedicoAberto && (
 <NovoReciboMedicoModal
 isOpen={modalReciboMedicoAberto}
 onClose={() => {
 setModalReciboMedicoAberto(false);
 setReciboMedicoInitialData(undefined);
 setDocumentoEmEdicao(null);
 }}
 currentUser={currentUser}
 onSuccess={handleEmissaoSucesso}
 initialData={reciboMedicoInitialData}
 documentoEmEdicao={documentoEmEdicao}
 />
 )}

 {/* Modal: Confirmação de Sucesso Pós-Emissão ou Edição */}
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
 handleAbrirNovoRecibo();
 }}
 onNovoRdc={() => {
 setDocSucesso(null);
 handleAbrirNovoRdc();
 }}
 onNovoReciboMedico={() => {
 setDocSucesso(null);
 handleAbrirNovoReciboMedico();
 }}
 />

 {/* Modal: Visualizador e Impressor de Documento com Ação de Edição */}
 <DocumentViewerModal
 isOpen={!!docVisualizando}
 documento={docVisualizando}
 onClose={() => setDocVisualizando(null)}
 onEditar={handleEditarDocumento}
 />
 </div>

 {/* ÁREA ESPECÍFICA DE IMPRESSÃO (PRINT LAYOUT INDEPENDENTE) */}
 <PrintLayoutArea />
 </PrintProvider>
 );
}
