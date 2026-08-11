import type { Metadata } from 'next';
import { DreamWorld } from '../dreamworld/DreamWorld';

export const metadata: Metadata = {
  title: { absolute: 'You took the long way. — Nazar Falach' },
  description:
    'The interactive portfolio of Nazar Falach, a full-stack engineer in Poland building production systems, frontend experiences, content platforms, and applied AI tooling.',
  keywords: [
    'Nazar Falach',
    'full-stack engineer',
    'Next.js developer',
    'Node.js developer',
    'TypeScript',
    'Three.js',
    'Poland',
  ],
  authors: [{ name: 'Nazar Falach', url: 'https://falach.pl' }],
  creator: 'Nazar Falach',
  alternates: { canonical: 'https://falach.pl/dream' },
  openGraph: {
    type: 'website',
    url: 'https://falach.pl/dream',
    title: 'You took the long way. — Nazar Falach',
    description:
      'A handcrafted interactive dream containing real production engineering work by Nazar Falach.',
    siteName: 'Nazar Falach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'You took the long way. — Nazar Falach',
    description:
      'A handcrafted interactive dream containing real production engineering work by Nazar Falach.',
  },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Nazar Falach',
  url: 'https://falach.pl',
  email: 'mailto:nazarfalach51@gmail.com',
  jobTitle: 'Full-stack engineer',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'PL',
  },
  sameAs: ['https://github.com/Tedossss', 'https://t.me/tedosss'],
  knowsAbout: [
    'Next.js',
    'React',
    'TypeScript',
    'Node.js',
    'MongoDB',
    'PostgreSQL',
    'Docker',
    'Three.js',
  ],
};

export default function DreamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <DreamWorld />
    </>
  );
}
