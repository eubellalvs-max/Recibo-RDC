import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Usuario } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usr = (await req.json()) as Usuario;
    usr.id = id;

    const salvo = await ServerDb.saveUsuario(usr);
    return NextResponse.json(salvo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await ServerDb.deleteUsuario(id);
    return NextResponse.json({ success: ok, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir usuário';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
