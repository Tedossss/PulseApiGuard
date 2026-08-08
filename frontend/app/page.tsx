import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Falach — Projects',
  description: 'Choose a Falach project.',
};

const projects = [
  {
    href: '/PAG',
    label: 'PAG',
    description: 'API monitoring and incident alerts',
  },
  {
    href: '/colab',
    label: 'CoLab',
    description: 'Find and connect with co-founders',
  },
] as const;

export default function ProjectHubPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b0b0b] px-5 py-12 text-[#f5f2ea]">
      <section className="w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#b7ff3c]">falach.pl</p>
        <h1 className="mt-5 font-[family-name:var(--font-pg-display)] text-6xl leading-none tracking-[-0.04em] sm:text-8xl">
          Choose a project.
        </h1>

        <nav aria-label="Projects" className="mt-12 grid gap-4 sm:grid-cols-2">
          {projects.map((project, index) => (
            <a
              key={project.href}
              href={project.href}
              className="group flex min-h-52 flex-col justify-between border border-white/20 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#b7ff3c] hover:bg-[#b7ff3c] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b7ff3c] motion-reduce:transform-none"
            >
              <span className="font-mono text-xs tracking-[0.2em] opacity-60">0{index + 1}</span>
              <span>
                <strong className="block text-4xl tracking-[-0.04em]">{project.label}</strong>
                <span className="mt-2 block text-sm opacity-65">{project.description}</span>
              </span>
              <span aria-hidden="true" className="self-end text-2xl transition group-hover:translate-x-1 motion-reduce:transform-none">→</span>
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}
