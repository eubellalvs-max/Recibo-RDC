import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Documento } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docAtualizado = (await req.json()) as Documento;

    // Garante que o ID bate
    docAtualizado.id = id;

    const salvo = await ServerDb.saveDocumento(docAtualizado);
    return NextResponse.json(salvo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar documento';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ServerDb.deleteDocumento(id);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao deletar documento';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
