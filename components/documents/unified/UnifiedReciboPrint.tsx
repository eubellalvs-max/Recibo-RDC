'use client';

import React from 'react';
import { Empresa, SistemaConfig, RetencaoImpostosRecibo } from '@/lib/types';
import { formatarMoeda, mascaraCnpj, mascaraCpf, dataPorExtenso } from '@/lib/masks';

export interface UnifiedReciboData {
  numero: string;
  valor: number;
  valor_extenso: string;
  referente: string;
  data_emissao: string;
  cidade_emissao?: string;
  observacoes?: string;
  logo_url?: string;
  usuario_nome?: string;
  emissora?: Empresa;
  destinataria?: Empresa;
  retencao_impostos?: RetencaoImpostosRecibo;
}

interface UnifiedReciboPrintProps {
  dados: UnifiedReciboData;
  config?: Partial<SistemaConfig>;
  via?: '1' | '2';
}

export const UnifiedReciboPrint: React.FC<UnifiedReciboPrintProps> = ({
  dados,
  config,
  via = '1',
}) => {
  const {
    numero,
    valor,
    valor_extenso,
    referente,
    data_emissao,
    cidade_emissao,
    observacoes,
    logo_url,
    usuario_nome,
    emissora,
    destinataria,
    retencao_impostos,
  } = dados;

  const temRetencao = !!retencao_impostos?.possui_retencao;
  const isDescricaoLonga = (referente || '').length > 250;
  const logoExibicao = logo_url || emissora?.logo_url;
  const nomeEmissora =
    emissora?.nome_fantasia || emissora?.razao_social || config?.nome_organizacao || 'Empresa Emissora';

  const isDestinatariaPf =
    destinataria?.tipo_pessoa === 'PF' ||
    (destinataria?.cnpj && destinataria.cnpj.replace(/\D/g, '').length === 11);
  const docDestinataria = destinataria
    ? isDestinatariaPf
      ? mascaraCpf(destinataria.cnpj)
      : mascaraCnpj(destinataria.cnpj)
    : '00.000.000/0001-00';
  const labelDocDestinataria = isDestinatariaPf ? 'CPF' : 'CNPJ';

  const isEmissoraPf =
    emissora?.tipo_pessoa === 'PF' ||
    (emissora?.cnpj && emissora.cnpj.replace(/\D/g, '').length === 11);
  const docEmissora = emissora
    ? isEmissoraPf
      ? mascaraCpf(emissora.cnpj)
      : mascaraCnpj(emissora.cnpj)
    : '00.000.000/0001-00';
  const labelDocEmissora = isEmissoraPf ? 'CPF' : 'CNPJ';

  return (
    <div
      className={`receipt-sheet print-document print-sheet bg-white border-2 border-slate-900 shadow-md ${
        temRetencao || isDescricaoLonga
          ? 'p-4 sm:p-6 print:p-3 print:py-2 max-w-2xl'
          : 'p-6 sm:p-8 print:p-4 print:py-3 max-w-2xl'
      } w-full text-slate-950 font-sans leading-relaxed text-xs sm:text-sm mx-auto`}
    >
      {/* Cabeçalho Oficial do Recibo */}
      <div className={`text-center ${temRetencao || isDescricaoLonga ? 'pb-2 print:pb-1.5' : 'pb-4 print:pb-2.5'} border-b-2 border-slate-900`}>
        {/* Logotipo da Empresa Emissora (se cadastrado ou anexado) */}
        {logoExibicao && (
          <div className={`flex justify-center ${temRetencao || isDescricaoLonga ? 'mb-1 print:mb-0.5' : 'mb-2.5 print:mb-1'}`}>
            <img
              src={logoExibicao}
              alt={nomeEmissora}
              className={`${temRetencao || isDescricaoLonga ? 'max-h-11 print:max-h-9' : 'max-h-14 print:max-h-11'} max-w-[240px] object-contain`}
            />
          </div>
        )}

        <div className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-950 font-bold mb-0.5">
          {nomeEmissora}
        </div>
        <h1 className={`${temRetencao || isDescricaoLonga ? 'text-lg sm:text-xl print:text-lg' : 'text-xl md:text-2xl print:text-xl'} font-black tracking-tight text-black uppercase`}>
          RECIBO
        </h1>
        <div className="text-xs sm:text-sm font-black text-black font-mono mt-0.5">
          Nº {numero}
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-900 mt-0.5 font-bold tracking-wider">
          {via === '1' ? '1ª VIA - DESTINATÁRIO' : '2ª VIA - EMISSOR / ARQUIVO'}
        </div>
      </div>

      {/* Destaque do Valor */}
      {temRetencao && retencao_impostos ? (
        <div className="my-2 print:my-1.5 p-2.5 print:py-1.5 print:px-2 bg-slate-100 border-2 border-slate-900 rounded-lg font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-wider">
              VALOR LÍQUIDO A RECEBER:
            </span>
            <span className="text-lg sm:text-xl print:text-lg font-black text-black tabular-nums">
              {formatarMoeda(retencao_impostos.valor_liquido)}
            </span>
          </div>
          <div className="mt-1 pt-1 print:mt-0.5 print:pt-0.5 border-t border-slate-300 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-800 font-semibold">
            <span>Valor Bruto: <b className="text-slate-950 font-bold">{formatarMoeda(retencao_impostos.valor_bruto)}</b></span>
            <span>Total Deduções / Retenções: <b className="text-red-700 font-bold">-{formatarMoeda(retencao_impostos.total_deducoes)}</b></span>
          </div>
        </div>
      ) : (
        <div className="my-3 print:my-2 p-3 print:py-2 print:px-2.5 bg-slate-100 border-2 border-slate-900 rounded-lg flex items-center justify-between font-sans">
          <span className="text-xs font-black text-slate-950 uppercase tracking-wider">
            VALOR TOTAL:
          </span>
          <span className="text-xl md:text-2xl print:text-xl font-black text-black tabular-nums">
            {formatarMoeda(valor)}
          </span>
        </div>
      )}

      {/* Corpo do Recibo */}
      <div className={`${temRetencao || isDescricaoLonga ? 'space-y-2 print:space-y-1.5' : 'space-y-4 print:space-y-2.5'} text-xs sm:text-sm text-slate-950`}>
        <div>
          <span className="font-black block text-[10px] sm:text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            RECEBEMOS DE:
          </span>
          <div className="font-black text-xs sm:text-sm text-black">
            {destinataria?.razao_social || 'DESTINATÁRIO (PAGADOR)'}
          </div>
          <div className="text-[11px] sm:text-xs font-sans text-slate-950 font-mono mt-0.5 font-bold">
            {labelDocDestinataria}: {docDestinataria}
          </div>
          {destinataria?.endereco && (
            <div className="text-[10px] sm:text-xs font-sans text-slate-900 mt-0.5 font-semibold">
              {destinataria.endereco}, {destinataria.numero} - {destinataria.bairro}, {destinataria.cidade}/{destinataria.uf}
            </div>
          )}
        </div>

        <div>
          <span className="font-black block text-[10px] sm:text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            O VALOR DE:
          </span>
          <div className="font-black text-black text-xs sm:text-sm">
            {temRetencao && retencao_impostos
              ? formatarMoeda(retencao_impostos.valor_liquido)
              : formatarMoeda(valor)}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-950 italic mt-0.5 font-sans font-bold">
            ({valor_extenso})
          </div>
        </div>

        <div>
          <span className="font-black block text-[10px] sm:text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            REFERENTE A:
          </span>
          <p className={`text-black text-justify whitespace-pre-line leading-relaxed font-medium ${
            isDescricaoLonga ? 'text-xs print:text-[10.5px] print:leading-tight' : 'text-xs sm:text-sm print:text-[11px] print:leading-snug'
          }`}>
            {referente}
          </p>
        </div>

        {/* DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES (SE SELECIONADO SIM) */}
        {temRetencao && retencao_impostos && (
          <div className="border border-slate-900 rounded-lg p-2 print:p-1.5 bg-slate-50 font-sans text-[11px] print:text-[10px] avoid-page-break my-1.5 print:my-1">
            <div className="font-black text-[10px] sm:text-[11px] uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-1 text-center">
              DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES
            </div>
            <table className="w-full text-[11px] print:text-[9.5px] border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-0.5 text-slate-800 font-semibold">Valor Bruto</td>
                  <td className="py-0.5 text-right font-bold text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.valor_bruto)}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-slate-800 font-semibold">Base de Cálculo do IRRF</td>
                  <td className="py-0.5 text-right font-medium text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.base_calculo_irrf)}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-slate-800 font-semibold">Alíquota do IR</td>
                  <td className="py-0.5 text-right font-medium text-slate-950 tabular-nums">{retencao_impostos.aliquota_ir.toFixed(1).replace('.', ',')}%</td>
                </tr>
                {retencao_impostos.parcela_deduzir_ir > 0 && (
                  <tr>
                    <td className="py-0.5 text-slate-800 font-semibold">Parcela a Deduzir (Tabela Progressiva)</td>
                    <td className="py-0.5 text-right font-medium text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.parcela_deduzir_ir)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-0.5 text-slate-900 font-bold">Valor do IRRF Retido na Fonte</td>
                  <td className="py-0.5 text-right font-bold text-red-700 tabular-nums">-{formatarMoeda(retencao_impostos.valor_irrf)}</td>
                </tr>
                {retencao_impostos.outras_deducoes > 0 && (
                  <tr>
                    <td className="py-0.5 text-slate-800 font-semibold">
                      Outras Deduções Permitidas {retencao_impostos.descricao_outras_deducoes ? `(${retencao_impostos.descricao_outras_deducoes})` : ''}
                    </td>
                    <td className="py-0.5 text-right font-bold text-red-700 tabular-nums">-{formatarMoeda(retencao_impostos.outras_deducoes)}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-900 font-bold">
                  <td className="py-0.5 text-slate-900 font-bold">Total de Deduções</td>
                  <td className="py-0.5 text-right font-bold text-red-800 tabular-nums">-{formatarMoeda(retencao_impostos.total_deducoes)}</td>
                </tr>
                <tr className="border-t border-slate-900 bg-slate-100 font-black">
                  <td className="py-1 px-1 text-slate-950 uppercase tracking-wide">Valor Líquido a Receber</td>
                  <td className="py-1 px-1 text-right text-xs sm:text-sm print:text-xs font-black text-black tabular-nums">{formatarMoeda(retencao_impostos.valor_liquido)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {observacoes && (
          <div className="p-2 print:p-1.5 bg-slate-100 border border-slate-900 rounded text-[11px] print:text-[10px] font-sans">
            <span className="font-black text-black">Observações: </span>
            <span className="font-medium text-slate-950">{observacoes}</span>
          </div>
        )}

        {/* Data e Local */}
        <div className={`${temRetencao || isDescricaoLonga ? 'pt-1 print:pt-0.5' : 'pt-2.5 print:pt-1.5'} text-right font-sans text-xs print:text-[11px] text-black font-bold`}>
          {cidade_emissao || 'Brasília/DF'}, {dataPorExtenso(data_emissao)}.
        </div>

        {/* Assinatura */}
        <div className={`${temRetencao || isDescricaoLonga ? 'pt-2.5 print:pt-2' : 'pt-6 print:pt-4'} text-center avoid-page-break`}>
          <div className="w-64 sm:w-72 mx-auto border-t-2 border-slate-900 mb-1" />
          <div className="font-black text-xs uppercase text-black font-sans">
            {emissora?.razao_social || 'EMISSOR'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-950 font-sans font-mono font-bold">
            {labelDocEmissora}: {docEmissora}
          </div>
        </div>
      </div>

      {/* Rodapé Interno */}
      <div className={`${temRetencao || isDescricaoLonga ? 'mt-2.5 print:mt-1.5 pt-1' : 'mt-6 print:mt-3 pt-2'} border-t border-slate-900 flex items-center justify-between text-[9px] sm:text-[10px] print:text-[8.5px] text-slate-950 font-sans font-semibold`}>
        <div>{config?.mensagem_rodape || 'Documento emitido eletronicamente pelo Sistema Oficial de Recibos e RDC.'}</div>
        <div>Emissor: {usuario_nome || 'Sistema'}</div>
      </div>
    </div>
  );
};
