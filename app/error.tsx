'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <h2 className="text-xl font-bold mb-2">Ocorreu um erro</h2>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
        {error?.message || 'Erro inesperado na aplicação.'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg"
      >
        Tentar novamente
      </button>
    </div>
  );
}
