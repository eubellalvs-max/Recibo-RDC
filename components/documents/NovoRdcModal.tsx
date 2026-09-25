'use client';

import React, { useState } from 'react';
import { Empresa, Usuario, Documento, ItemGastoRdc, NaturezaGastoId } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { valorPorExtenso } from '@/lib/extenso';
import { dataHojeIso, mascaraCnpj, mascaraCpf, formatarMoeda } from '@/lib/masks';
import { X, Check, Plus, Trash2, AlertCircle, Calculator, Building2 } from 'lucide-react';

interface NovoRdcModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onSuccess: (documento: Documento) => void;
}

export function NovoRdcModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: NovoRdcModalProps) {
  const [empresas] = useState<Empresa[]>(() => {
    return StorageService.getEmpresas().filter((e) => e.status === 'ativa');
  });

  const [empresaEmissoraId, setEmpresaEmissoraId] = useState<string>(() => {
    const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
    const permitidas = all.filter((e) => {
      if (e.tipo !== 'emissora' && e.tipo !== 'ambas') return false;
      if (currentUser.perfil === 'admin') return true;
      if (!currentUser.empresas_permitidas || currentUser.empresas_permitidas.length === 0) {
        return true;
      }
      return currentUser.empresas_permitidas.includes(e.id);
    });
    return permitidas[0]?.id || all[0]?.id || '';
  });

  const [empresaDestinatariaId, setEmpresaDestinatariaId] = useState<string>(() => {
    const all = StorageService.getEmpresas().filter((e) => e.status === 'ativa');
    const destinatarias = all.filter(
      (e) => e.tipo === 'destinataria' || e.tipo === 'ambas'
    );
    return destinatarias[0]?.id || all[0]?.id || '';
  });

  // 1. Informações do Solicitante da viagem
  const [dataPedido, setDataPedido] = useState<string>(() => dataHojeIso());
  const [numeroPedido, setNumeroPedido] = useState<string>('2026/089');
  const [localPartida, setLocalPartida] = useState<string>('Brasília/DF');
  const [destino, setDestino] = useState<string>('São Paulo/SP');
  const [nomeSolicitante, setNomeSolicitante] = useState<string>(currentUser.nome || 'Lucas Oliveira');
  const [cpfSolicitante, setCpfSolicitante] = useState<string>('021.488.921-34');
  const [setorFuncao, setSetorFuncao] = useState<string>('Auditor de Sistemas / TI');
  const [objetivoViagem, setObjetivoViagem] = useState<string>(
    'Auditoria técnica e vistoria in loco de infraestrutura predial e contábil.'
  );

  // 2. Informações bancária e financeira
  const [valorSolicitadoRaw, setValorSolicitadoRaw] = useState<string>('2000,00');
  const [valorSolicitado, setValorSolicitado] = useState<number>(2000.0);
  const [nomeBanco, setNomeBanco] = useState<string>('Banco do Brasil');
  const [agencia, setAgencia] = useState<string>('1820-1');
  const [conta, setConta] = useState<string>('45.890-2');
  const [tipoConta, setTipoConta] = useState<string>('Conta Corrente');
  const [chavePix, setChavePix] = useState<string>(currentUser.email || 'lucas.oliveira@abeas.org.br');

  // 3. Descrição dos gastos
  const [dataEntregaRdc, setDataEntregaRdc] = useState<string>(() => dataHojeIso());
  const [itens, setItens] = useState<ItemGastoRdc[]>([
    {
      id: 'item-1',
      tipo_gasto: 1,
      tipo_doc: 'Nf',
      descricao: 'Restaurante Sabor & Arte - Almoço de trabalho equipe - NF 1042',
      valor: 380.0,
    },
    {
      id: 'item-2',
      tipo_gasto: 2,
      tipo_doc: 'Nf',
      descricao: 'Posto Petrobras Paulista - Abastecimento de veículo locado - NF 8892',
      valor: 320.0,
    },
    {
      id: 'item-3',
      tipo_gasto: 3,
      tipo_doc: 'Rec',
      descricao: 'Uber do Brasil - Deslocamentos Aeroporto x Hotel x Escritório',
      valor: 195.0,
    },
    {
      id: 'item-4',
      tipo_gasto: 4,
      tipo_doc: 'Nf',
      descricao: 'Hotel Ibis Paulista - 2 diárias de hospedagem - NF 4421',
      valor: 850.0,
    },
    {
      id: 'item-5',
      tipo_gasto: 5,
      tipo_doc: 'Rec',
      descricao: 'GOL Linhas Aéreas - Taxa de embarque e despacho bagagem',
      valor: 210.0,
    },
    {
      id: 'item-6',
      tipo_gasto: 6,
      tipo_doc: 'Rec',
      descricao: 'Papelaria Express - Cópias de documentos e encadernações técnicas',
      valor: 145.0,
    },
  ]);

  // Assinaturas
  const [assinaturaProfissional, setAssinaturaProfissional] = useState(currentUser.nome);
  const [diretoriaDireta, setDiretoriaDireta] = useState('Carlos Eduardo Silva');
  const [contabilFinanceiro, setContabilFinanceiro] = useState('Setor Contábil / Financeiro ABEAS');

  const [erro, setErro] = useState<string | null>(null);

  // Cálculos dinâmicos em tempo real
  const totalDespesas = itens.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalPorNatureza: Record<NaturezaGastoId, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  itens.forEach((it) => {
    if (it.tipo_gasto >= 1 && it.tipo_gasto <= 6) {
      totalPorNatureza[it.tipo_gasto] = (totalPorNatureza[it.tipo_gasto] || 0) + (Number(it.valor) || 0);
    }
  });

  // Saldo devolução/ressarcimento:
  // Conforme formulário: (Saldo negativo, a receber. Saldo positivo, devolver na conta de origem)
  // Fórmula: Valor Adiantado - Total Despesas
  const saldoDevolucao = valorSolicitado - totalDespesas;
  // Se saldoDevolucao < 0: despesas > adiantamento -> valor a ressarcir é o módulo
  const valorARessarcir = saldoDevolucao < 0 ? Math.abs(saldoDevolucao) : 0;

  const handleValorSolicitadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValorSolicitadoRaw(raw);
    const limpo = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(limpo);
    setValorSolicitado(!isNaN(num) && num >= 0 ? num : 0);
  };

  const handleAddItem = () => {
    const novoItem: ItemGastoRdc = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tipo_gasto: 1,
      tipo_doc: 'Nf',
      descricao: '',
      valor: 0,
    };
    setItens([...itens, novoItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (itens.length === 1) {
      alert('A prestação de contas deve conter pelo menos 1 item de despesa.');
      return;
    }
    setItens(itens.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ItemGastoRdc, val: any) => {
    setItens(
      itens.map((it) => {
        if (it.id !== id) return it;
        if (field === 'valor') {
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
          return { ...it, valor: num };
        }
        return { ...it, [field]: val };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nomeSolicitante.trim()) {
      setErro('Informe o nome do solicitante da viagem.');
      return;
    }

    if (!objetivoViagem.trim()) {
      setErro('Informe o objetivo da viagem.');
      return;
    }

    if (itens.length === 0) {
      setErro('Adicione ao menos um item na descrição dos gastos.');
      return;
    }

    if (totalDespesas <= 0) {
      setErro('O valor total das despesas deve ser superior a R$ 0,00.');
      return;
    }

    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dataPartes = dataEntregaRdc.split('-');
    const mesIndex = dataPartes.length === 3 ? parseInt(dataPartes[1]) - 1 : new Date().getMonth();
    const anoAtual = dataPartes.length === 3 ? dataPartes[0] : '2026';
    const competenciaStr = `${meses[mesIndex]} / ${anoAtual}`;

    try {
      const doc = StorageService.emitirDocumento({
        tipo: 'rdc',
        empresa_emissora_id: empresaEmissoraId,
        empresa_destinataria_id: empresaDestinatariaId,
        valor: totalDespesas,
        referente: `Prestação de Contas e Reembolso de Despesas Corporativa - ${objetivoViagem}`,
        competencia: competenciaStr,
        data_emissao: dataEntregaRdc,
        cidade_emissao: localPartida || 'Brasília/DF',
        observacoes: `Solicitante: ${nomeSolicitante} | N.º Pedido: ${numeroPedido} | Saldo: ${saldoDevolucao < 0 ? `A ressarcir ${formatarMoeda(valorARessarcir)}` : `A devolver ${formatarMoeda(saldoDevolucao)}`}`,
        usuario: currentUser,
        rdc_detalhes: {
          data_pedido: dataPedido,
          numero_pedido: numeroPedido,
          local_partida: localPartida,
          destino: destino,
          nome_solicitante: nomeSolicitante,
          cpf_solicitante: cpfSolicitante,
          setor_funcao: setorFuncao,
          objetivo_viagem: objetivoViagem,
          valor_solicitado: valorSolicitado,
          nome_banco: nomeBanco,
          agencia: agencia,
          conta: conta,
          tipo_conta: tipoConta,
          chave_pix: chavePix,
          data_entrega_rdc: dataEntregaRdc,
          itens: itens,
          total_despesas: totalDespesas,
          valor_adiantamento: valorSolicitado,
          saldo_devolucao_ressarcimento: saldoDevolucao,
          valor_ressarcir_solicitante: valorARessarcir,
          assinatura_profissional: assinaturaProfissional,
          diretoria_direta: diretoriaDireta,
          contabil_financeiro: contabilFinanceiro,
        },
      });

      onSuccess(doc);
    } catch (err) {
      setErro('Ocorreu um erro ao emitir o RDC. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              📄
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                PRESTAÇÃO DE CONTAS E REEMBOLSO DE DESPESAS CORPORATIVA - RDC
              </h2>
              <p className="text-xs text-slate-500">
                Modelo Oficial Institucional ABEAS - Formulário completo com controle de gastos e rateio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Vertical */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* 1. SEÇÃO: Informações do Solicitante da Viagem */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Informações do Solicitante da viagem</span>
              <span className="text-[11px] font-normal text-slate-400">Campos Obrigatórios *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Data do pedido *
                </label>
                <input
                  type="date"
                  required
                  value={dataPedido}
                  onChange={(e) => setDataPedido(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  N.º Pedido *
                </label>
                <input
                  type="text"
                  required
                  value={numeroPedido}
                  onChange={(e) => setNumeroPedido(e.target.value)}
                  placeholder="Ex: 2026/089"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Local de partida *
                </label>
                <input
                  type="text"
                  required
                  value={localPartida}
                  onChange={(e) => setLocalPartida(e.target.value)}
                  placeholder="Ex: Brasília/DF"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  required
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ex: São Paulo/SP"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome - Solicitante *
                </label>
                <input
                  type="text"
                  required
                  value={nomeSolicitante}
                  onChange={(e) => {
                    setNomeSolicitante(e.target.value);
                    setAssinaturaProfissional(e.target.value);
                  }}
                  placeholder="Ex: Lucas Oliveira"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nº CPF *
                </label>
                <input
                  type="text"
                  required
                  value={cpfSolicitante}
                  onChange={(e) => setCpfSolicitante(mascaraCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Setor / Função *
                </label>
                <input
                  type="text"
                  required
                  value={setorFuncao}
                  onChange={(e) => setSetorFuncao(e.target.value)}
                  placeholder="Ex: Auditor de Sistemas / TI"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Objetivo da viagem *
              </label>
              <textarea
                rows={2}
                required
                value={objetivoViagem}
                onChange={(e) => setObjetivoViagem(e.target.value)}
                placeholder="Ex: Realização de auditoria técnica in loco, reuniões estratégicas com conselho fiscal e levantamento contábil..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          {/* 2. SEÇÃO: Informações bancária e financeira */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Informações bancária e financeira
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Valor solicitado (Adiantamento)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-medium text-slate-500">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorSolicitadoRaw}
                    onChange={handleValorSolicitadoChange}
                    placeholder="0,00"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome do Banco
                </label>
                <input
                  type="text"
                  value={nomeBanco}
                  onChange={(e) => setNomeBanco(e.target.value)}
                  placeholder="Ex: Banco do Brasil"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  N.º Agencia
                </label>
                <input
                  type="text"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                  placeholder="Ex: 1820-1"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  N.º Conta
                </label>
                <input
                  type="text"
                  value={conta}
                  onChange={(e) => setConta(e.target.value)}
                  placeholder="Ex: 45.890-2"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tipo da Conta
                </label>
                <select
                  value={tipoConta}
                  onChange={(e) => setTipoConta(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none"
                >
                  <option value="Conta Corrente">Conta Corrente</option>
                  <option value="Conta Poupança">Conta Poupança</option>
                  <option value="Conta Pagamento">Conta Pagamento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chave do PIX
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder="Ex: CPF, celular ou e-mail"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-slate-800 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. SEÇÃO: Descrição dos gastos */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Descrição dos gastos
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  (Classifique cada item de 1 a 6 e tipo Rec/Nf)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600">Data entrega - RDC:</span>
                <input
                  type="date"
                  value={dataEntregaRdc}
                  onChange={(e) => setDataEntregaRdc(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Tabela de Itens Dinâmica */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-2 py-2 w-36">Tipo Gastos</th>
                    <th className="px-2 py-2 w-28">Tipo Doc.</th>
                    <th className="px-2 py-2">Fornecedor - observação das despesas - número documento</th>
                    <th className="px-2 py-2 text-right w-32">Valor (R$)</th>
                    <th className="px-2 py-2 text-center w-12">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-2 py-1.5">
                        <select
                          value={item.tipo_gasto}
                          onChange={(e) =>
                            handleItemChange(item.id, 'tipo_gasto', parseInt(e.target.value) as NaturezaGastoId)
                          }
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none"
                        >
                          <option value={1}>1 Alimentação</option>
                          <option value={2}>2 Combustível</option>
                          <option value={3}>3 Condução</option>
                          <option value={4}>4 Hospedagem</option>
                          <option value={5}>5 Passagens</option>
                          <option value={6}>6 Outros gastos</option>
                        </select>
                      </td>

                      <td className="px-2 py-1.5">
                        <select
                          value={item.tipo_doc}
                          onChange={(e) => handleItemChange(item.id, 'tipo_doc', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none font-medium"
                        >
                          <option value="Rec">Rec (Recibo)</option>
                          <option value="Nf">Nf (Nota Fiscal)</option>
                        </select>
                      </td>

                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          required
                          value={item.descricao}
                          onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                          placeholder="Ex: Fornecedor Ltda - Jantar com cliente - NF 3341"
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-slate-800"
                        />
                      </td>

                      <td className="px-2 py-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.valor || ''}
                          onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-2 py-1 text-xs text-right font-mono font-semibold bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-slate-800"
                        />
                      </td>

                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Linha de Despesa</span>
            </button>
          </div>

          {/* 4. SEÇÃO: Resumo, Legenda e Totais (Idêntico ao Rodapé da Imagem) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              Quadro Resumo de Gastos & Prestação de Contas
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna Esquerda: Natureza dos Gastos */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="font-semibold text-slate-700 border-b border-slate-100 pb-1 flex justify-between">
                  <span>Natureza dos gastos</span>
                  <span>Total gastos</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1 Alimentação</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[1])}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>2 Combustível</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[2])}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>3 Condução</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[3])}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>4 Hospedagem</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[4])}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>5 Passagens</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[5])}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>6 Outros gastos</span>
                  <span className="font-mono font-medium">{formatarMoeda(totalPorNatureza[6])}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <b>Legenda:</b> Rec = Recibo | Nf = Nota Fiscal
                </div>
              </div>

              {/* Coluna Direita: Totais Financeiros Oficiais */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-800">Total das Despesas:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatarMoeda(totalDespesas)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Valor recebido de adiantamento:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatarMoeda(valorSolicitado)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <div className="font-medium text-slate-700">Valor de devolução / ressarcimento:</div>
                    <div className="text-[10px] text-slate-400">
                      (Saldo negativo, a receber. Saldo positivo, devolver)
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      saldoDevolucao < 0 ? 'text-blue-700' : saldoDevolucao > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    {formatarMoeda(saldoDevolucao)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 bg-blue-50/70 px-2 rounded">
                  <span className="font-bold text-blue-900">
                    {saldoDevolucao < 0 ? 'Valor a ressarcir na conta do solicitante:' : 'Valor a devolver na conta de origem:'}
                  </span>
                  <span className="font-mono font-bold text-blue-900 text-sm">
                    {formatarMoeda(saldoDevolucao < 0 ? valorARessarcir : saldoDevolucao)}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso Obrigatório em Destaque */}
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-center text-red-700 font-bold text-[11px] tracking-wide uppercase">
              DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
            </div>
          </div>

          {/* 5. SEÇÃO: Assinaturas e aprovação das despesas */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Assinaturas e aprovação das despesas
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assinatura do profissional (Solicitante)
                </label>
                <input
                  type="text"
                  value={assinaturaProfissional}
                  onChange={(e) => setAssinaturaProfissional(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Diretoria direta
                </label>
                <input
                  type="text"
                  value={diretoriaDireta}
                  onChange={(e) => setDiretoriaDireta(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contábil / Financeiro
                </label>
                <input
                  type="text"
                  value={contabilFinanceiro}
                  onChange={(e) => setContabilFinanceiro(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer com Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-blue-400" />
              <span>EMITIR RDC COM PRESTAÇÃO DE CONTAS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
