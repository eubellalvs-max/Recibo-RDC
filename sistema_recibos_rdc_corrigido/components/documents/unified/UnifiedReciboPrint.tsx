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
    <div className="receipt-sheet print-document print-sheet bg-white border-2 border-slate-900 shadow-md p-6 sm:p-10 max-w-2xl w-full text-slate-950 font-sans leading-relaxed text-xs sm:text-sm mx-auto">
      {/* Cabeçalho do Recibo */}
      <div className="text-center pb-5 border-b-2 border-slate-900">
        {/* Logotipo da Empresa Emissora (se cadastrado ou anexado) */}
        {logoExibicao && (
          <div className="flex justify-center mb-3">
            <img
              src={logoExibicao}
              alt={nomeEmissora}
              className="max-h-16 max-w-[240px] object-contain"
            />
          </div>
        )}

        <div className="text-xs uppercase tracking-widest text-slate-950 font-bold mb-1">
          {nomeEmissora}
        </div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-black uppercase">
          RECIBO
        </h1>
        <div className="text-sm font-black text-black font-mono mt-1">
          Nº {numero}
        </div>
        <div className="text-[11px] text-slate-900 mt-0.5 font-bold tracking-wider">
          {via === '1' ? '1ª VIA - DESTINATÁRIO' : '2ª VIA - EMISSOR / ARQUIVO'}
        </div>
      </div>

      {/* Destaque do Valor */}
      {retencao_impostos?.possui_retencao ? (
        <div className="my-5 p-3.5 bg-slate-100 border-2 border-slate-900 rounded-lg font-sans">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider">
              VALOR LÍQUIDO A RECEBER:
            </span>
            <span className="text-xl md:text-2xl font-black text-black tabular-nums">
              {formatarMoeda(retencao_impostos.valor_liquido)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-800 font-semibold">
            <span>Valor Bruto: <b className="text-slate-950 font-bold">{formatarMoeda(retencao_impostos.valor_bruto)}</b></span>
            <span>Total Deduções / Retenções: <b className="text-red-700 font-bold">-{formatarMoeda(retencao_impostos.total_deducoes)}</b></span>
          </div>
        </div>
      ) : (
        <div className="my-5 p-3.5 bg-slate-100 border-2 border-slate-900 rounded-lg flex items-center justify-between font-sans">
          <span className="text-xs font-black text-slate-950 uppercase tracking-wider">
            VALOR TOTAL:
          </span>
          <span className="text-xl md:text-2xl font-black text-black tabular-nums">
            {formatarMoeda(valor)}
          </span>
        </div>
      )}

      {/* Corpo do Recibo */}
      <div className="space-y-5 text-xs sm:text-sm text-slate-950">
        <div>
          <span className="font-black block text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            RECEBEMOS DE:
          </span>
          <div className="font-black text-sm sm:text-base text-black">
            {destinataria?.razao_social || 'DESTINATÁRIO (PAGADOR)'}
          </div>
          <div className="text-xs font-sans text-slate-950 font-mono mt-0.5 font-bold">
            {labelDocDestinataria}: {docDestinataria}
          </div>
          {destinataria?.endereco && (
            <div className="text-xs font-sans text-slate-900 mt-0.5 font-semibold">
              {destinataria.endereco}, {destinataria.numero} - {destinataria.bairro}, {destinataria.cidade}/{destinataria.uf}
            </div>
          )}
        </div>

        <div>
          <span className="font-black block text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            O VALOR DE:
          </span>
          <div className="font-black text-black text-sm sm:text-base">
            {retencao_impostos?.possui_retencao
              ? formatarMoeda(retencao_impostos.valor_liquido)
              : formatarMoeda(valor)}
          </div>
          <div className="text-xs text-slate-950 italic mt-0.5 font-sans font-bold">
            ({valor_extenso})
          </div>
          {retencao_impostos?.possui_retencao && (
            <div className="text-[11px] text-slate-700 font-medium mt-1 leading-snug">
              Valor líquido a receber resultante da dedução de {formatarMoeda(retencao_impostos.total_deducoes)} (IRRF: {formatarMoeda(retencao_impostos.valor_irrf)}{retencao_impostos.outras_deducoes > 0 ? ` · Outras deduções: ${formatarMoeda(retencao_impostos.outras_deducoes)}` : ''}) incidente sobre o valor bruto de {formatarMoeda(retencao_impostos.valor_bruto)}.
            </div>
          )}
        </div>

        <div>
          <span className="font-black block text-[11px] font-sans text-slate-950 uppercase tracking-wider mb-0.5">
            REFERENTE A:
          </span>
          <p className="text-black text-justify whitespace-pre-line leading-relaxed font-medium">
            {referente}
          </p>
        </div>

        {/* DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES (SE SELECIONADO SIM) */}
        {retencao_impostos?.possui_retencao && (
          <div className="border-2 border-slate-900 rounded-lg p-3.5 bg-slate-50 font-sans text-xs avoid-page-break my-3">
            <div className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-black border-b-2 border-slate-900 pb-1.5 mb-2.5 text-center">
              DEMONSTRATIVO DE IMPOSTOS E DEDUÇÕES
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1 text-slate-800 font-semibold">Valor Bruto</td>
                  <td className="py-1 text-right font-bold text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.valor_bruto)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-800 font-semibold">Base de Cálculo do IRRF</td>
                  <td className="py-1 text-right font-medium text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.base_calculo_irrf)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-800 font-semibold">Alíquota do IR</td>
                  <td className="py-1 text-right font-medium text-slate-950 tabular-nums">{retencao_impostos.aliquota_ir.toFixed(1).replace('.', ',')}%</td>
                </tr>
                {retencao_impostos.parcela_deduzir_ir > 0 && (
                  <tr>
                    <td className="py-1 text-slate-800 font-semibold">Parcela a Deduzir (Tabela Progressiva)</td>
                    <td className="py-1 text-right font-medium text-slate-950 tabular-nums">{formatarMoeda(retencao_impostos.parcela_deduzir_ir)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-slate-900 font-bold">Valor do IRRF Retido na Fonte</td>
                  <td className="py-1 text-right font-bold text-red-700 tabular-nums">-{formatarMoeda(retencao_impostos.valor_irrf)}</td>
                </tr>
                {retencao_impostos.outras_deducoes > 0 && (
                  <tr>
                    <td className="py-1 text-slate-800 font-semibold">
                      Outras Deduções Permitidas {retencao_impostos.descricao_outras_deducoes ? `(${retencao_impostos.descricao_outras_deducoes})` : ''}
                    </td>
                    <td className="py-1 text-right font-bold text-red-700 tabular-nums">-{formatarMoeda(retencao_impostos.outras_deducoes)}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-900 font-bold">
                  <td className="py-1 text-slate-900 font-bold">Total de Deduções</td>
                  <td className="py-1 text-right font-bold text-red-800 tabular-nums">-{formatarMoeda(retencao_impostos.total_deducoes)}</td>
                </tr>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-black">
                  <td className="py-1.5 px-1 text-slate-950 uppercase tracking-wide">Valor Líquido a Receber</td>
                  <td className="py-1.5 px-1 text-right text-sm font-black text-black tabular-nums">{formatarMoeda(retencao_impostos.valor_liquido)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {observacoes && (
          <div className="p-3 bg-slate-100 border border-slate-900 rounded text-xs text-slate-950 font-sans">
            <span className="font-black text-black">Observações: </span>
            <span className="font-medium text-slate-950">{observacoes}</span>
          </div>
        )}

        {/* Data e Local */}
        <div className="pt-3 text-right font-sans text-xs text-black font-bold">
          {cidade_emissao || 'Brasília/DF'}, {dataPorExtenso(data_emissao)}.
        </div>

        {/* Assinatura */}
        <div className="pt-8 text-center avoid-page-break">
          <div className="w-72 mx-auto border-t-2 border-slate-900 mb-2" />
          <div className="font-black text-xs uppercase text-black font-sans">
            {emissora?.razao_social || 'EMISSOR'}
          </div>
          <div className="text-[11px] text-slate-950 font-sans font-mono font-bold">
            {labelDocEmissora}: {docEmissora}
          </div>
        </div>
      </div>

      {/* Rodapé Interno */}
      <div className="mt-8 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-950 font-sans font-semibold">
        <div>{config?.mensagem_rodape || 'Documento emitido eletronicamente pelo Sistema Oficial de Recibos e RDC.'}</div>
        <div>Emissor: {usuario_nome || 'Sistema'}</div>
      </div>
    </div>
  );
};
