import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <h2 className="text-xl font-bold mb-2">404 - Página não encontrada</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        O recurso solicitado não pôde ser encontrado.
      </p>
      <Link
        href="/"
        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
