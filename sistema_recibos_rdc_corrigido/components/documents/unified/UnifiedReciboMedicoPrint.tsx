'use client';

import React from 'react';
import { DadosReciboMedico } from '@/lib/types';
import { ABEAS_FIXA } from '@/lib/storage';
import { formatarMoeda, formatarDataBr, dataPorExtenso } from '@/lib/masks';

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

  // Detecta se o serviço tem múltiplas linhas ou é longo
  const isServicoLongo = (med.servico_prestado || '').length > 120 || (med.servico_prestado || '').includes('\n');

  return (
    <div className={`receipt-sheet-medico print-sheet-medico receipt-sheet print-document print-sheet bg-white border-2 border-slate-900 shadow-sm ${
      isServicoLongo
        ? 'p-3.5 sm:p-5 print:p-3 print:py-2 max-w-2xl'
        : 'p-4 sm:p-6 print:p-3.5 print:py-2.5 max-w-2xl'
    } w-full text-slate-950 font-sans leading-relaxed text-xs mx-auto`}>
      {/* Cabeçalho Oficial do Modelo com Logo ABEAS */}
      <div className={`med-header text-center border-b-2 border-slate-900 ${isServicoLongo ? 'pb-1.5 mb-1.5' : 'pb-2 mb-2'}`}>
        <div className="flex justify-center mb-0.5">
          <img
            src="/abeas_logo.png"
            alt="ABEAS"
            className={`${isServicoLongo ? 'h-10 print:h-9' : 'h-11 print:h-10'} w-auto object-contain mx-auto`}
          />
        </div>
        <div className="med-subtitle text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-800 font-bold mb-0.5">
          ABEAS - Associação Brasileira de Entidades de Assistência Social
        </div>
        <div className="med-cnpj text-[10px] sm:text-[10.5px] text-slate-950 font-mono font-bold mb-1">
          CNPJ: 04.547.278/0005-68.
        </div>
        <h1 className="med-title text-base sm:text-lg font-black uppercase text-black tracking-tight">
          RECIBO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS
        </h1>
      </div>

      {/* Linha com Número e Valor em Destaque */}
      <div className={`med-destaque flex flex-wrap items-center justify-between gap-2 px-3 ${
        isServicoLongo ? 'py-1 mb-1.5 print:py-0.5' : 'py-1.5 mb-2'
      } bg-slate-100 border-2 border-slate-900 rounded-lg`}>
        <div>
          <span className="text-[10.5px] sm:text-[11px] font-black text-slate-950 uppercase tracking-wider">
            Recibo nº:{' '}
          </span>
          <span className="text-xs sm:text-sm font-black font-mono text-black ml-1">
            {numero}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10.5px] sm:text-[11px] font-black text-slate-950 uppercase tracking-wider">
            Valor:{' '}
          </span>
          <span className="text-sm sm:text-base font-black text-black ml-1">
            {formatarMoeda(valor)}
          </span>
        </div>
      </div>

      <div className={`med-content ${isServicoLongo ? 'space-y-1.5 print:space-y-1' : 'space-y-2 print:space-y-1.5'} text-[11px] print:text-[10px] text-slate-950 leading-snug print:leading-tight`}>
        {/* Texto Fixo Declaratório da ABEAS */}
        <p className="leading-snug text-justify font-medium text-black">
          {ABEAS_FIXA.texto_declaracao}
        </p>

        {/* Seção: DADOS DO PAGADOR */}
        <div className="med-card border border-slate-900 rounded-md overflow-hidden bg-white">
          <div className="med-card-header bg-slate-100 px-2.5 py-0.5 border-b border-slate-900 text-[9.5px] sm:text-[10px] font-black text-black uppercase tracking-wider">
            DADOS DO PAGADOR
          </div>
          <div className="med-card-body p-1.5 space-y-0.5 text-[10.5px] sm:text-[11px] print:text-[9.5px] text-slate-950 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
              <div>
                <span className="font-bold text-black">Nome/Razão Social: </span>
                <span className="font-semibold text-slate-950">{med.pagador_nome}</span>
              </div>
              <div>
                <span className="font-bold text-black">CPF/CNPJ: </span>
                <span className="font-mono font-bold text-slate-950">{med.pagador_documento}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5 border-t border-slate-200">
              <div>
                <span className="font-bold text-black">Telefone: </span>
                <span className="text-slate-950">{med.pagador_telefone || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-black">Endereço: </span>
                <span className="text-slate-950">{med.pagador_endereco || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Texto Intermediário com Valor e Extenso Automáticos */}
        <p className="leading-snug text-justify text-black">
          A quantia supra de <b>{formatarMoeda(valor)}</b> (<i>{valor_extenso}</i>), referente à prestação de serviços médicos particulares realizados no(a) paciente abaixo qualificado(a):
        </p>

        {/* Seção: DADOS DO PACIENTE */}
        <div className="med-card border border-slate-900 rounded-md overflow-hidden bg-white">
          <div className="med-card-header bg-slate-100 px-2.5 py-0.5 border-b border-slate-900 text-[9.5px] sm:text-[10px] font-black text-black uppercase tracking-wider">
            DADOS DO PACIENTE
          </div>
          <div className="med-card-body p-1.5 space-y-0.5 text-[10.5px] sm:text-[11px] print:text-[9.5px] text-slate-950 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
              <div>
                <span className="font-bold text-black">Nome do Paciente: </span>
                <span className="font-semibold text-slate-950">{med.paciente_nome}</span>
              </div>
              <div>
                <span className="font-bold text-black">CPF do Paciente: </span>
                <span className="font-mono font-bold text-slate-950">{med.paciente_cpf}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5 border-t border-slate-200">
              <div>
                <span className="font-bold text-black">Telefone: </span>
                <span className="text-slate-950">{med.paciente_telefone || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-black">Endereço: </span>
                <span className="text-slate-950">{med.paciente_endereco || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção: DETALHES DO ATENDIMENTO */}
        <div className="med-card border border-slate-900 rounded-md overflow-hidden bg-white">
          <div className="med-card-header bg-slate-100 px-2.5 py-0.5 border-b border-slate-900 text-[9.5px] sm:text-[10px] font-black text-black uppercase tracking-wider">
            DETALHES DO ATENDIMENTO:
          </div>
          <div className="med-card-body p-1.5 space-y-0.5 text-[10.5px] sm:text-[11px] print:text-[9.5px] text-slate-950 bg-white">
            <div>
              <span className="font-bold text-black">Serviço prestado: </span>
              <span className="font-semibold text-slate-950 whitespace-pre-line">{med.servico_prestado}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5 border-t border-slate-200">
              <div>
                <span className="font-bold text-black">Médico(a) assistente: </span>
                <span className="font-semibold text-slate-950">{med.medico_assistente}</span>
              </div>
              <div>
                <span className="font-bold text-black">CRM: </span>
                <span className="font-mono font-bold text-slate-950">{med.crm}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5 border-t border-slate-200">
              <div>
                <span className="font-bold text-black">Data do atendimento: </span>
                <span className="font-semibold text-slate-950">{formatarDataBr(med.data_atendimento)}</span>
              </div>
              <div>
                <span className="font-bold text-black">Forma de pagamento: </span>
                <span className="font-semibold text-slate-950">{med.forma_pagamento}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Texto Final Fixo */}
        <p className="leading-snug text-justify font-medium pt-0.5 text-black">
          {ABEAS_FIXA.texto_final}
        </p>

        {/* Local e Data */}
        <div className="pt-0.5 text-right text-[10.5px] sm:text-[11px] print:text-[10px] text-black font-bold">
          {med.cidade || 'Itapuranga'} - {med.uf || 'GO'}, {dataPorExtenso(data_emissao)}.
        </div>

        {/* Assinatura Oficial Fixa da ABEAS */}
        <div className={`med-signature ${isServicoLongo ? 'pt-2 print:pt-1.5' : 'pt-3 print:pt-2'} text-center avoid-page-break`}>
          <div className="med-signature-line w-64 sm:w-72 mx-auto border-t-2 border-slate-900 mb-0.5" />
          <div className="font-black text-xs uppercase text-black">
            {ABEAS_FIXA.razao_social}
          </div>
          <div className="text-[10px] sm:text-[10.5px] text-slate-950 font-mono font-bold">
            CNPJ: {ABEAS_FIXA.cnpj}
          </div>
        </div>
      </div>

      {/* Rodapé Interno */}
      <div className={`med-footer ${isServicoLongo ? 'mt-2 print:mt-1 pt-1' : 'mt-3 print:mt-1.5 pt-1.5'} border-t border-slate-900 flex items-center justify-between text-[9px] sm:text-[9.5px] print:text-[8.5px] text-slate-950 font-bold`}>
        <div>Documento Oficial de Prestação de Serviços Médicos Particulares</div>
        <div>Emissor: {usuario_nome || 'Sistema'}</div>
      </div>
    </div>
  );
};
