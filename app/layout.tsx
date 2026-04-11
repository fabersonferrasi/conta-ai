import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conta Aí | Finanças Premium',
  description: 'Gestão financeira pessoal de alto nível.',
  manifest: '/manifest.json', // PWA suport será adicionado depois
  themeColor: '#0f172a',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
