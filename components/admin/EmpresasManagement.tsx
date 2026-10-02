'use client';

import React, { useState } from 'react';
import { Empresa, TipoEmpresa, StatusEmpresa, Usuario, TipoPessoa } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj, mascaraCpf, mascaraCep, mascaraTelefone, validarCnpj, validarCpf } from '@/lib/masks';
import {
 Building2,
 User,
 Plus,
 Search,
 Edit2,
 Power,
 Trash2,
 CheckCircle2,
 XCircle,
 X,
 Check,
 AlertCircle,
 AlertTriangle,
 Upload,
 Image as ImageIcon,
 ShieldAlert,
} from 'lucide-react';

interface EmpresasManagementProps {
 currentUser: Usuario;
 readOnly?: boolean;
}

export function EmpresasManagement({ currentUser, readOnly = false }: EmpresasManagementProps) {
 const [empresas, setEmpresas] = useState<Empresa[]>(() => StorageService.getEmpresas());
 const [busca, setBusca] = useState('');
 const [filtroTipo, setFiltroTipo] = useState<string>('todos');
 const [filtroTipoPessoa, setFiltroTipoPessoa] = useState<string>('todos');
 const [filtroStatus, setFiltroStatus] = useState<string>('todos');

 // Modal de Criação / Edição
 const [modalAberto, setModalAberto] = useState(false);
 const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);

 // Modal de Exclusão de Empresa
 const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
 const [empresaParaExcluir, setEmpresaParaExcluir] = useState<Empresa | null>(null);
 const [vinculosExclusao, setVinculosExclusao] = useState<{
 podeExcluirFisicamente: boolean;
 totalDocumentos: number;
 totalUsuarios: number;
 detalhes: string[];
 } | null>(null);

 // Feedback de Operação (Sucesso / Info / Erro)
 const [feedback, setFeedback] = useState<{
 tipo: 'sucesso' | 'info' | 'erro';
 mensagem: string;
 } | null>(null);

 // Campos do formulário
 const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PJ');
 const [razaoSocial, setRazaoSocial] = useState('');
 const [nomeFantasia, setNomeFantasia] = useState('');
 const [cnpj, setCnpj] = useState('');
 const [rg, setRg] = useState('');
 const [inscricaoEstadual, setInscricaoEstadual] = useState('');
 const [inscricaoMunicipal, setInscricaoMunicipal] = useState('');
 const [endereco, setEndereco] = useState('');
 const [numero, setNumero] = useState('');
 const [complemento, setComplemento] = useState('');
 const [bairro, setBairro] = useState('');
 const [cidade, setCidade] = useState('');
 const [uf, setUf] = useState('DF');
 const [cep, setCep] = useState('');
 const [email, setEmail] = useState('');
 const [telefone, setTelefone] = useState('');
 const [tipo, setTipo] = useState<TipoEmpresa>('ambas');
 const [status, setStatus] = useState<StatusEmpresa>('ativa');
 const [logoUrl, setLogoUrl] = useState<string>('');
 const [erroForm, setErroForm] = useState<string | null>(null);

 const recarregarEmpresas = () => {
 setEmpresas(StorageService.getEmpresas());
 };

 const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (file.size > 2 * 1024 * 1024) {
 setErroForm('A imagem da logo deve ter no máximo 2MB.');
 return;
 }

 const reader = new FileReader();
 reader.onload = (event) => {
 const result = event.target?.result as string;
 if (result) {
 setLogoUrl(result);
 }
 };
 reader.readAsDataURL(file);
 };

 const abrirNovo = () => {
 setEmpresaEditando(null);
 setTipoPessoa('PJ');
 setRazaoSocial('');
 setNomeFantasia('');
 setCnpj('');
 setRg('');
 setInscricaoEstadual('');
 setInscricaoMunicipal('');
 setEndereco('');
 setNumero('');
 setComplemento('');
 setBairro('');
 setCidade('Brasília');
 setUf('DF');
 setCep('');
 setEmail('');
 setTelefone('');
 setTipo('ambas');
 setStatus('ativa');
 setLogoUrl('');
 setErroForm(null);
 setModalAberto(true);
 };

 const abrirEdicao = (emp: Empresa) => {
 setEmpresaEditando(emp);
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;
 setTipoPessoa(isPf ? 'PF' : 'PJ');
 setRazaoSocial(emp.razao_social);
 setNomeFantasia(emp.nome_fantasia || '');
 setCnpj(isPf ? mascaraCpf(emp.cnpj) : mascaraCnpj(emp.cnpj));
 setRg(emp.rg || '');
 setInscricaoEstadual(emp.inscricao_estadual || '');
 setInscricaoMunicipal(emp.inscricao_municipal || '');
 setEndereco(emp.endereco);
 setNumero(emp.numero);
 setComplemento(emp.complemento || '');
 setBairro(emp.bairro);
 setCidade(emp.cidade);
 setUf(emp.uf);
 setCep(emp.cep);
 setEmail(emp.email || '');
 setTelefone(emp.telefone || '');
 setTipo(emp.tipo);
 setStatus(emp.status);
 setLogoUrl(emp.logo_url || '');
 setErroForm(null);
 setModalAberto(true);
 };

 const handleSalvar = (e: React.FormEvent) => {
 e.preventDefault();
 setErroForm(null);

 const docLimpo = cnpj.replace(/\D/g, '');

 if (tipoPessoa === 'PF') {
 if (!razaoSocial.trim()) {
 setErroForm('O Nome Completo da pessoa física é obrigatório.');
 return;
 }
 if (!validarCpf(docLimpo)) {
 setErroForm('Informe um CPF válido com 11 dígitos e dígitos verificadores corretos.');
 return;
 }
 const docJaExiste = empresas.some(
 (emp) => emp.cnpj.replace(/\D/g, '') === docLimpo && (!empresaEditando || emp.id !== empresaEditando.id)
 );
 if (docJaExiste) {
 setErroForm('O CPF informado já está cadastrado para outro registro.');
 return;
 }
 } else {
 if (!razaoSocial.trim()) {
 setErroForm('A Razão Social da empresa é obrigatória.');
 return;
 }
 if (!validarCnpj(docLimpo)) {
 setErroForm('Informe um CNPJ válido com 14 dígitos e dígitos verificadores corretos.');
 return;
 }
 const docJaExiste = empresas.some(
 (emp) => emp.cnpj.replace(/\D/g, '') === docLimpo && (!empresaEditando || emp.id !== empresaEditando.id)
 );
 if (docJaExiste) {
 setErroForm('O CNPJ informado já está cadastrado para outra empresa.');
 return;
 }
 }

 if (!endereco.trim() || !numero.trim() || !cidade.trim() || !uf.trim()) {
 setErroForm('Informe os dados de endereço obrigatórios (Endereço, Número, Cidade e UF).');
 return;
 }

 const novaEmpresa: Empresa = {
 id: empresaEditando ? empresaEditando.id : `emp-${Date.now()}`,
 tipo_pessoa: tipoPessoa,
 razao_social: razaoSocial.trim(),
 nome_fantasia: nomeFantasia.trim() || razaoSocial.trim(),
 cnpj: tipoPessoa === 'PF' ? mascaraCpf(cnpj) : mascaraCnpj(cnpj),
 cpf: tipoPessoa === 'PF' ? mascaraCpf(cnpj) : undefined,
 rg: tipoPessoa === 'PF' ? rg.trim() || undefined : undefined,
 inscricao_estadual: inscricaoEstadual.trim() || undefined,
 inscricao_municipal: inscricaoMunicipal.trim() || undefined,
 endereco: endereco.trim(),
 numero: numero.trim(),
 complemento: complemento.trim() || undefined,
 bairro: bairro.trim() || 'Centro',
 cidade: cidade.trim(),
 uf: uf.trim().toUpperCase(),
 cep: mascaraCep(cep) || '70000-000',
 email: email.trim() || undefined,
 telefone: mascaraTelefone(telefone) || undefined,
 tipo,
 status,
 logo_url: logoUrl.trim() || undefined,
 created_at: empresaEditando ? empresaEditando.created_at : new Date().toISOString(),
 };

 StorageService.saveEmpresa(novaEmpresa);
 recarregarEmpresas();
 setModalAberto(false);
 setFeedback({
 tipo: 'sucesso',
 mensagem: `${tipoPessoa === 'PF' ? 'Pessoa Física' : 'Empresa'} "${novaEmpresa.razao_social}" salva com sucesso!`,
 });
 setTimeout(() => setFeedback(null), 5000);
 };

 const handleAlternarStatus = (emp: Empresa) => {
 const novoStatus: StatusEmpresa = emp.status === 'ativa' ? 'inativa' : 'ativa';
 StorageService.saveEmpresa({ ...emp, status: novoStatus });
 recarregarEmpresas();
 setFeedback({
 tipo: 'info',
 mensagem: `Empresa "${emp.razao_social}" alterada para status ${novoStatus.toUpperCase()}.`,
 });
 setTimeout(() => setFeedback(null), 4000);
 };

 // Exclusão de Empresa com verificação de vínculos
 const handleSolicitarExclusao = (emp: Empresa) => {
 const vinculos = StorageService.verificarVinculosEmpresa(emp.id);
 setVinculosExclusao(vinculos);
 setEmpresaParaExcluir(emp);
 setModalExcluirAberto(true);
 };

 const handleConfirmarExclusao = () => {
 if (!empresaParaExcluir) return;
 const res = StorageService.excluirEmpresa(empresaParaExcluir.id);
 recarregarEmpresas();
 setModalExcluirAberto(false);
 setEmpresaParaExcluir(null);
 setFeedback({
 tipo: res.tipo === 'fisica' ? 'sucesso' : 'info',
 mensagem: res.mensagem,
 });
 setTimeout(() => setFeedback(null), 7000);
 };

 // Filtragem (ocultando empresas excluídas logicamente a menos que busquem pelo status)
 const empresasFiltradas = empresas.filter((emp) => {
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;
 if (filtroTipoPessoa === 'PJ' && isPf) return false;
 if (filtroTipoPessoa === 'PF' && !isPf) return false;
 if (filtroTipo !== 'todos' && emp.tipo !== filtroTipo && emp.tipo !== 'ambas') {
 return false;
 }
 if (filtroStatus !== 'todos' && emp.status !== filtroStatus) {
 return false;
 }
 if (busca.trim()) {
 const q = busca.toLowerCase();
 const razao = emp.razao_social.toLowerCase().includes(q);
 const fantasia = emp.nome_fantasia?.toLowerCase().includes(q) || false;
 const cnpjMatch = emp.cnpj.includes(q);
 const cpfMatch = emp.cpf ? emp.cpf.includes(q) : false;
 const cidadeMatch = emp.cidade.toLowerCase().includes(q);
 return razao || fantasia || cnpjMatch || cpfMatch || cidadeMatch;
 }
 return true;
 });

 return (
 <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
 {/* Top Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-slate-900 ">
 {readOnly ? 'Consulta de Empresas e Pessoas Físicas' : 'Cadastro de Empresas e Pessoas Físicas'}
 </h1>
 <p className="text-xs text-slate-500 mt-1">
 {readOnly
 ? 'Consulte as pessoas jurídicas (CNPJ) e pessoas físicas (CPF) autorizadas para emissão e cobrança'
 : 'Gerencie as entidades emissoras e destinatárias (PJ com CNPJ ou PF com CPF) disponíveis no sistema'}
 </p>
 </div>

 {!readOnly && (
 <button
 onClick={abrirNovo}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Cadastrar Empresa / PF</span>
 </button>
 )}
 </div>

 {/* Banner de Feedback */}
 {feedback && (
 <div
 className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs ${
 feedback.tipo === 'sucesso'
 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 '
 : feedback.tipo === 'info'
 ? 'bg-blue-50 border-blue-200 text-blue-800 '
 : 'bg-red-50 border-red-200 text-red-800 '
 }`}
 >
 <div className="flex items-center gap-2">
 {feedback.tipo === 'sucesso' ? (
 <Check className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : feedback.tipo === 'info' ? (
 <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
 )}
 <span className="font-medium">{feedback.mensagem}</span>
 </div>
 <button
 onClick={() => setFeedback(null)}
 className="text-slate-400 hover:text-slate-600 p-1"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Barra de Filtros */}
 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 transition-colors">
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
 <div className="md:col-span-2">
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Buscar registro
 </label>
 <div className="relative">
 <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 " />
 <input
 type="text"
 value={busca}
 onChange={(e) => setBusca(e.target.value)}
 placeholder="Razão social, nome, CNPJ, CPF ou cidade..."
 className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Tipo de Pessoa
 </label>
 <select
 value={filtroTipoPessoa}
 onChange={(e) => setFiltroTipoPessoa(e.target.value)}
 className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="todos">Todos (PJ e PF)</option>
 <option value="PJ">Pessoa Jurídica (CNPJ)</option>
 <option value="PF">Pessoa Física (CPF)</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Classificação
 </label>
 <select
 value={filtroTipo}
 onChange={(e) => setFiltroTipo(e.target.value)}
 className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="todos">Todas as funções</option>
 <option value="emissora">Emissora (Quem recebe)</option>
 <option value="destinataria">Destinatária (Quem paga)</option>
 <option value="ambas">Ambas as funções</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-700 mb-1">
 Status
 </label>
 <select
 value={filtroStatus}
 onChange={(e) => setFiltroStatus(e.target.value)}
 className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
 >
 <option value="todos">Todos os status</option>
 <option value="ativa">Somente Ativas</option>
 <option value="inativa">Somente Inativas</option>
 </select>
 </div>
 </div>

 <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
 <span>{empresasFiltradas.length} registro(s) encontrado(s)</span>
 {(busca || filtroTipo !== 'todos' || filtroTipoPessoa !== 'todos' || filtroStatus !== 'todos') && (
 <button
 onClick={() => {
 setBusca('');
 setFiltroTipo('todos');
 setFiltroTipoPessoa('todos');
 setFiltroStatus('todos');
 }}
 className="text-slate-700 hover:underline font-medium"
 >
 Limpar filtros
 </button>
 )}
 </div>
 </div>

 {/* Tabela de Empresas */}
 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors">
 {empresasFiltradas.length === 0 ? (
 <div className="p-12 text-center text-xs text-slate-500 ">
 Nenhum registro encontrado com os critérios pesquisados.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
 <tr>
 <th className="px-4 py-3">Razão Social / Nome Completo</th>
 <th className="px-4 py-3">Documento (CNPJ / CPF)</th>
 <th className="px-4 py-3">Cidade / UF</th>
 <th className="px-4 py-3">Tipo</th>
 <th className="px-4 py-3 text-center">Status</th>
 {!readOnly && <th className="px-4 py-3 text-center">Ações</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {empresasFiltradas.map((emp) => {
 const isAtiva = emp.status === 'ativa';
 const isPf = emp.tipo_pessoa === 'PF' || emp.cnpj.replace(/\D/g, '').length === 11;

 return (
 <tr
 key={emp.id}
 className={`hover:bg-slate-50 transition-colors ${
 !isAtiva ? 'opacity-60 bg-slate-50/50 ' : ''
 }`}
 >
 <td className="px-4 py-3 max-w-[280px]">
 <div className="flex items-center gap-2.5">
 {emp.logo_url ? (
 <img
 src={emp.logo_url}
 alt={emp.nome_fantasia || emp.razao_social}
 className="w-8 h-8 rounded border border-slate-200 object-contain bg-white shrink-0 p-0.5"
 />
 ) : (
 <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
 {isPf ? (
 <User className="w-4 h-4 text-purple-600 " />
 ) : (
 <Building2 className="w-4 h-4 text-blue-600 " />
 )}
 </div>
 )}
 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 <span
 className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
 isPf
 ? 'bg-purple-100 text-purple-800 '
 : 'bg-blue-100 text-blue-800 '
 }`}
 >
 {isPf ? 'PF' : 'PJ'}
 </span>
 <span className="font-semibold text-slate-900 truncate">
 {emp.razao_social}
 </span>
 </div>
 {emp.nome_fantasia && emp.nome_fantasia !== emp.razao_social && (
 <div className="text-[11px] text-slate-500 truncate mt-0.5">
 {isPf ? 'Apelido/Nome Social: ' : 'Fantasia: '}
 {emp.nome_fantasia}
 </div>
 )}
 </div>
 </div>
 </td>
 <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap">
 <div className="flex flex-col">
 <span className="font-medium">
 {isPf ? mascaraCpf(emp.cnpj) : mascaraCnpj(emp.cnpj)}
 </span>
 {isPf && emp.rg && (
 <span className="text-[10px] text-slate-400 font-sans">
 RG: {emp.rg}
 </span>
 )}
 </div>
 </td>
 <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
 {emp.cidade}/{emp.uf}
 </td>
 <td className="px-4 py-3 whitespace-nowrap">
 <span className="capitalize text-slate-700 font-medium">
 {emp.tipo === 'ambas'
 ? 'Emissora / Destinatária'
 : emp.tipo === 'emissora'
 ? 'Emissora'
 : 'Destinatária'}
 </span>
 </td>
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <span
 className={`text-[10px] font-medium px-2 py-0.5 rounded ${
 isAtiva
 ? 'bg-emerald-50 text-emerald-700 '
 : 'bg-slate-100 text-slate-500 '
 }`}
 >
 {isAtiva ? 'Ativa' : 'Inativa'}
 </span>
 </td>
 {!readOnly && (
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1">
 <button
 onClick={() => abrirEdicao(emp)}
 className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
 title="Editar empresa"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleAlternarStatus(emp)}
 className={`p-1 rounded transition-colors ${
 isAtiva
 ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 '
 : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 '
 }`}
 title={isAtiva ? 'Inativar empresa' : 'Ativar empresa'}
 >
 <Power className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleSolicitarExclusao(emp)}
 className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
 title="Excluir empresa"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Modal de Confirmação de Exclusão de Empresa */}
 {modalExcluirAberto && empresaParaExcluir && vinculosExclusao && (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-red-50/50 ">
 <div className="flex items-center gap-2">
 <ShieldAlert className="w-5 h-5 text-red-600 " />
 <h2 className="text-sm font-bold text-red-900 ">
 CONFIRMAR EXCLUSÃO DE EMPRESA
 </h2>
 </div>
 <button
 onClick={() => setModalExcluirAberto(false)}
 className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-4">
 <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
 <div className="font-bold text-slate-900 ">
 {empresaParaExcluir.razao_social}
 </div>
 {empresaParaExcluir.nome_fantasia && (
 <div className="text-slate-600 ">
 Fantasia: {empresaParaExcluir.nome_fantasia}
 </div>
 )}
 <div className="text-slate-500 font-mono">
 CNPJ: {empresaParaExcluir.cnpj}
 </div>
 </div>

 {vinculosExclusao.podeExcluirFisicamente ? (
 <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
 <div className="font-bold flex items-center gap-1.5">
 <Check className="w-4 h-4 text-emerald-600 " />
 <span>Nenhum documento ou histórico contábil vinculado</span>
 </div>
 <p className="text-[11px] text-emerald-700/90 ">
 Esta empresa não possui nenhum recibo ou RDC emitido no sistema. Ela será excluída fisicamente de forma definitiva.
 </p>
 </div>
 ) : (
 <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
 <div className="font-bold flex items-center gap-1.5 text-amber-900 ">
 <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
 <span>Vínculo com Documentos e Histórico Fiscal Detectado</span>
 </div>
 <div className="text-[11px] text-amber-800 leading-relaxed">
 Esta empresa possui <b>{vinculosExclusao.totalDocumentos} documento(s) fiscal(is)</b> emitido(s). Para preservar a validade jurídica, contábil e a integridade de auditoria dos recibos históricos, <b>a exclusão será realizada de forma lógica</b> (inativação definitiva). Ela deixará de aparecer em novas seleções de emissão, mas todo o histórico existente continuará 100% preservado.
 </div>
 {vinculosExclusao.detalhes.length > 0 && (
 <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5">
 {vinculosExclusao.detalhes.map((d, i) => (
 <li key={i}>{d}</li>
 ))}
 </ul>
 )}
 </div>
 )}

 <p className="text-xs text-slate-600 ">
 Tem certeza de que deseja prosseguir com a exclusão da empresa?
 </p>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ">
 <button
 type="button"
 onClick={() => setModalExcluirAberto(false)}
 className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleConfirmarExclusao}
 className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>
 {vinculosExclusao.podeExcluirFisicamente
 ? 'Confirmar Exclusão Definitiva'
 : 'Inativar e Ocultar do Sistema'}
 </span>
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Modal de Cadastro / Edição de Empresa */}
 {modalAberto && (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
 <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden transition-colors">
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 ">
 <div className="flex items-center gap-2">
 {tipoPessoa === 'PF' ? (
 <User className="w-5 h-5 text-purple-600 " />
 ) : (
 <Building2 className="w-5 h-5 text-blue-600 " />
 )}
 <h2 className="text-sm font-bold text-slate-900 ">
 {empresaEditando
 ? tipoPessoa === 'PF'
 ? 'EDITAR PESSOA FÍSICA'
 : 'EDITAR EMPRESA'
 : 'CADASTRO DE EMPRESA / PESSOA FÍSICA'}
 </h2>
 </div>
 <button
 onClick={() => setModalAberto(false)}
 className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSalvar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
 {erroForm && (
 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{erroForm}</span>
 </div>
 )}

 {/* Seletor Tipo de Pessoa: PJ ou PF */}
 <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1.5 border border-slate-200 ">
 <button
 type="button"
 onClick={() => {
 setTipoPessoa('PJ');
 if (cnpj) setCnpj(mascaraCnpj(cnpj));
 }}
 className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
 tipoPessoa === 'PJ'
 ? 'bg-white text-blue-600 shadow-xs'
 : 'text-slate-600 hover:text-slate-900 '
 }`}
 >
 <Building2 className="w-4 h-4" />
 <span>Pessoa Jurídica (CNPJ)</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setTipoPessoa('PF');
 if (cnpj) setCnpj(mascaraCpf(cnpj));
 }}
 className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
 tipoPessoa === 'PF'
 ? 'bg-white text-purple-600 shadow-xs'
 : 'text-slate-600 hover:text-slate-900 '
 }`}
 >
 <User className="w-4 h-4" />
 <span>Pessoa Física (CPF)</span>
 </button>
 </div>

 {/* Nome Principal e Nome Secundário */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 {tipoPessoa === 'PF' ? 'Nome Completo do Titular *' : 'Razão Social *'}
 </label>
 <input
 type="text"
 required
 value={razaoSocial}
 onChange={(e) => setRazaoSocial(e.target.value)}
 placeholder={
 tipoPessoa === 'PF'
 ? 'Ex: João Carlos da Silva'
 : 'Ex: Exemplo Serviços Empresariais Ltda'
 }
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 {tipoPessoa === 'PF' ? 'Apelido / Nome Usual (Opcional)' : 'Nome Fantasia'}
 </label>
 <input
 type="text"
 value={nomeFantasia}
 onChange={(e) => setNomeFantasia(e.target.value)}
 placeholder={
 tipoPessoa === 'PF'
 ? 'Ex: Dr. João Silva ou Consultor João'
 : 'Ex: Exemplo Serviços'
 }
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 {/* Documento (CNPJ/CPF), Inscrições/RG */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 {tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}
 </label>
 <input
 type="text"
 required
 value={cnpj}
 onChange={(e) =>
 setCnpj(
 tipoPessoa === 'PF'
 ? mascaraCpf(e.target.value)
 : mascaraCnpj(e.target.value)
 )
 }
 placeholder={tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 {tipoPessoa === 'PF' ? 'RG (Opcional)' : 'Inscrição Estadual'}
 </label>
 <input
 type="text"
 value={tipoPessoa === 'PF' ? rg : inscricaoEstadual}
 onChange={(e) =>
 tipoPessoa === 'PF'
 ? setRg(e.target.value)
 : setInscricaoEstadual(e.target.value)
 }
 placeholder={
 tipoPessoa === 'PF'
 ? 'Ex: SSP/DF 1.234.567'
 : 'Ex: ISENTO ou 112.334...'
 }
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 {tipoPessoa === 'PF' ? 'Registro / PIS (Opcional)' : 'Inscrição Municipal'}
 </label>
 <input
 type="text"
 value={inscricaoMunicipal}
 onChange={(e) => setInscricaoMunicipal(e.target.value)}
 placeholder={
 tipoPessoa === 'PF'
 ? 'Ex: CRM, CRC, PIS...'
 : 'Ex: 123.456-7'
 }
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 {/* Endereço, Número, Complemento */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Endereço *
 </label>
 <input
 type="text"
 required
 value={endereco}
 onChange={(e) => setEndereco(e.target.value)}
 placeholder="Ex: SBS Quadra 02 Lote 15"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Número *
 </label>
 <input
 type="text"
 required
 value={numero}
 onChange={(e) => setNumero(e.target.value)}
 placeholder="Ex: S/N ou 402"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Complemento
 </label>
 <input
 type="text"
 value={complemento}
 onChange={(e) => setComplemento(e.target.value)}
 placeholder="Ex: Sala 601 Bloco A"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>
 </div>

 {/* Bairro, Cidade, UF, CEP */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Bairro *
 </label>
 <input
 type="text"
 required
 value={bairro}
 onChange={(e) => setBairro(e.target.value)}
 placeholder="Ex: Asa Sul"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Cidade *
 </label>
 <input
 type="text"
 required
 value={cidade}
 onChange={(e) => setCidade(e.target.value)}
 placeholder="Ex: Brasília"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 UF *
 </label>
 <input
 type="text"
 required
 maxLength={2}
 value={uf}
 onChange={(e) => setUf(e.target.value.toUpperCase())}
 placeholder="DF"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none uppercase font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 CEP *
 </label>
 <input
 type="text"
 required
 value={cep}
 onChange={(e) => setCep(mascaraCep(e.target.value))}
 placeholder="70070-120"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>
 </div>

 {/* Email e Telefone */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 E-mail Corporativo
 </label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="financeiro@empresa.com.br"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Telefone de Contato
 </label>
 <input
 type="text"
 value={telefone}
 onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
 placeholder="(61) 3321-0000"
 className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 outline-none font-mono"
 />
 </div>
 </div>

 {/* Logotipo da Empresa */}
 <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <label className="block text-xs font-semibold text-slate-700 ">
 Logotipo da Empresa (Opcional)
 </label>
 <p className="text-[11px] text-slate-500 ">
 Exibido no cabeçalho dos recibos emitidos por esta empresa.
 </p>
 </div>
 {logoUrl && (
 <button
 type="button"
 onClick={() => setLogoUrl('')}
 className="text-xs text-red-600 hover:underline font-medium"
 >
 Remover Logo
 </button>
 )}
 </div>

 <div className="flex flex-col sm:flex-row items-center gap-4">
 <div className="flex-1 w-full">
 <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-4 cursor-pointer bg-white transition-colors">
 <Upload className="w-5 h-5 text-slate-400 mb-1" />
 <span className="text-xs font-semibold text-slate-700 ">
 Clique para selecionar arquivo de imagem
 </span>
 <span className="text-[10px] text-slate-400 mt-0.5">
 PNG, JPG ou SVG até 2MB
 </span>
 <input
 type="file"
 accept="image/*"
 onChange={handleLogoUpload}
 className="hidden"
 />
 </label>
 </div>

 <div className="w-28 h-20 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2 shrink-0">
 {logoUrl ? (
 <div className="relative w-full h-full flex items-center justify-center">
 <img
 src={logoUrl}
 alt="Prévia do logotipo"
 className="max-h-full max-w-full object-contain"
 />
 </div>
 ) : (
 <div className="text-center text-slate-400 ">
 <ImageIcon className="w-6 h-6 mx-auto mb-1 stroke-1" />
 <span className="text-[10px]">Sem logo</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Tipo de Empresa e Status */}
 <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Tipo de Empresa *
 </label>
 <select
 value={tipo}
 onChange={(e) => setTipo(e.target.value as TipoEmpresa)}
 className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-slate-800 outline-none"
 >
 <option value="ambas">Ambas (Emissora e Destinatária)</option>
 <option value="emissora">Emissora (Apenas quem recebe)</option>
 <option value="destinataria">Destinatária (Apenas quem paga)</option>
 </select>
 <p className="text-[11px] text-slate-500 mt-1">
 Define em quais campos de documento a empresa poderá ser selecionada.
 </p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Status da Empresa
 </label>
 <div className="flex items-center gap-3 pt-2">
 <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 ">
 <input
 type="checkbox"
 checked={status === 'ativa'}
 onChange={(e) => setStatus(e.target.checked ? 'ativa' : 'inativa')}
 className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
 />
 <span>Empresa Ativa</span>
 </label>
 </div>
 <p className="text-[11px] text-slate-500 mt-1">
 Empresas inativas não aparecem para novas emissões.
 </p>
 </div>
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
 <span>SALVAR EMPRESA</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
