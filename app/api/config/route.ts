import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { SistemaConfig } from '@/lib/types';

export async function GET() {
  try {
    const config = await ServerDb.getConfig();
    return NextResponse.json(config);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao obter configurações';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cfg = (await req.json()) as SistemaConfig;
    const salva = await ServerDb.saveConfig(cfg);
    return NextResponse.json(salva);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
