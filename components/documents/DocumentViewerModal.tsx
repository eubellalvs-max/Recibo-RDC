'use client';

import React, { useState } from 'react';
import { Documento, Empresa, TipoGastoConfig, TipoDocConfig } from '@/lib/types';
import { StorageService, ABEAS_FIXA } from '@/lib/storage';
import { formatarMoeda, mascaraCnpj, formatarDataBr } from '@/lib/masks';
import { dataPorExtenso } from '@/lib/extenso';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { UnifiedPrintToolbar } from './unified/UnifiedPrintToolbar';
import { UnifiedReciboPrint } from './unified/UnifiedReciboPrint';
import { UnifiedReciboMedicoPrint } from './unified/UnifiedReciboMedicoPrint';
import { UnifiedRdcPrint } from './unified/UnifiedRdcPrint';

interface DocumentViewerModalProps {
  documento: Documento | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({
  documento,
  isOpen,
  onClose,
}: DocumentViewerModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [via, setVia] = useState<'1' | '2'>('1');

  if (!isOpen || !documento) return null;

  const empresas = StorageService.getEmpresas();
  const config = StorageService.getConfig();

  const emissora: Empresa | undefined = empresas.find(
    (e) => e.id === documento.empresa_emissora_id
  );
  const destinataria: Empresa | undefined = empresas.find(
    (e) => e.id === documento.empresa_destinataria_id
  );

  const isRdc = documento.tipo === 'rdc';
  const isReciboMedico = documento.tipo === 'recibo_medico';
  const rdc = documento.rdc_detalhes;
  const med = documento.recibo_medico_detalhes;

  const tiposGasto: TipoGastoConfig[] = config.tipos_gasto || StorageService.getTiposGasto();
  const tiposDoc: TipoDocConfig[] = config.tipos_doc || StorageService.getTiposDoc();

  const handleCopyText = () => {
    let texto = '';
    if (isRdc && rdc) {
      const linhaTexto =
        rdc.linha_gasto === 'corporativa'
          ? 'Despesas Corporativas'
          : rdc.linha_gasto === 'ambas'
          ? 'Viagem & Despesas Corporativas'
          : 'Despesas de Viagem';

      texto = `
==================================================
ASSOCIAÇÃO BRASILEIRA DE ENTIDADES DE ASSISTÊNCIA SOCIAL - ABEAS
PRESTAÇÃO DE CONTAS E REEMBOLSO DE DESPESAS CORPORATIVA - RDC
Nº ${documento.numero} [${linhaTexto}]
==================================================
Informações do Solicitante da Viagem ou Despesas Corporativas:
Linha de Gastos: ${linhaTexto}
Data do pedido: ${formatarDataBr(rdc.data_pedido)} | N.º Pedido: ${rdc.numero_pedido}
Local de partida/Origem: ${rdc.local_partida} | Destino/Unidade: ${rdc.destino}
Nome - Solicitante: ${rdc.nome_solicitante} | Nº CPF: ${rdc.cpf_solicitante} | Setor/Função: ${rdc.setor_funcao}
Objetivo: ${rdc.objetivo_viagem}

Informações bancária e financeira:
Valor solicitado: ${formatarMoeda(rdc.valor_solicitado)} | Banco: ${rdc.nome_banco} | Agência: ${rdc.agencia} | Conta: ${rdc.conta} (${rdc.tipo_conta})
Chave PIX: ${rdc.chave_pix}

Descrição dos gastos (Data entrega - RDC: ${formatarDataBr(rdc.data_entrega_rdc)}):
${rdc.itens.map((it, idx) => `${idx + 1}. [Tipo ${it.tipo_gasto} - ${it.tipo_doc}] ${it.descricao} - ${formatarMoeda(it.valor)}`).join('\n')}

Totais:
Total das Despesas: ${formatarMoeda(rdc.total_despesas)}
Valor recebido de adiantamento: ${formatarMoeda(rdc.valor_adiantamento)}
Saldo devolução/ressarcimento: ${formatarMoeda(rdc.saldo_devolucao_ressarcimento)}
Valor a ressarcir na conta do solicitante: ${formatarMoeda(rdc.valor_ressarcir_solicitante)}

AVISO: DESPESAS COM BEBIDAS ALCOÓLICAS, GASTOS NÃO PRÉ ACORDADOS COM DIRETORIA, NÃO SERÃO REEMBOLSADOS.
==================================================
`.trim();
    } else if (isReciboMedico && med) {
      texto = `
==================================================
${ABEAS_FIXA.razao_social}
CNPJ: ${ABEAS_FIXA.cnpj}
RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
Recibo nº: ${documento.numero}
Valor: ${formatarMoeda(documento.valor)} (${documento.valor_extenso})
==================================================
${ABEAS_FIXA.texto_declaracao}

DADOS DO PAGADOR:
Nome/Razão Social: ${med.pagador_nome}
CPF/CNPJ: ${med.pagador_documento}
Telefone: ${med.pagador_telefone || '---'}
Endereço: ${med.pagador_endereco || '---'}

A quantia supra de ${formatarMoeda(documento.valor)} (${documento.valor_extenso}), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):

DADOS DO PACIENTE:
Nome do Paciente: ${med.paciente_nome}
CPF do Paciente: ${med.paciente_cpf}
Telefone: ${med.paciente_telefone || '---'}
Endereço: ${med.paciente_endereco || '---'}

DETALHES DO ATENDIMENTO:
Serviço prestado: ${med.servico_prestado}
Médico(a) assistente: ${med.medico_assistente}
CRM: ${med.crm}
Data do atendimento: ${med.data_atendimento.split('-').reverse().join('/')}
Forma de pagamento: ${med.forma_pagamento}

${ABEAS_FIXA.texto_final}

${med.cidade || 'Itapuranga'} - ${med.uf || 'GO'}, ${dataPorExtenso(documento.data_emissao)}.

__________________________________________________
${ABEAS_FIXA.razao_social}
CNPJ: ${ABEAS_FIXA.cnpj}
==================================================
`.trim();
    } else {
      texto = `
==================================================
${config.sigla_organizacao || 'ABEAS'}
RECIBO Nº ${documento.numero}
==================================================
RECEBEMOS DE: ${destinataria?.razao_social || 'Empresa Destinatária'}
CNPJ: ${destinataria ? mascaraCnpj(destinataria.cnpj) : ''}
O VALOR DE: ${formatarMoeda(documento.valor)} (${documento.valor_extenso})
REFERENTE A: ${documento.referente}
${documento.observacoes ? `Observações: ${documento.observacoes}` : ''}
${documento.cidade_emissao || 'Brasília/DF'}, ${dataPorExtenso(documento.data_emissao)}.
Emissor: ${emissora?.razao_social || 'Empresa Emissora'}
==================================================
`.trim();
    }

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const tituloDocumento = isRdc
    ? 'RDC - PRESTAÇÃO DE CONTAS'
    : isReciboMedico
    ? 'RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS'
    : 'RECIBO';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[94vh] transition-colors print-modal-content">
        {/* Barra Superior de Ações Unificada */}
        <div className="no-print relative">
          <UnifiedPrintToolbar
            titulo={tituloDocumento}
            subtitulo={`Nº ${documento.numero} • Emitido em ${formatarDataBr(documento.data_emissao)}`}
            isPreVisualizacao={false}
            onFechar={onClose}
            documentoNumero={documento.numero}
            tipoDocumento={tituloDocumento}
            viaAtual={!isRdc && !isReciboMedico ? via : undefined}
            onChangeVia={!isRdc && !isReciboMedico ? setVia : undefined}
          />

          {/* Botão extra para copiar dados de texto */}
          <div className="absolute right-32 top-3 sm:top-3.5 hidden md:block">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
              title="Copiar texto do documento para a área de transferência"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Banner de Auditoria de Cancelamento */}
        {documento.status === 'cancelado' && (
          <div className="no-print bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900/60 px-6 py-2.5 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold uppercase tracking-wider text-red-700 dark:text-red-400">DOCUMENTO CANCELADO</span>
              <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                <span>Data do Cancelamento: <b>{documento.data_cancelamento ? new Date(documento.data_cancelamento).toLocaleString('pt-BR') : 'Não registrada'}</b></span>
                <span className="mx-2">•</span>
                <span>Responsável: <b>{documento.usuario_cancelamento_nome || 'Sistema'}</b></span>
              </div>
              {documento.motivo_cancelamento && (
                <div className="text-[11px] text-red-700 dark:text-red-300 mt-1 italic">
                  Motivo: &ldquo;{documento.motivo_cancelamento}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo com Scroll na tela e formatado para papel timbrado */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center transition-colors">
          {isRdc && rdc ? (
            <UnifiedRdcPrint
              dados={{
                numero: documento.numero,
                detalhes: rdc,
                tiposGasto,
                tiposDoc,
              }}
            />
          ) : isReciboMedico && med ? (
            <UnifiedReciboMedicoPrint
              dados={{
                numero: documento.numero,
                valor: documento.valor,
                valor_extenso: documento.valor_extenso,
                data_emissao: documento.data_emissao,
                usuario_nome: documento.usuario_nome,
                detalhes: med,
              }}
            />
          ) : (
            <UnifiedReciboPrint
              dados={{
                numero: documento.numero,
                valor: documento.valor,
                valor_extenso: documento.valor_extenso,
                referente: documento.referente,
                data_emissao: documento.data_emissao,
                cidade_emissao: documento.cidade_emissao,
                observacoes: documento.observacoes,
                logo_url: documento.logo_url,
                usuario_nome: documento.usuario_nome,
                emissora,
                destinataria,
              }}
              config={config}
              via={via}
            />
          )}
        </div>
      </div>
    </div>
  );
}
