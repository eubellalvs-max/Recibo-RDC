'use client';

import React from 'react';
import { usePrint } from '@/lib/printContext';
import { UnifiedReciboPrint } from './UnifiedReciboPrint';
import { UnifiedRdcPrint } from './UnifiedRdcPrint';
import { UnifiedReciboMedicoPrint } from './UnifiedReciboMedicoPrint';

export const PrintLayoutArea: React.FC = () => {
  const { activePrintItem } = usePrint();

  if (!activePrintItem) {
    return (
      <div id="print-area" className="print-area" aria-hidden="true">
        <div id="print-receipt" className="receipt" />
      </div>
    );
  }

  return (
    <div id="print-area" className="print-area">
      <div id="print-receipt" className="receipt">
        {activePrintItem.tipo === 'recibo' && activePrintItem.dadosRecibo && (
          <UnifiedReciboPrint
            dados={activePrintItem.dadosRecibo}
            config={activePrintItem.dadosRecibo.config}
            via={activePrintItem.via || '1'}
          />
        )}

        {activePrintItem.tipo === 'rdc' && activePrintItem.dadosRdc && (
          <UnifiedRdcPrint dados={activePrintItem.dadosRdc} />
        )}

        {activePrintItem.tipo === 'recibo_medico' && activePrintItem.dadosReciboMedico && (
          <UnifiedReciboMedicoPrint dados={activePrintItem.dadosReciboMedico} />
        )}
      </div>
    </div>
  );
};
