import { NextResponse } from 'next/server';
import { ServerDb } from '@/lib/serverDb';

export async function GET() {
  try {
    const data = await ServerDb.getAllData();
    return NextResponse.json({
      status: 'healthy',
      database_type: data.source,
      supabase_configured: ServerDb.isSupabaseConfigured(),
      counts: {
        documentos: data.documentos.length,
        empresas: data.empresas.length,
        usuarios: data.usuarios.length,
        modelos_despesa: data.modelos_despesa.length,
      },
      last_updated: data.last_updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro no health check';
    return NextResponse.json({ status: 'error', error: msg }, { status: 500 });
  }
}
