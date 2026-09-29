/**
 * Conversor numérico para valor monetário por extenso em Português do Brasil (BRL)
 * Suporta valores de centavos até bilhões com concordância precisa e conectivos corretos.
 */

const UNIDADES: string[] = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
];

const ESPECIAIS_10_A_19: string[] = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];

const DEZENAS: string[] = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];

const CENTENAS: string[] = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function converterGrupoAte999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const restoC = n % 100;
  const d = Math.floor(restoC / 10);
  const u = restoC % 10;

  const partes: string[] = [];

  if (c > 0) {
    partes.push(CENTENAS[c]);
  }

  if (restoC >= 10 && restoC <= 19) {
    partes.push(ESPECIAIS_10_A_19[restoC - 10]);
  } else {
    if (d > 0) {
      partes.push(DEZENAS[d]);
    }
    if (u > 0) {
      partes.push(UNIDADES[u]);
    }
  }

  return partes.join(' e ');
}

export function valorPorExtenso(valorOriginal: number | string): string {
  const num = typeof valorOriginal === 'string' 
    ? parseFloat(valorOriginal.replace(/[^\d,-]/g, '').replace(',', '.')) 
    : valorOriginal;

  if (isNaN(num) || num <= 0) {
    return 'Zero reais';
  }

  // Separar inteiros e centavos
  const valorArredondado = Math.round(num * 100) / 100;
  const inteiros = Math.floor(valorArredondado);
  const centavos = Math.round((valorArredondado - inteiros) * 100);

  const partesTexto: string[] = [];

  if (inteiros > 0) {
    const bilhoes = Math.floor(inteiros / 1_000_000_000);
    const milhoes = Math.floor((inteiros % 1_000_000_000) / 1_000_000);
    const milhares = Math.floor((inteiros % 1_000_000) / 1_000);
    const unidades = inteiros % 1_000;

    const blocos: string[] = [];

    if (bilhoes > 0) {
      const textoBilhoes = converterGrupoAte999(bilhoes);
      blocos.push(`${textoBilhoes} ${bilhoes === 1 ? 'bilhão' : 'bilhões'}`);
    }

    if (milhoes > 0) {
      const textoMilhoes = converterGrupoAte999(milhoes);
      blocos.push(`${textoMilhoes} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
    }

    if (milhares > 0) {
      if (milhares === 1) {
        blocos.push('mil');
      } else {
        const textoMilhares = converterGrupoAte999(milhares);
        blocos.push(`${textoMilhares} mil`);
      }
    }

    if (unidades > 0) {
      blocos.push(converterGrupoAte999(unidades));
    }

    // Regra do "de reais": quando o valor termina em milhão/bilhão sem milhares nem unidades
    const precisaDeReais = (bilhoes > 0 || milhoes > 0) && milhares === 0 && unidades === 0;
    const sufixoMoeda = inteiros === 1 
      ? 'real' 
      : precisaDeReais 
        ? 'de reais' 
        : 'reais';

    // Montar texto dos inteiros unindo com "e"
    let textoInteiro = '';
    for (let i = 0; i < blocos.length; i++) {
      if (i === 0) {
        textoInteiro = blocos[i];
      } else {
        // Se for o último bloco e for menor que 100 ou centena redonda, junta com "e", senão vírgula ou "e"
        textoInteiro += ` e ${blocos[i]}`;
      }
    }

    partesTexto.push(`${textoInteiro} ${sufixoMoeda}`);
  }

  if (centavos > 0) {
    const textoCentavos = converterGrupoAte999(centavos);
    const sufixoCentavos = centavos === 1 ? 'centavo' : 'centavos';
    partesTexto.push(`${textoCentavos} ${sufixoCentavos}`);
  }

  const resultadoFinal = partesTexto.join(' e ');

  // Primeira letra maiúscula
  if (resultadoFinal.length === 0) return 'Zero reais';
  return resultadoFinal.charAt(0).toUpperCase() + resultadoFinal.slice(1);
}

/**
 * Retorna a data em formato formal brasileiro por extenso
 * Exemplo: 2026-09-25 -> "25 de setembro de 2026"
 */
export function dataPorExtenso(dataIsoOuDate?: string | Date): string {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  let d: Date = new Date();
  if (dataIsoOuDate instanceof Date) {
    d = isNaN(dataIsoOuDate.getTime()) ? new Date() : dataIsoOuDate;
  } else if (typeof dataIsoOuDate === 'string' && dataIsoOuDate.trim()) {
    const s = dataIsoOuDate.trim();
    // Formato DD/MM/AAAA
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) {
        d = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
      }
    } else if (s.includes('-')) {
      // Formato YYYY-MM-DD ou ISO
      const p = s.split('T')[0].split('-');
      if (p.length === 3) {
        d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      }
    } else {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    }
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = meses[d.getMonth()] || 'janeiro';
  const ano = d.getFullYear();

  return `${dia} de ${mes} de ${ano}`;
}
