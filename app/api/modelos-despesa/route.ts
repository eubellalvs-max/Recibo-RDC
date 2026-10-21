import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { ModeloDespesa } from '@/lib/types';

export async function GET() {
  try {
    const modelos = await ServerDb.getModelosDespesa();
    return NextResponse.json(modelos);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar modelos de despesa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const mod = (await req.json()) as ModeloDespesa;
    const salvo = await ServerDb.saveModeloDespesa(mod);
    return NextResponse.json(salvo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar modelo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
