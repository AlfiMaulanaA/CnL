import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import { SettingsProvider } from '@/components/settings/SettingsProvider';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Climb & Slide — Play Ular Tangga Online',
    template: '%s · Climb & Slide'
  },
  description:
    'Play a colorful snakes-and-ladders inspired board game with friends or bots online and offline. Roll, climb ladders, slide down chutes, race to tile 100!',
  keywords: [
    'ular tangga',
    'snakes and ladders',
    'chutes and ladders',
    'board game',
    'multiplayer',
    'online board game',
    'climb and slide'
  ],
  manifest: '/manifest.webmanifest',
  applicationName: 'Climb & Slide',
  appleWebApp: {
    capable: true,
    title: 'Climb & Slide',
    statusBarStyle: 'default'
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  },
  openGraph: {
    type: 'website',
    siteName: 'Climb & Slide',
    title: 'Climb & Slide — Play Ular Tangga Online',
    description: 'Race friends and bots up the board — colorful, playful, mobile-friendly.',
    url: '/',
    images: [{ url: '/icon.svg' }]
  },
  twitter: {
    card: 'summary',
    title: 'Climb & Slide — Play Ular Tangga Online',
    description: 'A colorful ladders-and-slides board game you can play anywhere.'
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
