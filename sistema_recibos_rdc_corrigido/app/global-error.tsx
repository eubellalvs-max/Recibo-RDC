'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-900">
          <h2 className="text-xl font-bold mb-2">Erro crítico no sistema</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
