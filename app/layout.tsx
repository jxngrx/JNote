import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://notes.jxngrx.com/'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Noterx',
    template: '%s | Noterx',
  },
  applicationName: 'Noterx',
  description:
    'Noterx is a fast, minimalist note‑taking app to capture ideas, create and organize notes, and stay productive across your day.',
  keywords: [
    'Noterx',
    'note taking app',
    'notes',
    'sticky notes',
    'productivity',
    'organize notes',
    'knowledge base',
    'personal wiki',
    'markdown notes',
    'task planning',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Noterx',
    title: 'Noterx',
    description:
      'Capture ideas instantly, organize your notes, and keep everything searchable with Noterx.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noterx',
    description:
      'Capture ideas instantly, organize your notes, and keep everything searchable with Noterx.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${_geist.className} ${_geistMono.className} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
