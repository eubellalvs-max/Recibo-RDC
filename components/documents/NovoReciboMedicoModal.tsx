'use client';

import React, { useState } from 'react';
import { Usuario, Documento, DadosReciboMedico } from '@/lib/types';
import { StorageService, ABEAS_FIXA } from '@/lib/storage';
import { valorPorExtenso, dataPorExtenso } from '@/lib/extenso';
import {
  formatarMoeda,
  dataHojeIso,
  mascaraCpf,
  mascaraCnpj,
  mascaraTelefone,
  validarCpf,
  validarCpfOuCnpj,
} from '@/lib/masks';
import {
  X,
  Check,
  AlertCircle,
  Eye,
  HeartPulse,
  User,
  Copy,
  Calendar,
  CreditCard,
  Building,
  Printer,
  Sparkles,
} from 'lucide-react';

interface NovoReciboMedicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onSuccess: (doc: Documento) => void;
  initialData?: Partial<DadosReciboMedico> & { valor?: number };
}

export function NovoReciboMedicoModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  initialData,
}: NovoReciboMedicoModalProps) {
  // Dados do Recibo
  const [numeroReciboAuto] = useState(() => StorageService.getProximoNumeroReciboMedico());
  const [valorStr, setValorStr] = useState(() =>
    initialData?.valor !== undefined
      ? initialData.valor.toFixed(2).replace('.', ',')
      : '350,00'
  );
  const [dataEmissao, setDataEmissao] = useState(() => dataHojeIso());
  const [cidade, setCidade] = useState(() => initialData?.cidade || 'Itapuranga');
  const [uf, setUf] = useState(() => initialData?.uf || 'GO');

  // Dados do Pagador
  const [pagadorNome, setPagadorNome] = useState(() => initialData?.pagador_nome || '');
  const [pagadorDocumento, setPagadorDocumento] = useState(() => initialData?.pagador_documento || '');
  const [pagadorTelefone, setPagadorTelefone] = useState(() => initialData?.pagador_telefone || '');
  const [pagadorEndereco, setPagadorEndereco] = useState(() => initialData?.pagador_endereco || '');

  // Dados do Paciente
  const [pacienteNome, setPacienteNome] = useState(() => initialData?.paciente_nome || '');
  const [pacienteCpf, setPacienteCpf] = useState(() => initialData?.paciente_cpf || '');
  const [pacienteTelefone, setPacienteTelefone] = useState(() => initialData?.paciente_telefone || '');
  const [pacienteEndereco, setPacienteEndereco] = useState(() => initialData?.paciente_endereco || '');

  // Detalhes do Atendimento
  const [servicoPrestado, setServicoPrestado] = useState(
    () => initialData?.servico_prestado || 'Consulta médica em ginecologia'
  );
  const [medicoAssistente, setMedicoAssistente] = useState(
    () => initialData?.medico_assistente || 'Dr(a). Morena Ciclano de Tal'
  );
  const [crm, setCrm] = useState(() => initialData?.crm || '0000/GO');
  const [dataAtendimento, setDataAtendimento] = useState(
    () => initialData?.data_atendimento || dataHojeIso()
  );
  const [formaPagamento, setFormaPagamento] = useState(
    () => initialData?.forma_pagamento || 'Pix'
  );

  // Estado da interface
  const [modoPreVisualizar, setModoPreVisualizar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Cálculo do valor numérico
  const valorNumerico = parseFloat(
    valorStr.replace(/\./g, '').replace(',', '.')
  ) || 0;
  const valorExtenso = valorNumerico > 0 ? valorPorExtenso(valorNumerico) : 'zero reais';

  // Copiar dados do Pagador para o Paciente
  const handleCopiarPagadorParaPaciente = () => {
    setPacienteNome(pagadorNome);
    setPacienteCpf(pagadorDocumento);
    setPacienteTelefone(pagadorTelefone);
    setPacienteEndereco(pagadorEndereco);
  };

  // Formatação do CPF/CNPJ do pagador
  const handlePagadorDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 11) {
      setPagadorDocumento(mascaraCpf(raw));
    } else {
      setPagadorDocumento(mascaraCnpj(raw));
    }
  };

  const handlePacienteCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPacienteCpf(mascaraCpf(raw));
  };

  const handleValidar = (): boolean => {
    if (valorNumerico <= 0) {
      setErro('Informe um valor válido maior que zero.');
      return false;
    }
    if (!pagadorNome.trim()) {
      setErro('Informe o Nome/Razão Social do Pagador.');
      return false;
    }
    if (!pagadorDocumento.trim()) {
      setErro('Informe o CPF/CNPJ do Pagador.');
      return false;
    }
    if (!validarCpfOuCnpj(pagadorDocumento)) {
      setErro('O CPF/CNPJ do Pagador informado é inválido. Verifique os dígitos digitados.');
      return false;
    }
    if (!pacienteNome.trim()) {
      setErro('Informe o Nome do Paciente.');
      return false;
    }
    if (!pacienteCpf.trim()) {
      setErro('Informe o CPF do Paciente.');
      return false;
    }
    if (!validarCpf(pacienteCpf)) {
      setErro('O CPF do Paciente informado é inválido. Verifique os dígitos digitados.');
      return false;
    }
    if (!servicoPrestado.trim()) {
      setErro('Informe o Serviço Prestado.');
      return false;
    }
    if (!medicoAssistente.trim()) {
      setErro('Informe o(a) Médico(a) Assistente.');
      return false;
    }
    if (!crm.trim()) {
      setErro('Informe o CRM do médico.');
      return false;
    }
    if (!dataAtendimento) {
      setErro('Informe a Data do Atendimento.');
      return false;
    }
    return true;
  };

  const handleEmitir = () => {
    if (isSubmitting) return;
    setErro(null);
    if (!handleValidar()) return;

    setIsSubmitting(true);
    try {
      const detalhes: DadosReciboMedico = {
        pagador_nome: pagadorNome.trim(),
        pagador_documento: pagadorDocumento.trim(),
        pagador_telefone: pagadorTelefone.trim() || undefined,
        pagador_endereco: pagadorEndereco.trim() || undefined,
        paciente_nome: pacienteNome.trim(),
        paciente_cpf: pacienteCpf.trim(),
        paciente_telefone: pacienteTelefone.trim() || undefined,
        paciente_endereco: pacienteEndereco.trim() || undefined,
        servico_prestado: servicoPrestado.trim(),
        medico_assistente: medicoAssistente.trim(),
        crm: crm.trim(),
        data_atendimento: dataAtendimento,
        forma_pagamento: formaPagamento.trim(),
        cidade: cidade.trim() || 'Itapuranga',
        uf: uf.trim().toUpperCase() || 'GO',
      };

      const corpoReferente = `A quantia supra de ${formatarMoeda(valorNumerico)} (${valorExtenso}), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):`;

      const novoDoc = StorageService.emitirDocumento({
        tipo: 'recibo_medico',
        empresa_emissora_id: 'emp-abeas-medico',
        empresa_destinataria_id: 'emp-abeas-medico',
        valor: valorNumerico,
        referente: corpoReferente,
        data_emissao: dataEmissao,
        cidade_emissao: `${detalhes.cidade} - ${detalhes.uf}`,
        observacoes: `Atendimento: ${detalhes.servico_prestado} | Médico(a): ${detalhes.medico_assistente} (${detalhes.crm}) | Pagamento: ${detalhes.forma_pagamento}`,
        usuario: currentUser,
        recibo_medico_detalhes: detalhes,
      });

      onSuccess(novoDoc);
    } catch {
      setErro('Ocorreu um erro ao emitir o Recibo Médico. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const servicosSugeridos = [
    'Consulta médica em ginecologia',
    'Consulta médica clínica geral',
    'Consulta médica pediátrica',
    'Consulta médica cardiológica',
    'Exame ultrassonografia obstétrica',
    'Exames laboratoriais e complementares',
  ];

  const formasPagamentoSugeridas = ['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[94vh] transition-colors">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                EMISSÃO DE RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Modelo Oficial Institucional da ABEAS • Numeração e Extenso Automáticos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModoPreVisualizar(!modoPreVisualizar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                modoPreVisualizar
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{modoPreVisualizar ? 'Voltar à Edição' : 'PRÉ-VISUALIZAR RECIBO'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modoPreVisualizar ? (
            /* ============================================================== */
            /* MODO DE PRÉ-VISUALIZAÇÃO FIEL AO DOCUMENTO IMPRESSO/PDF */
            /* ============================================================== */
            <div className="bg-slate-100 p-4 sm:p-6 rounded-xl">
              <div className="bg-white border border-slate-300 rounded-lg p-8 shadow-sm max-w-2xl mx-auto font-sans text-slate-900 space-y-6">
                {/* Cabeçalho Oficial do Modelo com Logo ABEAS Acima */}
                <div className="text-center border-b border-slate-200 pb-5">
                  <div className="flex justify-center mb-2.5">
                    <img
                      src="/abeas_logo.png"
                      alt="ABEAS"
                      className="h-16 sm:h-20 w-auto object-contain"
                    />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-800 font-bold mb-0.5">
                    ABEAS - Associação Brasileira de Entidades de Assistência Social
                  </div>
                  <div className="text-xs text-slate-600 font-mono mb-2">
                    CNPJ: 04.547.278/0005-68
                  </div>
                  <h1 className="text-lg md:text-xl font-bold uppercase text-slate-900 tracking-tight">
                    RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
                  </h1>
                </div>

                {/* Linha com Número e Valor em Destaque */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Recibo nº: </span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {numeroReciboAuto}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Valor: </span>
                    <span className="text-base font-bold text-emerald-700">
                      {formatarMoeda(valorNumerico)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">({valorExtenso})</span>
                  </div>
                </div>

                {/* Texto Fixo Declaratório da ABEAS */}
                <p className="text-xs text-slate-800 leading-relaxed text-justify font-medium">
                  {ABEAS_FIXA.texto_declaracao}
                </p>

                {/* Seção: DADOS DO PAGADOR */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    DADOS DO PAGADOR
                  </div>
                  <div className="p-3.5 space-y-1.5 text-xs text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-slate-900">Nome/Razão Social: </span>
                        <span>{pagadorNome || '---'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">CPF/CNPJ: </span>
                        <span className="font-mono">{pagadorDocumento || '---'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="font-semibold text-slate-900">Telefone: </span>
                        <span>{pagadorTelefone || '---'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Endereço: </span>
                        <span>{pagadorEndereco || '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto Fixo Intermediário com Valor e Extenso Automáticos */}
                <p className="text-xs text-slate-800 leading-relaxed text-justify">
                  A quantia supra de <b>{formatarMoeda(valorNumerico)}</b> (<i>{valorExtenso}</i>), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):
                </p>

                {/* Seção: DADOS DO PACIENTE */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    DADOS DO PACIENTE
                  </div>
                  <div className="p-3.5 space-y-1.5 text-xs text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-slate-900">Nome do Paciente: </span>
                        <span>{pacienteNome || '---'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">CPF do Paciente: </span>
                        <span className="font-mono">{pacienteCpf || '---'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="font-semibold text-slate-900">Telefone: </span>
                        <span>{pacienteTelefone || '---'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Endereço: </span>
                        <span>{pacienteEndereco || '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: DETALHES DO ATENDIMENTO */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    DETALHES DO ATENDIMENTO:
                  </div>
                  <div className="p-3.5 space-y-1.5 text-xs text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">Serviço prestado: </span>
                      <span>{servicoPrestado}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="font-semibold text-slate-900">Médico(a) assistente: </span>
                        <span>{medicoAssistente}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">CRM: </span>
                        <span className="font-mono">{crm}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="font-semibold text-slate-900">Data do atendimento: </span>
                        <span>{dataAtendimento.split('-').reverse().join('/')}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Forma de pagamento: </span>
                        <span>{formaPagamento}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto Final Fixo */}
                <p className="text-xs text-slate-800 leading-relaxed text-justify font-medium">
                  {ABEAS_FIXA.texto_final}
                </p>

                {/* Local e Data Automáticos */}
                <div className="text-right text-xs text-slate-800 pt-2">
                  {cidade} - {uf}, {dataPorExtenso(dataEmissao)}.
                </div>

                {/* Assinatura Oficial Fixo da ABEAS */}
                <div className="pt-8 text-center">
                  <div className="w-72 mx-auto border-t border-slate-400 mb-2" />
                  <div className="font-bold text-xs uppercase text-slate-900">
                    {ABEAS_FIXA.razao_social}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    CNPJ: {ABEAS_FIXA.cnpj}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* FORMULÁRIO DE PREENCHIMENTO RÁPIDO & ERGONÔMICO */
            /* ============================================================== */
            <div className="space-y-6">
              {/* 1. DADOS FIXOS DA ABEAS */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    1. Dados Institucionais Fixos da ABEAS (Automáticos)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                  <div>
                    <span className="font-semibold">Entidade: </span>
                    <span>{ABEAS_FIXA.razao_social}</span>
                  </div>
                  <div>
                    <span className="font-semibold">CNPJ Fixo: </span>
                    <span className="font-mono font-bold">{ABEAS_FIXA.cnpj}</span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800 italic mt-2 pt-2 border-t border-emerald-200/60">
                  &quot;{ABEAS_FIXA.texto_declaracao}&quot;
                </div>
              </div>

              {/* 2. DADOS DO RECIBO */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>2. Dados do Recibo</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sequência automática e cálculo por extenso
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Número Automático */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recibo nº: (Automático)
                    </label>
                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                      {numeroReciboAuto || 'Gerando...'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Gravado sequencialmente no sistema
                    </span>
                  </div>

                  {/* Valor Manual */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valor: R$ (Manual) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-slate-500">
                        R$
                      </span>
                      <input
                        type="text"
                        required
                        value={valorStr}
                        onChange={(e) => setValorStr(e.target.value)}
                        placeholder="350,00"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Data de Emissão */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data de Emissão (Automática)
                    </label>
                    <input
                      type="date"
                      value={dataEmissao}
                      onChange={(e) => setDataEmissao(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Exibição em tempo real do Extenso */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs flex items-start gap-2">
                  <span className="font-bold text-blue-900 shrink-0">Valor por extenso:</span>
                  <span className="text-blue-800 italic">{valorExtenso}</span>
                </div>

                {/* Localidade padrão */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Itapuranga"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="GO"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DADOS DO PAGADOR */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>3. Dados do Pagador</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Pessoa física ou jurídica pagadora</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome / Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={pagadorNome}
                      onChange={(e) => setPagadorNome(e.target.value)}
                      placeholder="Ex: Mariana de Souza Silva"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CPF / CNPJ *
                    </label>
                    <input
                      type="text"
                      required
                      value={pagadorDocumento}
                      onChange={handlePagadorDocChange}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={pagadorTelefone}
                      onChange={(e) => setPagadorTelefone(mascaraTelefone(e.target.value))}
                      placeholder="(62) 99999-0000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={pagadorEndereco}
                      onChange={(e) => setPagadorEndereco(e.target.value)}
                      placeholder="Ex: Av. Bernardo Sayão, 450 - Centro"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DADOS DO PACIENTE */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>4. Dados do Paciente</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopiarPagadorParaPaciente}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    title="Preencher com os mesmos dados do Pagador"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar dados do Pagador</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome do Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      value={pacienteNome}
                      onChange={(e) => setPacienteNome(e.target.value)}
                      placeholder="Ex: Mariana de Souza Silva"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CPF do Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      value={pacienteCpf}
                      onChange={handlePacienteCpfChange}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone do Paciente
                    </label>
                    <input
                      type="text"
                      value={pacienteTelefone}
                      onChange={(e) => setPacienteTelefone(mascaraTelefone(e.target.value))}
                      placeholder="(62) 99999-0000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço do Paciente
                    </label>
                    <input
                      type="text"
                      value={pacienteEndereco}
                      onChange={(e) => setPacienteEndereco(e.target.value)}
                      placeholder="Ex: Av. Bernardo Sayão, 450 - Centro"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. DETALHES DO ATENDIMENTO */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white">
                <div className="pb-2 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>5. Detalhes do Atendimento</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Serviço prestado *
                    </label>
                    <span className="text-[10px] text-slate-400">Sugestões rápidas abaixo</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={servicoPrestado}
                    onChange={(e) => setServicoPrestado(e.target.value)}
                    placeholder="Ex: Consulta médica em ginecologia"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {servicosSugeridos.map((sugestao) => (
                      <button
                        key={sugestao}
                        type="button"
                        onClick={() => setServicoPrestado(sugestao)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          servicoPrestado === sugestao
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sugestao}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Médico(a) assistente *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicoAssistente}
                      onChange={(e) => setMedicoAssistente(e.target.value)}
                      placeholder="Ex: Dr(a). Morena Ciclano de Tal"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CRM *
                    </label>
                    <input
                      type="text"
                      required
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      placeholder="Ex: 0000/GO"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data do atendimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataAtendimento}
                      onChange={(e) => setDataAtendimento(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Forma de pagamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      placeholder="Ex: Pix, Dinheiro, Cartão..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {formasPagamentoSugeridas.map((fp) => (
                        <button
                          key={fp}
                          type="button"
                          onClick={() => setFormaPagamento(fp)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            formaPagamento === fp
                              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {fp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Ações Inferior */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModoPreVisualizar(!modoPreVisualizar)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{modoPreVisualizar ? 'Editar Dados' : 'PRÉ-VISUALIZAR RECIBO'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleEmitir}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'EMITINDO...' : 'EMITIR RECIBO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
