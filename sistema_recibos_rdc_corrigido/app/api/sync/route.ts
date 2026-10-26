import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';

// GET: Retorna o estado centralizado completo do servidor para sincronização
export async function GET() {
  try {
    const data = await ServerDb.getAllData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao obter dados centrais';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Recebe dados do cliente (ex: dados criados localmente antes da centralização) e reconcilia
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ServerDb.reconcileClientData(body);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao sincronizar dados com o servidor';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
