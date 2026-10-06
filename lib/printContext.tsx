'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Empresa, SistemaConfig, TipoGastoConfig, TipoDocConfig, DadosRdc, DadosReciboMedico } from './types';

export interface PrintItem {
  tipo: 'recibo' | 'rdc' | 'recibo_medico';
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
}

interface PrintContextType {
  activePrintItem: PrintItem | null;
  setActivePrintItem: (item: PrintItem | null) => void;
  setVia: (via: '1' | '2') => void;
}

const PrintContext = createContext<PrintContextType>({
  activePrintItem: null,
  setActivePrintItem: () => {},
  setVia: () => {},
});

export const usePrint = () => useContext(PrintContext);

export const PrintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePrintItem, setActivePrintItemState] = useState<PrintItem | null>(null);

  const setActivePrintItem = useCallback((item: PrintItem | null) => {
    setActivePrintItemState((prev) => {
      if (!prev && !item) return null;
      if (prev && item && prev.tipo === item.tipo && prev.numero === item.numero && prev.via === item.via) {
        try {
          if (JSON.stringify(prev) === JSON.stringify(item)) {
            return prev;
          }
        } catch {
          // fallback to updating
        }
      }
      return item;
    });
  }, []);

  const setVia = useCallback((via: '1' | '2') => {
    setActivePrintItemState((prev) => (prev ? { ...prev, via } : null));
  }, []);

  const value = useMemo(
    () => ({ activePrintItem, setActivePrintItem, setVia }),
    [activePrintItem, setActivePrintItem, setVia]
  );

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
};
