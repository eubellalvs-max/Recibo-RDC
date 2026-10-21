import { NextRequest, NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';
import { Documento } from '@/lib/types';

export async function GET() {
  try {
    const docs = await ServerDb.getDocumentos();
    return NextResponse.json(docs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar documentos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const doc = (await req.json()) as Documento;
    if (!doc.id || !doc.numero || !doc.tipo) {
      return NextResponse.json({ error: 'Dados do documento incompletos.' }, { status: 400 });
    }

    const salvo = await ServerDb.saveDocumento(doc);
    return NextResponse.json(salvo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar documento';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
