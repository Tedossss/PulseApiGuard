'use client';

import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Download,
  ExternalLink,
  Mail,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './DreamEvidenceExperience.module.css';

type ProjectLink = {
  label: string;
  href: string;
  external?: boolean;
};

type EvidenceProject = {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  year: string;
  image: string;
  imagePosition?: string;
  description: string;
  stack: readonly string[];
  evidence: readonly string[];
  links: readonly ProjectLink[];
};

const projects: readonly EvidenceProject[] = [
  {
    slug: 'pulseguard',
    title: 'PulseGuard',
    subtitle: 'API monitoring built around trusted incident states',
    role: 'Product framing · full-stack engineering · infrastructure',
    year: '2026',
    image: '/assets/dreamworld/meadow-house.webp',
    imagePosition: '72% 50%',
    description:
      'An endpoint-monitoring platform that separates a failed request from a real incident, then tells the owner when the incident begins or recovers.',
    stack: ['Next.js', 'Express', 'MongoDB', 'Redis', 'BullMQ', 'Docker'],
    evidence: [
      'DOWN only after three consecutive failures',
      'Telegram incident and recovery alerts',
      'Ownership-safe monitors and paginated history',
    ],
    links: [
      { label: 'Open live product', href: '/PAG' },
      { label: 'View repository', href: 'https://github.com/Tedossss/PulseApiGuard', external: true },
    ],
  },
  {
    slug: 'colab',
    title: 'CoLab',
    subtitle: 'A network where discovery can become a real conversation',
    role: 'Full-stack engineer · team project',
    year: '2026',
    image: '/assets/dreamworld/cloud-transit.webp',
    imagePosition: '50% 50%',
    description:
      'A collaboration product with explainable matching, mutual connections, private chat, realtime updates, recovery flows, and moderation controls.',
    stack: ['Next.js', 'Express', 'MongoDB', 'SSE', 'Docker'],
    evidence: [
      'Authenticated realtime events instead of chat polling',
      'Session revocation and recovery-token invalidation',
      'Cursor-safe lists and pair-scoped connection state',
    ],
    links: [{ label: 'Open live product', href: '/colab' }],
  },
  {
    slug: 'foundation',
    title: 'Foundation Platform',
    subtitle: 'Content operations shaped into a maintainable system',
    role: 'Backend / full-stack engineer',
    year: '2026',
    image: '/assets/dreamworld/endless-market.webp',
    imagePosition: '42% 50%',
    description:
      'A structured content, news, and media backend with an administrative interface for the people responsible for keeping public information current.',
    stack: ['Node.js', 'React', 'PostgreSQL', 'Prisma'],
    evidence: [
      'Structured news and content workflows',
      'Media handling for editorial operations',
      'Separate public and administrative surfaces',
    ],
    links: [{ label: 'Ask about this case', href: '#contact' }],
  },
  {
    slug: 'prime-leather',
    title: 'Prime Leather Repair',
    subtitle: 'A working service business presented through its craft',
    role: 'Full-stack engineer · client / team project',
    year: '2026',
    image: '/assets/dreamworld/repair-waiting.webp',
    imagePosition: '48% 52%',
    description:
      'A deployed service website with media-rich work examples and practical administration for categories, uploads, contacts, and reviews.',
    stack: ['React', 'Vite', 'Express', 'Supabase'],
    evidence: [
      'Before-and-after media presentation',
      'Administrative upload workflow',
      'Live client-facing deployment',
    ],
    links: [
      { label: 'Visit live site', href: 'https://primeleatherrepair.com', external: true },
      { label: 'View repository', href: 'https://github.com/Tedossss/LEATHERWORKS', external: true },
    ],
  },
  {
    slug: 'bookshelf',
    title: 'BookShelf',
    subtitle: 'A physical-book idea told as one continuous product story',
    role: 'Frontend engineer',
    year: '2026',
    image: '/assets/dreamworld/pastel-library.webp',
    imagePosition: '38% 52%',
    description:
      'A cinematic product presentation that turns the movement from a physical shelf to a digital collection into the interface itself.',
    stack: ['Next.js', 'React', 'TypeScript', 'Motion'],
    evidence: [
      'Responsive scene choreography',
      'Accessible reduced-motion path',
      'Semantic content beneath the cinematic layer',
    ],
    links: [{ label: 'Discuss the presentation', href: '#contact' }],
  },
  {
    slug: 'local-ai',
    title: 'Local LLM Pipeline',
    subtitle: 'A repeatable experiment prepared for constrained hardware',
    role: 'Applied AI · engineering R&D',
    year: '2026',
    image: '/assets/dreamworld/computer-garden.webp',
    imagePosition: '38% 52%',
    description:
      'A deterministic preprocessing and LoRA experiment setup. The pipeline is prepared; no completed training run or benchmark is claimed.',
    stack: ['Python', 'PyTorch', 'Transformers', 'TRL', 'PEFT'],
    evidence: [
      '11,590 prepared chat-formatted examples',
      'Hardware-aware configuration for a 1.1B base model',
      'Explicitly separated setup from unclaimed results',
    ],
    links: [{ label: 'Discuss the pipeline', href: '#contact' }],
  },
] as const;

const padIndex = (index: number) => String(index + 1).padStart(2, '0');

export function DreamEvidenceExperience() {
  const [activeProject, setActiveProject] = useState(projects[0].slug);
  const [mode, setMode] = useState<'dream' | 'evidence'>('evidence');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-project-scene]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const slug = visible?.target.getAttribute('data-project-scene');
        if (slug) setActiveProject(slug);
      },
      { rootMargin: '-28% 0px -28% 0px', threshold: [0.2, 0.45, 0.7] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const handlePointer = (event: PointerEvent) => {
      if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty('--dream-x', `${(event.clientX / window.innerWidth - 0.5) * 12}px`);
        root.style.setProperty('--dream-y', `${(event.clientY / window.innerHeight - 0.5) * 8}px`);
        frame = 0;
      });
    };

    window.addEventListener('pointermove', handlePointer, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointer);
    };
  }, []);

  const goToProject = (slug: string) => {
    document.getElementById(`dream-${slug}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-dream-evidence-root
      data-view-mode={mode}
    >
      <a className={styles.skipLink} href="#dream-pulseguard">Skip to project evidence</a>

      <header className={styles.header}>
        <a className={styles.identity} href="#dream-pulseguard" aria-label="Nazar Falach — first project">
          <strong>Nazar Falach</strong>
          <span>Full-stack engineer · Poland</span>
        </a>

        <div className={styles.modeSwitch} aria-label="Portfolio view">
          <button type="button" aria-pressed={mode === 'dream'} onClick={() => setMode('dream')}>Dream</button>
          <i aria-hidden="true"><span data-position={mode} /></i>
          <button type="button" aria-pressed={mode === 'evidence'} onClick={() => setMode('evidence')}>Evidence</button>
        </div>

        <a className={styles.contactLink} href="#contact" aria-label="Contact Nazar">
          <span>Contact</span><Send aria-hidden="true" />
        </a>
      </header>

      <div className={styles.scenes}>
        {projects.map((project, index) => {
          const active = activeProject === project.slug;
          return (
            <article
              className={styles.scene}
              id={`dream-${project.slug}`}
              data-project-scene={project.slug}
              data-active={active}
              key={project.slug}
              aria-labelledby={`dream-${project.slug}-title`}
            >
              <div className={styles.world} aria-hidden="true">
                <Image
                  className={styles.worldImage}
                  src={project.image}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 100vw, 68vw"
                  preload={index === 0}
                  style={{ objectPosition: project.imagePosition ?? 'center' }}
                />
                <div className={styles.worldWash} />
              </div>

              <div className={styles.worldCopy}>
                <p className={styles.projectIndex}>{padIndex(index)} — {project.year}</p>
                <h1 id={`dream-${project.slug}-title`}>{project.title}</h1>
                <p className={styles.subtitle}>{project.subtitle}</p>
                {index === 0 ? (
                  <a className={styles.scrollCue} href="#dream-colab">
                    Scroll to inspect <ArrowDown aria-hidden="true" />
                  </a>
                ) : null}
              </div>

              <div className={styles.pin} aria-hidden="true"><span /></div>

              <section className={styles.dossier} aria-label={`${project.title} engineering evidence`}>
                <div className={styles.clip} aria-hidden="true"><i /></div>
                <div className={styles.stamp} aria-hidden="true"><span>NF</span><small>Evidence<br />engineered</small></div>
                <p className={styles.fileTitle}>{padIndex(index)} — {project.title}</p>

                <dl className={styles.metadata}>
                  <div><dt>Role</dt><dd>{project.role}</dd></div>
                  <div><dt>Stack</dt><dd className={styles.stack}>{project.stack.join(' / ')}</dd></div>
                  <div><dt>Record</dt><dd>{project.description}</dd></div>
                </dl>

                <ul className={styles.evidenceList}>
                  {project.evidence.map((item, evidenceIndex) => (
                    <li key={item} data-signal={index === 0 && evidenceIndex === 0}>
                      <Check aria-hidden="true" /><span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.actions}>
                  {project.links.map((link, linkIndex) => (
                    <a
                      className={linkIndex === 0 ? styles.primaryAction : styles.secondaryAction}
                      href={link.href}
                      key={link.label}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noreferrer' : undefined}
                    >
                      {link.label}
                      {link.external ? <ExternalLink aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
                    </a>
                  ))}
                </div>
              </section>
            </article>
          );
        })}
      </div>

      <nav className={styles.projectRail} aria-label="Project evidence records">
        {projects.map((project, index) => (
          <button
            type="button"
            key={project.slug}
            data-active={activeProject === project.slug}
            aria-label={`Open ${project.title}`}
            onClick={() => goToProject(project.slug)}
          >
            <span>{padIndex(index)}</span>
            <i aria-hidden="true" />
            <strong>{project.title}</strong>
          </button>
        ))}
      </nav>

      <section className={styles.contact} id="contact" aria-labelledby="contact-title">
        <div className={styles.contactSky} aria-hidden="true">
          <Image src="/assets/dreamworld/stairway-exit.webp" alt="" fill sizes="100vw" />
        </div>
        <div className={styles.contactSheet}>
          <p className={styles.fileTitle}>Filed under — next conversation</p>
          <h2 id="contact-title">The evidence ends here.<br />The work does not.</h2>
          <p>I am open to full-stack engineering roles and software projects where product thinking and production detail both matter.</p>
          <div className={styles.contactActions}>
            <a href="mailto:nazarfalach51@gmail.com"><Mail aria-hidden="true" /> Email Nazar</a>
            <a href="https://t.me/tedosss" target="_blank" rel="noreferrer"><Send aria-hidden="true" /> Telegram</a>
            <a href="/assets/nazar-falach-cv.pdf" download><Download aria-hidden="true" /> Download CV</a>
          </div>
          <small>Falach.pl · Poland · 2026</small>
        </div>
      </section>
    </main>
  );
}
