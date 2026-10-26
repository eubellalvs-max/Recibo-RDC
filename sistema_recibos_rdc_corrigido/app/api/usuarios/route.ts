import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Usuario } from '@/lib/types';

export async function GET() {
  try {
    const usuarios = await ServerDb.getUsuarios();
    return NextResponse.json(usuarios);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar usuários';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const usr = (await req.json()) as Usuario;
    if (!usr.id || !usr.login || !usr.nome) {
      return NextResponse.json({ error: 'Dados do usuário incompletos.' }, { status: 400 });
    }

    const salvo = await ServerDb.saveUsuario(usr);
    return NextResponse.json(salvo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar usuário';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
