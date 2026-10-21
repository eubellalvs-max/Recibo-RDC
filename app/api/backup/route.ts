import { NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';

export async function GET() {
  try {
    const data = await ServerDb.getAllData();
    const filename = `backup_recibos_rdc_${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar backup';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
