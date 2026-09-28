'use client';

import React, { useState } from 'react';
import { Empresa, TipoEmpresa, StatusEmpresa, Usuario } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { mascaraCnpj, mascaraCep, mascaraTelefone } from '@/lib/masks';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Power,
  CheckCircle2,
  XCircle,
  X,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface EmpresasManagementProps {
  currentUser: Usuario;
  readOnly?: boolean;
}

export function EmpresasManagement({ currentUser, readOnly = false }: EmpresasManagementProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>(() => StorageService.getEmpresas());
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);

  // Campos do formulário
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
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
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
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
    setRazaoSocial(emp.razao_social);
    setNomeFantasia(emp.nome_fantasia || '');
    setCnpj(emp.cnpj);
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

    if (!razaoSocial.trim()) {
      setErroForm('A Razão Social é obrigatória.');
      return;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length < 14) {
      setErroForm('Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!endereco.trim() || !numero.trim() || !cidade.trim() || !uf.trim()) {
      setErroForm('Informe os dados de endereço obrigatórios (Endereço, Número, Cidade e UF).');
      return;
    }

    const novaEmpresa: Empresa = {
      id: empresaEditando ? empresaEditando.id : `emp-${Date.now()}`,
      razao_social: razaoSocial.trim(),
      nome_fantasia: nomeFantasia.trim() || razaoSocial.trim(),
      cnpj: mascaraCnpj(cnpj),
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
  };

  const handleAlternarStatus = (emp: Empresa) => {
    const novoStatus: StatusEmpresa = emp.status === 'ativa' ? 'inativa' : 'ativa';
    StorageService.saveEmpresa({ ...emp, status: novoStatus });
    recarregarEmpresas();
  };

  // Filtragem
  const empresasFiltradas = empresas.filter((emp) => {
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
      const cidadeMatch = emp.cidade.toLowerCase().includes(q);
      return razao || fantasia || cnpjMatch || cidadeMatch;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {readOnly ? 'Consulta de Empresas' : 'Cadastro de Empresas'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {readOnly
              ? 'Consulte as empresas autorizadas para emissão e cobrança de documentos'
              : 'Gerencie as empresas emissoras e destinatárias disponíveis no sistema'}
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={abrirNovo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Empresa</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Buscar empresa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Razão social, nome fantasia, CNPJ ou cidade..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tipo de Empresa
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="emissora">Emissora (Quem recebe)</option>
              <option value="destinataria">Destinatária (Quem paga)</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
          <span>{empresasFiltradas.length} empresa(s) encontrada(s)</span>
          {(busca || filtroTipo !== 'todos' || filtroStatus !== 'todos') && (
            <button
              onClick={() => {
                setBusca('');
                setFiltroTipo('todos');
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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {empresasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Nenhuma empresa encontrada com os critérios pesquisados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Razão Social / Nome Fantasia</th>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Cidade / UF</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  {!readOnly && <th className="px-4 py-3 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empresasFiltradas.map((emp) => {
                  const isAtiva = emp.status === 'ativa';
                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !isAtiva ? 'opacity-60 bg-slate-50/50' : ''
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
                              <Building2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {emp.razao_social}
                            </div>
                            {emp.nome_fantasia && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {emp.nome_fantasia}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                        {emp.cnpj}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
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
                            isAtiva ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isAtiva ? 'Inativar empresa' : 'Ativar empresa'}
                            >
                              <Power className="w-3.5 h-3.5" />
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

      {/* Modal de Cadastro / Edição de Empresa */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {empresaEditando ? 'EDITAR EMPRESA' : 'CADASTRO DE EMPRESA'}
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

              {/* Razão Social e Nome Fantasia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: Exemplo Serviços Empresariais Ltda"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Exemplo Serviços"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* CNPJ, Inscrição Estadual e Municipal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(mascaraCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Ex: ISENTO ou 112.334..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inscrição Municipal
                  </label>
                  <input
                    type="text"
                    value={inscricaoMunicipal}
                    onChange={(e) => setInscricaoMunicipal(e.target.value)}
                    placeholder="Ex: 123.456-7"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
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
                    placeholder="Ex: Av. Paulista ou SCS Quadra 4"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
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
                    placeholder="Ex: 120 ou S/N"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
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
                    placeholder="Ex: Sala 501"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Bairro, Cidade, UF, CEP */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Asa Sul"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    placeholder="DF"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(mascaraCep(e.target.value))}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* E-mail e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                    placeholder="(00) 0000-0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Anexo de Logotipo da Empresa */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-0.5">
                    Logo da Empresa (para Recibos e Documentos)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Anexe o logotipo da empresa para sair impresso automaticamente no cabeçalho dos recibos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-lg cursor-pointer bg-white transition-colors">
                      <Upload className="w-5 h-5 text-slate-500 mb-1" />
                      <span className="text-xs font-semibold text-slate-800">
                        Clique para anexar imagem
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG ou SVG (máx. 2MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="mt-2">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Ou cole o link da imagem (URL):</span>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>

                  {/* Pré-visualização da Logo */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg min-h-[96px]">
                    {logoUrl ? (
                      <div className="relative group flex flex-col items-center">
                        <img
                          src={logoUrl}
                          alt="Pré-visualização do Logo"
                          className="max-h-16 max-w-full object-contain mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[11px] text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover Logo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 stroke-1" />
                        <span className="text-[11px]">Nenhuma logo anexada</span>
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
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
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
                    Empresas inativas não aparecem para novos recibos.
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
