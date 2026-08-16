import type { Metadata } from 'next';
import { DreamEvidenceExperience } from './DreamEvidenceExperience';

export const metadata: Metadata = {
  title: { absolute: 'Dream Evidence Atlas — Nazar Falach' },
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
    title: 'Dream Evidence Atlas — Nazar Falach',
    description:
      'Six production engineering case files mapped through one handcrafted interactive dream by Nazar Falach.',
    siteName: 'Nazar Falach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dream Evidence Atlas — Nazar Falach',
    description:
      'Six production engineering case files mapped through one handcrafted interactive dream by Nazar Falach.',
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
        data-impeccable-contract="dream-evidence-atlas-overdrive-20260815"
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: Engineering evidence is plotted onto a living dream atlas, so every verified fact points back into the world that carries it.
OWN-WORLD: Full-bleed cobalt landscapes, floating cream case files, navy cartography, physical clips and seals, focus traces, and one restrained incident-orange signal.
STORY: A visitor qualifies Nazar within seconds, traverses six progressively revealed case stations, inspects role, stack, and shipped behavior, then reaches direct contact and CV actions.
FIRST VIEWPORT: PulseGuard fills the entire viewport; the white house is marked by an animated evidence trace, a dimensional case file floats at right, the six-case atlas rail anchors the bottom, and a concise engineering brief stays visible at top-left.
FORM: Dream Evidence Atlas Overdrive; seed dream-evidence-atlas-overdrive-20260815. One lazy decorative 3D atlas field deepens the scene while semantic DOM content remains complete without it.
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
