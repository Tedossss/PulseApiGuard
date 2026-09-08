import type { Metadata } from 'next';
import { DreamWorld } from './dreamworld/DreamWorld';

export const metadata: Metadata = {
  metadataBase: new URL('https://falach.pl'),
  title: { absolute: 'The Remembered Street — Nazar Falach' },
  description: 'Walk through six full-stack projects reimagined as places on one strange, familiar Dreamcore street by Nazar Falach.',
  alternates: { canonical: 'https://falach.pl' },
  openGraph: {
    type: 'profile',
    url: 'https://falach.pl',
    title: 'The Remembered Street — Nazar Falach',
    description: 'Six real projects. One strange, familiar street. An interactive full-stack portfolio in Dreamcore daylight.',
    siteName: 'Nazar Falach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Remembered Street — Nazar Falach',
    description: 'Walk a procedural Dreamcore neighborhood built from six real projects.',
  },
};

export default function PortfolioPage() {
  return <DreamWorld />;
}
