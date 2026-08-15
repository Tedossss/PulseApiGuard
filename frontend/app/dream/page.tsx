import type { Metadata } from 'next';
import { DreamEvidenceExperience } from './DreamEvidenceExperience';

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
      <template
        data-impeccable-contract="dream-evidence-approved-20260815"
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: Engineering proof appears as physical evidence inside one continuous bright dream, refusing the detached portfolio-card grid.
OWN-WORLD: Cobalt sky, saturated green landscapes, cream dossier paper, navy ink, thin evidence rules, metal clips, and one incident-orange signal.
STORY: A visitor moves through six project places, verifies role, stack, and shipped behavior, then contacts Nazar or downloads the CV.
FIRST VIEWPORT: PulseGuard fills the left two-thirds as a white house beneath enormous clouds; a clipped semantic dossier overlaps from the right; contact sits top-right and project records form the bottom rail.
FORM: Dream Evidence, selected from the Impeccable direction set; seed dream-evidence-approved-20260815.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <DreamEvidenceExperience />
    </>
  );
}
