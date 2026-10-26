import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Empresa } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emp = (await req.json()) as Empresa;
    emp.id = id;

    const salva = await ServerDb.saveEmpresa(emp);
    return NextResponse.json(salva);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar empresa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await ServerDb.deleteEmpresa(id);
    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao inativar empresa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
