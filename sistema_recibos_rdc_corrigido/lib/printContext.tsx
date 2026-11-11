'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  Documento,
  Empresa,
  SistemaConfig,
  TipoGastoConfig,
  TipoDocConfig,
  DadosRdc,
  DadosReciboMedico,
  RetencaoImpostosRecibo,
} from './types';
import { StorageService } from './storage';
import { imprimirViaIframe } from './printService';

export interface PrintItem {
  tipo: 'recibo' | 'rdc' | 'recibo_medico' | 'relatorio_financeiro';
  numero: string;
  via?: '1' | '2';
  dadosRecibo?: {
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
    config?: Partial<SistemaConfig>;
    retencao_impostos?: RetencaoImpostosRecibo;
  };
  dadosRdc?: {
    numero: string;
    detalhes: DadosRdc;
    tiposGasto: TipoGastoConfig[];
    tiposDoc: TipoDocConfig[];
  };
  dadosReciboMedico?: {
    numero: string;
    valor: number;
    valor_extenso: string;
    data_emissao: string;
    usuario_nome?: string;
    detalhes: DadosReciboMedico;
  };
  dadosRelatorioFinanceiro?: {
    empresaNome: string;
    periodoFormatado: string;
    dataGeracaoFormatada: string;
    usuarioGeradorNome: string;
    resumo: any;
    itens: any[];
    orientacao?: 'retrato' | 'paisagem';
  };
}

export function buildPrintItemFromDocumento(
  doc: Documento,
  via: '1' | '2' = '1',
  empresasCustom?: Empresa[],
  configCustom?: SistemaConfig
): PrintItem {
  const empresas = empresasCustom || StorageService.getEmpresas();
  const config = configCustom || StorageService.getConfig();

  const emissora = empresas.find((e) => e.id === doc.empresa_emissora_id);
  const destinataria = empresas.find((e) => e.id === doc.empresa_destinataria_id);

  const retencaoEfetiva =
    doc.retencao_impostos ||
    ((doc.rdc_detalhes as unknown as Record<string, unknown> | undefined)?.__retencao_impostos as
      | Documento['retencao_impostos']
      | undefined);

  if (doc.tipo === 'rdc' && doc.rdc_detalhes) {
    return {
      tipo: 'rdc',
      numero: doc.numero,
      via,
      dadosRdc: {
        numero: doc.numero,
        detalhes: doc.rdc_detalhes as DadosRdc,
        tiposGasto: config.tipos_gasto || StorageService.getTiposGasto(),
        tiposDoc: config.tipos_doc || StorageService.getTiposDoc(),
      },
    };
  }

  if (doc.tipo === 'recibo_medico' && doc.recibo_medico_detalhes) {
    return {
      tipo: 'recibo_medico',
      numero: doc.numero,
      dadosReciboMedico: {
        numero: doc.numero,
        valor: doc.valor,
        valor_extenso: doc.valor_extenso,
        data_emissao: doc.data_emissao,
        usuario_nome: doc.usuario_nome,
        detalhes: doc.recibo_medico_detalhes,
      },
    };
  }

  // Recibo comum (com ou sem retenção de IR)
  return {
    tipo: 'recibo',
    numero: doc.numero,
    via,
    dadosRecibo: {
      numero: doc.numero,
      valor: doc.valor,
      valor_extenso: doc.valor_extenso,
      referente: doc.referente,
      data_emissao: doc.data_emissao,
      cidade_emissao: doc.cidade_emissao,
      observacoes: doc.observacoes,
      logo_url: doc.logo_url,
      usuario_nome: doc.usuario_nome,
      emissora,
      destinataria,
      config,
      retencao_impostos: retencaoEfetiva,
    },
  };
}

/**
 * Executa a rotina de impressão nativa do navegador garantindo:
 * 1. O DOM do documento está 100% montado e presente em #print-receipt
 * 2. Todas as imagens (logos, brasões) estão decodificadas e carregadas
 * 3. O título da página é sanitizado para "Salvar como PDF"
 * 4. Nenhum corte ou página em branco é gerado no Chrome
 */
export async function executarImpressaoNativa(item: PrintItem, tituloCustom?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  const cleanNum = item.numero ? item.numero.replace(/[\/\\]/g, '-') : 'doc';
  const tipoSanitizado = item.tipo.toLowerCase().replace(/\s+/g, '_');
  document.title = tituloCustom || `${tipoSanitizado}_${cleanNum}`;

  // 1. Aguarda até que o container #print-receipt contenha nós filhos
  const maxWaitMs = 1200;
  const intervalMs = 30;
  let elapsed = 0;

  while (elapsed < maxWaitMs) {
    const printEl = document.getElementById('print-receipt');
    if (printEl && printEl.children && printEl.children.length > 0) {
      break;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    elapsed += intervalMs;
  }

  // 2. Aguarda o carregamento e decodificação de todas as imagens dentro de #print-area
  const images = Array.from(document.querySelectorAll('#print-area img')) as HTMLImageElement[];
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 400);
        });
      })
    );
  }

  // 3. Aguarda dois frames de renderização do browser para consolidar estilos CSS e layout
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 60);
      });
    });
  });

  // 4. Dispara a janela nativa de impressão / PDF do navegador
  try {
    window.print();
  } catch (err) {
    console.error('Erro ao acionar window.print():', err);
  }

  // 5. Restaura o título original após a impressão
  const restoreTitle = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };
  window.addEventListener('afterprint', restoreTitle);
  setTimeout(restoreTitle, 2500);
}

/**
 * Dispara a impressão universal de alta fidelidade:
 * Primeiro via iframe isolado (que elimina qualquer corte, sobreposição e tela em branco).
 * Em caso de fallback, utiliza executarImpressaoNativa.
 */
export async function dispararImpressaoUniversal(item: PrintItem, tituloCustom?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  const cleanNum = item.numero ? item.numero.replace(/[\/\\]/g, '-') : 'doc';
  const tipoSanitizado = item.tipo.toLowerCase().replace(/\s+/g, '_');
  const title = tituloCustom || `${tipoSanitizado}_${cleanNum}`;
  document.title = title;

  // 1. Aguarda até que o container #print-receipt contenha nós filhos
  const maxWaitMs = 1200;
  const intervalMs = 30;
  let elapsed = 0;

  while (elapsed < maxWaitMs) {
    const printEl = document.getElementById('print-receipt');
    if (printEl && printEl.children && printEl.children.length > 0) {
      break;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    elapsed += intervalMs;
  }

  // 2. Aguarda decodificação de imagens
  const images = Array.from(document.querySelectorAll('#print-area img')) as HTMLImageElement[];
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 400);
        });
      })
    );
  }

  // 3. Dois ticks de renderização
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 60);
      });
    });
  });

  const printEl = document.getElementById('print-receipt');
  const htmlContent = printEl ? printEl.innerHTML : '';
  const isPaisagem = item.tipo === 'relatorio_financeiro' && item.dadosRelatorioFinanceiro?.orientacao === 'paisagem';

  if (htmlContent && htmlContent.trim().length > 30) {
    const success = await imprimirViaIframe(htmlContent, {
      title,
      orientation: isPaisagem ? 'landscape' : 'portrait',
    });

    if (success) {
      document.title = originalTitle;
      return;
    }
  }

  // Se iframe não puder ser usado, fallback automático para janela nativa
  await executarImpressaoNativa(item, tituloCustom);
  document.title = originalTitle;
}

interface PrintContextType {
  activePrintItem: PrintItem | null;
  setActivePrintItem: (item: PrintItem | null) => void;
  setVia: (via: '1' | '2') => void;
  imprimirItem: (item: PrintItem, tituloCustom?: string) => Promise<void>;
  imprimirDocumento: (doc: Documento, via?: '1' | '2', tituloCustom?: string) => Promise<void>;
}

const PrintContext = createContext<PrintContextType>({
  activePrintItem: null,
  setActivePrintItem: () => {},
  setVia: () => {},
  imprimirItem: async () => {},
  imprimirDocumento: async () => {},
});

export const usePrint = () => useContext(PrintContext);

export const PrintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePrintItem, setActivePrintItemState] = useState<PrintItem | null>(null);

  const setActivePrintItem = useCallback((item: PrintItem | null) => {
    setActivePrintItemState(item);
  }, []);

  const setVia = useCallback((via: '1' | '2') => {
    setActivePrintItemState((prev) => (prev ? { ...prev, via } : null));
  }, []);

  const imprimirItem = useCallback(
    async (item: PrintItem, tituloCustom?: string) => {
      setActivePrintItemState(item);
      await dispararImpressaoUniversal(item, tituloCustom);
    },
    []
  );

  const imprimirDocumento = useCallback(
    async (doc: Documento, via: '1' | '2' = '1', tituloCustom?: string) => {
      const item = buildPrintItemFromDocumento(doc, via);
      setActivePrintItemState(item);
      await dispararImpressaoUniversal(item, tituloCustom);
    },
    []
  );

  const value = useMemo(
    () => ({
      activePrintItem,
      setActivePrintItem,
      setVia,
      imprimirItem,
      imprimirDocumento,
    }),
    [activePrintItem, setActivePrintItem, setVia, imprimirItem, imprimirDocumento]
  );

  return <PrintContext.Provider value={value}>{children}</PrintContext.Provider>;
};
