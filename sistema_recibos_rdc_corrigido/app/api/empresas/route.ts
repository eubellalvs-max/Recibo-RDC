import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Empresa } from '@/lib/types';

export async function GET() {
  try {
    const empresas = await ServerDb.getEmpresas();
    return NextResponse.json(empresas);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar empresas';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const emp = (await req.json()) as Empresa;
    if (!emp.id || !emp.razao_social || !emp.cnpj) {
      return NextResponse.json({ error: 'Dados da empresa incompletos.' }, { status: 400 });
    }

    const salva = await ServerDb.saveEmpresa(emp);
    return NextResponse.json(salva);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar empresa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
