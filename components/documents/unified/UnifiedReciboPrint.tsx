'use client';

import React from 'react';
import { Empresa, SistemaConfig } from '@/lib/types';
import { formatarMoeda, mascaraCnpj, dataPorExtenso } from '@/lib/masks';

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
  } = dados;

  const logoExibicao = logo_url || emissora?.logo_url;
  const nomeEmissora =
    emissora?.nome_fantasia || emissora?.razao_social || config?.nome_organizacao || 'Empresa Emissora';

  return (
    <div className="receipt-sheet print-document print-sheet bg-white border border-slate-300 shadow-sm p-6 sm:p-10 max-w-2xl w-full text-slate-900 font-sans leading-relaxed text-xs sm:text-sm mx-auto">
      {/* Cabeçalho do Recibo */}
      <div className="text-center pb-5 border-b border-slate-300">
        {/* Logotipo da Empresa Emissora (se cadastrado ou anexado) - Sem logo da ABEAS fixo aqui */}
        {logoExibicao && (
          <div className="flex justify-center mb-3">
            <img
              src={logoExibicao}
              alt={nomeEmissora}
              className="max-h-16 max-w-[240px] object-contain"
            />
          </div>
        )}

        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
          {nomeEmissora}
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 uppercase">
          RECIBO
        </h1>
        <div className="text-sm font-semibold text-slate-700 font-mono mt-1">
          Nº {numero}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
          {via === '1' ? '1ª VIA - DESTINATÁRIO' : '2ª VIA - EMISSOR / ARQUIVO'}
        </div>
      </div>

      {/* Destaque do Valor */}
      <div className="my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-sans">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          VALOR TOTAL:
        </span>
        <span className="text-xl md:text-2xl font-bold text-slate-900 tabular-nums">
          {formatarMoeda(valor)}
        </span>
      </div>

      {/* Corpo do Recibo */}
      <div className="space-y-5 text-xs sm:text-sm text-slate-800">
        <div>
          <span className="font-bold block text-[11px] font-sans text-slate-600 uppercase tracking-wider mb-0.5">
            RECEBEMOS DE:
          </span>
          <div className="font-bold text-sm sm:text-base text-slate-900">
            {destinataria?.razao_social || 'EMPRESA DESTINATÁRIA'}
          </div>
          <div className="text-xs font-sans text-slate-600 font-mono mt-0.5">
            CNPJ: {destinataria ? mascaraCnpj(destinataria.cnpj) : '00.000.000/0001-00'}
          </div>
          {destinataria?.endereco && (
            <div className="text-xs font-sans text-slate-500 mt-0.5">
              {destinataria.endereco}, {destinataria.numero} - {destinataria.bairro}, {destinataria.cidade}/{destinataria.uf}
            </div>
          )}
        </div>

        <div>
          <span className="font-bold block text-[11px] font-sans text-slate-600 uppercase tracking-wider mb-0.5">
            O VALOR DE:
          </span>
          <div className="font-semibold text-slate-900 text-sm">
            {formatarMoeda(valor)}
          </div>
          <div className="text-xs text-slate-700 italic mt-0.5 font-sans">
            ({valor_extenso})
          </div>
        </div>

        <div>
          <span className="font-bold block text-[11px] font-sans text-slate-600 uppercase tracking-wider mb-0.5">
            REFERENTE A:
          </span>
          <p className="text-slate-800 text-justify whitespace-pre-line leading-relaxed">
            {referente}
          </p>
        </div>

        {observacoes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-sans">
            <span className="font-semibold text-slate-700">Observações: </span>
            {observacoes}
          </div>
        )}

        {/* Data e Local */}
        <div className="pt-3 text-right font-sans text-xs text-slate-700 font-medium">
          {cidade_emissao || 'Brasília/DF'}, {dataPorExtenso(data_emissao)}.
        </div>

        {/* Assinatura */}
        <div className="pt-8 text-center avoid-page-break">
          <div className="w-72 mx-auto border-t border-slate-400 mb-2" />
          <div className="font-bold text-xs uppercase text-slate-900 font-sans">
            {emissora?.razao_social || 'EMPRESA EMISSORA'}
          </div>
          <div className="text-[11px] text-slate-500 font-sans font-mono">
            CNPJ: {emissora ? mascaraCnpj(emissora.cnpj) : '00.000.000/0001-00'}
          </div>
        </div>
      </div>

      {/* Rodapé Interno */}
      <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-sans">
        <div>{config?.mensagem_rodape || 'Documento emitido eletronicamente pelo Sistema Oficial de Recibos e RDC.'}</div>
        <div>Emissor: {usuario_nome || 'Sistema'}</div>
      </div>
    </div>
  );
};
