import type { Metadata } from 'next';
import { PortfolioExperience } from './portfolio/PortfolioExperience';

export const metadata: Metadata = {
  metadataBase: new URL('https://falach.pl'),
  title: { absolute: 'The Sleep Observatory — Nazar Falach' },
  description: 'Enter a procedural dream-world containing the systems, interfaces and experiments of full-stack engineer Nazar Falach.',
  alternates: { canonical: 'https://falach.pl' },
  openGraph: {
    type: 'profile',
    url: 'https://falach.pl',
    title: 'The Sleep Observatory — Nazar Falach',
    description: 'A dream you accidentally entered through a URL—and a portfolio hidden inside it.',
    siteName: 'Nazar Falach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Sleep Observatory — Nazar Falach',
    description: 'A procedural dream-world hiding a full-stack engineering portfolio.',
  },
};

export default function PortfolioPage() {
  return <PortfolioExperience />;
}
