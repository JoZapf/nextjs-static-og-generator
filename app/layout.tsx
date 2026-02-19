/**
 * layout.tsx – Root layout with OG meta tags
 *
 * @author    Jo Zapf <https://jozapf.de>
 * @license   MIT
 * @version   1.0.0
 * @since     2025-12
 * @see       https://github.com/JoZapf/nextjs-static-og-generator
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: 'Dynamic OG Generator | Build-Time Social Media Images',
  description: 'Generate beautiful Open Graph images at build time for Next.js static export projects. Multi-page support, customizable design, no server required.',
  openGraph: {
    type: 'website',
    siteName: 'Dynamic OG Generator',
    title: 'Dynamic OG Generator | Build-Time Social Media Images',
    description: 'Generate beautiful Open Graph images at build time for Next.js static export projects.',
    images: [
      {
        url: '/og/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Dynamic OG Generator - Build-Time Social Media Images',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dynamic OG Generator',
    description: 'Build-time OG image generation for static sites.',
    images: ['/og/og-home.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
