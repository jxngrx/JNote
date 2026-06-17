import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  DM_Sans,
  DM_Mono,
  Fira_Code,
  Fraunces,
  Instrument_Serif,
  Libre_Baskerville,
  Playfair_Display,
  Space_Grotesk,
  Syne,
} from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import AppEyeTracking from '@/components/app-eye-tracking'
import AppProviders from '@/components/app-providers'
import ThemeInitScript from '@/components/theme-init-script'
import TypographyInitScript from '@/components/typography-init-script'
import './globals.css'
import '@excalidraw/excalidraw/index.css'
import { getSiteUrl } from '@/lib/site-url'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira-code',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-syne',
  display: 'swap',
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'JNote',
    template: '%s | JNote',
  },
  applicationName: 'JNote',
  description:
    'JNote is a fast, minimalist note‑taking app to capture ideas, create and organize notes, and stay productive across your day.',
  keywords: [
    'JNote',
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
    siteName: 'JNote',
    title: 'JNote',
    description:
      'Capture ideas instantly, organize your notes, and keep everything searchable with JNote.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JNote',
    description:
      'Capture ideas instantly, organize your notes, and keep everything searchable with JNote.',
  },
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: ['/logo.png'],
  },
}

const fontVariables = [
  dmSans.variable,
  dmMono.variable,
  firaCode.variable,
  playfair.variable,
  cormorant.variable,
  instrumentSerif.variable,
  libreBaskerville.variable,
  fraunces.variable,
  spaceGrotesk.variable,
  syne.variable,
].join(' ')

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <ThemeInitScript />
        <TypographyInitScript />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <AppProviders>
          <AppEyeTracking />
          {children}
          <Analytics />
        </AppProviders>
      </body>
    </html>
  )
}
