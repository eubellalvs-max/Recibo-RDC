/**
 * Regras tributárias e cálculo de retenção de Imposto de Renda (IRRF)
 * Tabela Progressiva Mensal do IRPF
 */

export interface FaixaIrrf {
  limiteInferior: number;
  limiteSuperior: number;
  aliquota: number; // Em porcentagem (ex: 7.5, 15, 22.5, 27.5)
  parcelaDeduzir: number; // Em R$
}

export const TABELA_PROGRESSIVA_IRPF: FaixaIrrf[] = [
  { limiteInferior: 0, limiteSuperior: 2259.20, aliquota: 0, parcelaDeduzir: 0 },
  { limiteInferior: 2259.21, limiteSuperior: 2826.65, aliquota: 7.5, parcelaDeduzir: 169.44 },
  { limiteInferior: 2826.66, limiteSuperior: 3751.05, aliquota: 15.0, parcelaDeduzir: 381.44 },
  { limiteInferior: 3751.06, limiteSuperior: 4664.68, aliquota: 22.5, parcelaDeduzir: 662.77 },
  { limiteInferior: 4664.69, limiteSuperior: Infinity, aliquota: 27.5, parcelaDeduzir: 896.00 },
];

export interface ResultadoCalculoIrrf {
  baseCalculo: number;
  aliquota: number;
  parcelaDeduzir: number;
  valorIrrf: number;
  outrasDeducoes: number;
  totalDeducoes: number;
  valorLiquido: number;
  isento: boolean;
}

/**
 * Calcula a retenção de IRRF com base na Tabela Progressiva Mensal do IRPF.
 * Respeita parcelas a deduzir e outras deduções permitidas (ex: pensão, dependentes, taxa adm).
 */
export function calcularIrrfProgressivo(
  valorBruto: number,
  outrasDeducoes: number = 0,
  forcarAliquota27_5: boolean = false
): ResultadoCalculoIrrf {
  const bruto = Math.max(0, Number(valorBruto) || 0);
  const deducoesLegais = Math.max(0, Number(outrasDeducoes) || 0);
  const baseCalculo = Math.max(0, bruto - deducoesLegais);

  let aliquota = 0;
  let parcelaDeduzir = 0;

  if (forcarAliquota27_5 && baseCalculo > 0) {
    aliquota = 27.5;
    parcelaDeduzir = 896.00;
  } else {
    for (const faixa of TABELA_PROGRESSIVA_IRPF) {
      if (baseCalculo <= faixa.limiteSuperior) {
        aliquota = faixa.aliquota;
        parcelaDeduzir = faixa.parcelaDeduzir;
        break;
      }
    }
  }

  // IRRF = (Base x Alíquota) - Parcela a Deduzir
  let valorIrrf = (baseCalculo * (aliquota / 100)) - parcelaDeduzir;
  if (valorIrrf < 0) valorIrrf = 0;

  // Arredondamento para 2 casas decimais
  valorIrrf = Math.round(valorIrrf * 100) / 100;
  const totalDeducoes = Math.round((valorIrrf + deducoesLegais) * 100) / 100;
  const valorLiquido = Math.max(0, Math.round((bruto - totalDeducoes) * 100) / 100);

  return {
    baseCalculo,
    aliquota,
    parcelaDeduzir,
    valorIrrf,
    outrasDeducoes: deducoesLegais,
    totalDeducoes,
    valorLiquido,
    isento: aliquota === 0 || valorIrrf === 0,
  };
}

/**
 * Recalcula o valor líquido com base em ajustes manuais informados pelo usuário.
 */
export function recalcularIrrfManual(
  valorBruto: number,
  baseCalculo: number,
  aliquota: number,
  parcelaDeduzir: number,
  outrasDeducoes: number,
  valorIrrfManual?: number
): ResultadoCalculoIrrf {
  const bruto = Math.max(0, Number(valorBruto) || 0);
  const base = Math.max(0, Number(baseCalculo) || 0);
  const aliq = Math.max(0, Number(aliquota) || 0);
  const parc = Math.max(0, Number(parcelaDeduzir) || 0);
  const deducoes = Math.max(0, Number(outrasDeducoes) || 0);

  let irrf: number;
  if (valorIrrfManual !== undefined && !isNaN(valorIrrfManual) && valorIrrfManual >= 0) {
    irrf = valorIrrfManual;
  } else {
    irrf = Math.max(0, (base * (aliq / 100)) - parc);
  }
  irrf = Math.round(irrf * 100) / 100;

  const totalDeducoes = Math.round((irrf + deducoes) * 100) / 100;
  const valorLiquido = Math.max(0, Math.round((bruto - totalDeducoes) * 100) / 100);

  return {
    baseCalculo: base,
    aliquota: aliq,
    parcelaDeduzir: parc,
    valorIrrf: irrf,
    outrasDeducoes: deducoes,
    totalDeducoes,
    valorLiquido,
    isento: irrf === 0,
  };
}
