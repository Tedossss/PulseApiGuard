import './globals.css'
import type { Metadata } from 'next'
import { Instrument_Serif, Space_Grotesk } from 'next/font/google'

const displayFont = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pg-display',
})

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-pg-body',
})

export const metadata: Metadata = {
  title: 'PulseGuard — API Monitoring',
  description: 'Monitor API availability, latency, and incident states from one dashboard.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  )
}
