import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NyayaSetu — Labour Rights Assistant',
  description:
    'AI-powered legal assistant helping Indian workers understand their labour rights, detect wage theft, and generate verified reports.',
  applicationName: 'NyayaSetu',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NyayaSetu',
  },
  formatDetection: { telephone: false },
  keywords: [
    'labour rights',
    'wage theft',
    'worker rights india',
    'न्यायसेतु',
    'minimum wage',
    'labour law',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#071013',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} style={{ height: '100%' }}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100dvh',
          background: '#071013',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </body>
    </html>
  );
}
