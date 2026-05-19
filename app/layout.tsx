import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell  } from '@/components/AppShell';

export const metadata: Metadata = {
  title:       'Álbum Mundial 2026',
  description: 'Seguimiento del álbum Panini FIFA World Cup 2026',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:      true,
    statusBarStyle: 'default',
    title:        'Álbum 2026',
  },
  icons: {
    icon:  '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
};

export const viewport: Viewport = {
  width:           'device-width',
  initialScale:    1,
  maximumScale:    1,
  userScalable:    false,
  viewportFit:     'cover', // required for env(safe-area-inset-*)
  themeColor:      [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-ios-gray6 dark:bg-black antialiased">
        <Providers>
          {/* AppShell gates auth: login screen (no nav) vs app (with nav) */}
          <AppShell>{children}</AppShell>
        </Providers>

        {/* Register PWA service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
