import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Sistema de Emissão de Recibos e RDC',
  description: 'Sistema completo para emissão e gestão de Recibos e RDC com preenchimento automático por extenso, controle de empresas, numeração sequencial e perfis de Administrador e Emissor.',
  openGraph: {
    title: 'Sistema de Emissão de Recibos e RDC',
    description: 'Sistema completo para emissão e gestão de Recibos e RDC com preenchimento automático por extenso, controle de empresas, numeração sequencial e perfis de Administrador e Emissor.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema de Emissão de Recibos e RDC',
    description: 'Sistema completo para emissão e gestão de Recibos e RDC com preenchimento automático por extenso, controle de empresas, numeração sequencial e perfis de Administrador e Emissor.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
