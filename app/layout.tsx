import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Clubify — Discover Nightlife',
    template: '%s | Clubify',
  },
  description: 'Entdecke die besten Clubs, Bars und Events in deiner Nähe. Tickets kaufen, Tische reservieren, QR-Check-in.',
  keywords: ['nightlife', 'club', 'bar', 'events', 'tickets', 'techno', 'wien', 'berlin'],
  openGraph: {
    title: 'Clubify — Discover Nightlife',
    description: 'Entdecke die besten Clubs, Bars und Events in deiner Nähe.',
    type: 'website',
    locale: 'de_AT',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clubify',
    description: 'Discover Nightlife',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${plusJakarta.variable}`}>
        {children}
      </body>
    </html>
  )
}
