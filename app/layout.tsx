import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '../components/ui/ServiceWorkerRegistrar';
import { PWAInstallPrompt } from '../components/ui/PWAInstallPrompt';

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  applicationName: 'Conta Ai',
  title: 'Conta Ai | Financas Premium',
  description: 'Gestao financeira pessoal de alto nivel.',
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Conta Ai',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Conta Ai" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
