'use client';

import React from 'react';
import { usePrint } from '@/lib/printContext';
import { UnifiedReciboPrint } from './UnifiedReciboPrint';
import { UnifiedRdcPrint } from './UnifiedRdcPrint';
import { UnifiedReciboMedicoPrint } from './UnifiedReciboMedicoPrint';
import { UnifiedRelatorioFinanceiroPrint } from '@/components/financeiro/UnifiedRelatorioFinanceiroPrint';

export const PrintLayoutArea: React.FC = () => {
  const { activePrintItem } = usePrint();

  if (!activePrintItem) {
    return null;
  }

  const isRelatorio = activePrintItem.tipo === 'relatorio_financeiro';
  const isPaisagem = isRelatorio && activePrintItem.dadosRelatorioFinanceiro?.orientacao === 'paisagem';

  return (
    <section
      id="print-area"
      className={`print-area ${isPaisagem ? 'print-area-paisagem' : 'print-area-retrato'}`}
      aria-label="Área de Impressão Exclusiva"
    >
      <div
        id="print-receipt"
        className={`receipt ${
          isRelatorio
            ? isPaisagem
              ? 'receipt-relatorio-paisagem'
              : 'receipt-relatorio'
            : ''
        }`}
      >
        {activePrintItem.tipo === 'recibo' && activePrintItem.dadosRecibo && (
          <UnifiedReciboPrint
            dados={activePrintItem.dadosRecibo}
            config={activePrintItem.dadosRecibo.config}
            via={activePrintItem.via || '1'}
          />
        )}

        {activePrintItem.tipo === 'rdc' && activePrintItem.dadosRdc && (
          <UnifiedRdcPrint dados={activePrintItem.dadosRdc} via={activePrintItem.via || '1'} />
        )}

        {activePrintItem.tipo === 'recibo_medico' && activePrintItem.dadosReciboMedico && (
          <UnifiedReciboMedicoPrint dados={activePrintItem.dadosReciboMedico} />
        )}

        {activePrintItem.tipo === 'relatorio_financeiro' && activePrintItem.dadosRelatorioFinanceiro && (
          <UnifiedRelatorioFinanceiroPrint dados={activePrintItem.dadosRelatorioFinanceiro} />
        )}
      </div>
    </section>
  );
};
