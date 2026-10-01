'use client';

import React from 'react';
import { DadosReciboMedico } from '@/lib/types';
import { ABEAS_FIXA } from '@/lib/storage';
import { formatarMoeda, dataPorExtenso } from '@/lib/masks';

export interface UnifiedReciboMedicoData {
  numero: string;
  valor: number;
  valor_extenso: string;
  data_emissao: string;
  usuario_nome?: string;
  detalhes: DadosReciboMedico;
}

interface UnifiedReciboMedicoPrintProps {
  dados: UnifiedReciboMedicoData;
}

export const UnifiedReciboMedicoPrint: React.FC<UnifiedReciboMedicoPrintProps> = ({
  dados,
}) => {
  const { numero, valor, valor_extenso, data_emissao, usuario_nome, detalhes: med } = dados;

  return (
    <div className="receipt-sheet-medico print-sheet-medico receipt-sheet print-document print-sheet bg-white border border-slate-300 shadow-sm p-6 sm:p-10 max-w-3xl w-full text-slate-900 font-sans leading-relaxed text-xs sm:text-sm mx-auto print:p-0 print:border-slate-800 print:text-[8pt] print:leading-tight">
      {/* Cabeçalho Oficial do Modelo com Logo ABEAS Acima e depois os textos */}
      <div className="med-header text-center border-b-2 border-slate-300 pb-4 mb-4 print:pb-1.5 print:mb-1.5 print:border-slate-400">
        <div className="flex justify-center mb-2 print:mb-0.5">
          <img
            src="/abeas_logo.png"
            alt="ABEAS"
            className="med-logo h-16 sm:h-20 w-auto object-contain print:h-10 print:max-h-10"
          />
        </div>
        <div className="med-subtitle text-xs uppercase tracking-wider text-slate-800 font-bold mb-0.5 print:text-[7.5pt] print:mb-0">
          ABEAS - Associação Brasileira de Entidades de Assistência Social
        </div>
        <div className="med-cnpj text-xs text-slate-600 font-mono mb-2.5 print:text-[7pt] print:mb-0.5">
          CNPJ: 04.547.278/0005-68.
        </div>
        <h1 className="med-title text-lg md:text-xl font-bold uppercase text-slate-900 tracking-tight print:text-[10pt] print:leading-none">
          RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
        </h1>
      </div>

      {/* Linha com Número e Valor em Destaque */}
      <div className="med-destaque flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg mb-5 print:p-1.5 print:mb-1.5 print:bg-slate-50 print:border-slate-300">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-[7pt]">
            Recibo nº:{' '}
          </span>
          <span className="text-base font-bold font-mono text-slate-900 print:text-[9.5pt]">
            {numero}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block print:text-[7pt]">
            Valor:
          </span>
          <span className="text-lg md:text-xl font-bold text-slate-900 print:text-[10.5pt]">
            {formatarMoeda(valor)}
          </span>
        </div>
      </div>

      <div className="med-content space-y-4 text-xs sm:text-sm text-slate-800 print:space-y-1.5 print:text-[7.8pt] print:leading-snug">
        {/* Texto Fixo Declaratório da ABEAS */}
        <p className="leading-relaxed text-justify font-normal print:leading-snug">
          {ABEAS_FIXA.texto_declaracao}
        </p>

        {/* Seção: DADOS DO PAGADOR */}
        <div className="med-card border border-slate-300 rounded-lg overflow-hidden print:rounded-xs print:border-slate-400">
          <div className="med-card-header bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider print:py-0.5 print:px-2 print:text-[7pt]">
            DADOS DO PAGADOR
          </div>
          <div className="med-card-body p-3 space-y-1 text-xs text-slate-800 bg-white print:p-1.5 print:space-y-0.5 print:text-[7.2pt]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Nome/Razão Social: </span>
                <span>{med.pagador_nome}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">CPF/CNPJ: </span>
                <span className="font-mono">{med.pagador_documento}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 print:pt-0.5 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Telefone: </span>
                <span>{med.pagador_telefone || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Endereço: </span>
                <span>{med.pagador_endereco || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Texto Intermediário com Valor e Extenso Automáticos */}
        <p className="leading-relaxed text-justify print:leading-snug">
          A quantia supra de <b>{formatarMoeda(valor)}</b> (<i>{valor_extenso}</i>), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):
        </p>

        {/* Seção: DADOS DO PACIENTE */}
        <div className="med-card border border-slate-300 rounded-lg overflow-hidden print:rounded-xs print:border-slate-400">
          <div className="med-card-header bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider print:py-0.5 print:px-2 print:text-[7pt]">
            DADOS DO PACIENTE
          </div>
          <div className="med-card-body p-3 space-y-1 text-xs text-slate-800 bg-white print:p-1.5 print:space-y-0.5 print:text-[7.2pt]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Nome do Paciente: </span>
                <span>{med.paciente_nome}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">CPF do Paciente: </span>
                <span className="font-mono">{med.paciente_cpf}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 print:pt-0.5 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Telefone: </span>
                <span>{med.paciente_telefone || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Endereço: </span>
                <span>{med.paciente_endereco || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção: DETALHES DO ATENDIMENTO */}
        <div className="med-card border border-slate-300 rounded-lg overflow-hidden print:rounded-xs print:border-slate-400">
          <div className="med-card-header bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-900 uppercase tracking-wider print:py-0.5 print:px-2 print:text-[7pt]">
            DETALHES DO ATENDIMENTO:
          </div>
          <div className="med-card-body p-3 space-y-1 text-xs text-slate-800 bg-white print:p-1.5 print:space-y-0.5 print:text-[7.2pt]">
            <div>
              <span className="font-bold text-slate-900">Serviço prestado: </span>
              <span>{med.servico_prestado}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 print:pt-0.5 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Médico(a) assistente: </span>
                <span>{med.medico_assistente}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">CRM: </span>
                <span className="font-mono">{med.crm}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 print:pt-0.5 print:gap-1">
              <div>
                <span className="font-bold text-slate-900">Data do atendimento: </span>
                <span>{med.data_atendimento.split('-').reverse().join('/')}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Forma de pagamento: </span>
                <span>{med.forma_pagamento}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Texto Final Fixo */}
        <p className="leading-relaxed text-justify font-medium pt-1 print:pt-0 print:leading-snug">
          {ABEAS_FIXA.texto_final}
        </p>

        {/* Local e Data */}
        <div className="pt-2 text-right text-xs text-slate-800 font-medium print:pt-0.5 print:text-[7.2pt]">
          {med.cidade || 'Itapuranga'} - {med.uf || 'GO'}, {dataPorExtenso(data_emissao)}.
        </div>

        {/* Assinatura Oficial Fixa da ABEAS */}
        <div className="med-signature pt-8 text-center avoid-page-break print:pt-2.5 print:mt-1">
          <div className="med-signature-line w-80 mx-auto border-t border-slate-500 mb-1.5 print:w-52 print:mb-0.5 print:border-slate-800" />
          <div className="font-bold text-xs uppercase text-slate-900 print:text-[7.5pt]">
            {ABEAS_FIXA.razao_social}
          </div>
          <div className="text-[11px] text-slate-600 font-mono print:text-[6.8pt]">
            CNPJ: {ABEAS_FIXA.cnpj}
          </div>
        </div>
      </div>

      {/* Rodapé Interno */}
      <div className="med-footer mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 print:mt-1.5 print:pt-1 print:text-[6.5pt] print:border-slate-300">
        <div>Documento Oficial de Prestação de Serviços Médicos Particulares</div>
        <div>Emissor: {usuario_nome || 'Sistema'}</div>
      </div>
    </div>
  );
};
