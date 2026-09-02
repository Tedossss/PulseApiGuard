import type { Metadata } from 'next';
import { PortfolioExperience } from './portfolio/PortfolioExperience';

export const metadata: Metadata = {
  metadataBase: new URL('https://falach.pl'),
  title: { absolute: 'The Lucid Vivarium — Nazar Falach' },
  description: 'Enter a bright procedural dream-world containing the systems, interfaces and experiments of full-stack engineer Nazar Falach.',
  alternates: { canonical: 'https://falach.pl' },
  openGraph: {
    type: 'profile',
    url: 'https://falach.pl',
    title: 'The Lucid Vivarium — Nazar Falach',
    description: 'A bright dream you accidentally entered through a URL—and a portfolio growing inside it.',
    siteName: 'Nazar Falach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Lucid Vivarium — Nazar Falach',
    description: 'A vivid procedural dream-world hiding a full-stack engineering portfolio.',
  },
};

export default function PortfolioPage() {
  return <PortfolioExperience />;
}
