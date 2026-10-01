/**
 * Utilitários de máscaras e formatações no padrão brasileiro
 */

export function mascaraCnpj(valor: string): string {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraCpf(valor: string): string {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function mascaraCep(valor: string): string {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function mascaraTelefone(valor: string): string {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function mascaraCpfOuCnpj(valor: string): string {
  if (!valor) return '';
  const clean = valor.replace(/\D/g, '');
  if (clean.length <= 11) {
    return mascaraCpf(clean);
  }
  return mascaraCnpj(clean);
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

export function formatarValorInput(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

export function parseMoedaInput(input: string): number {
  if (!input) return 0;
  // Remove tudo exceto dígitos
  const clean = input.replace(/\D/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
}

export function formatarDataBr(dataIso: string): string {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

export function dataHojeIso(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Validação oficial de CPF (Algoritmo Módulo 11 da Receita Federal)
 */
export function validarCpf(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Bloquear sequências com todos os dígitos iguais (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Cálculo do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(9), 10)) return false;

  // Cálculo do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação oficial de CNPJ (Algoritmo Módulo 11 da Receita Federal)
 */
export function validarCnpj(cnpj: string): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;

  // Bloquear sequências repetidas
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Cálculo do 1º dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(clean.charAt(i), 10) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(clean.charAt(12), 10)) return false;

  // Cálculo do 2º dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(clean.charAt(i), 10) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(clean.charAt(13), 10)) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ de acordo com a extensão numérica
 */
export function validarCpfOuCnpj(valor: string): boolean {
  if (!valor) return false;
  const clean = valor.replace(/\D/g, '');
  if (clean.length === 11) return validarCpf(clean);
  if (clean.length === 14) return validarCnpj(clean);
  return false;
}

export { dataPorExtenso } from './extenso';
