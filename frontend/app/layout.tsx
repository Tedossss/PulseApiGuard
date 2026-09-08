import './globals.css'
import type { Metadata } from 'next'
import {
  Afacad_Flux,
  Barlow_Condensed,
  Instrument_Serif,
  Space_Grotesk,
} from 'next/font/google'

const displayFont = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pg-display',
})

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-pg-body',
})

const streetDisplayFont = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-street-display',
})

const streetBodyFont = Afacad_Flux({
  subsets: ['latin'],
  variable: '--font-street-body',
})

const directionContract = `<!-- impeccable:direction
THESIS: Six real systems become six familiar houses on one remembered street; this refuses detached portfolio cards and decorative science-fiction.
OWN-WORLD: Blue-sky daylight, rolling green hills, pastel clapboard, off-white civic signs, navy ink, lavender distance haze, warm lamps, and analog grain.
STORY: Meet Nazar, follow six stops, inspect verified project evidence, then reach contact at the final lot.
FIRST VIEWPORT: A physical identity sign anchors lower-left; an S-path enters lower-right past PulseGuard's three-lamp watch-house, while five landmarks recede to a tiny water tower; Contact sits upper-right and the street directory spans the bottom.
FORM: Street-Sign Arrival, top-ranked grounded direction, seed 4c597950.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`

export const metadata: Metadata = {
  metadataBase: new URL('https://falach.pl'),
  title: {
    default: 'Nazar Falach — Full-stack Engineer',
    template: '%s | Nazar Falach',
  },
  description:
    'Interactive portfolio of Nazar Falach: full-stack systems, applied AI work, and production frontend engineering.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${streetDisplayFont.variable} ${streetBodyFont.variable}`}
      >
        <span
          hidden
          aria-hidden="true"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: directionContract }}
        />
        {children}
      </body>
    </html>
  )
}
