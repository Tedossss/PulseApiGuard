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
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DreamEvidenceExperience.module.css';

const DreamDepthField = dynamic(
  () => import('./DreamDepthField').then((module) => module.DreamDepthField),
  { ssr: false },
);

type ProjectLink = {
  label: string;
  href: string;
  external?: boolean;
};

type EvidenceProject = {
  slug: string;
  title: string;
  subtitle: string;
  classification: string;
  status: string;
  role: string;
  year: string;
  image: string;
  imagePosition: string;
  description: string;
  stack: readonly string[];
  evidence: readonly string[];
  links: readonly ProjectLink[];
  anchor: { x: number; y: number };
  tilt: number;
};

const projects: readonly EvidenceProject[] = [
  {
    slug: 'pulseguard',
    title: 'PulseGuard',
    subtitle: 'API monitoring built around trusted incident states',
    classification: 'Reliability system',
    status: 'Live product',
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
    anchor: { x: 48, y: 58 },
    tilt: -1.1,
  },
  {
    slug: 'colab',
    title: 'CoLab',
    subtitle: 'A network where discovery can become a real conversation',
    classification: 'Collaboration product',
    status: 'Live product',
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
    anchor: { x: 37, y: 48 },
    tilt: 0.8,
  },
  {
    slug: 'foundation',
    title: 'Foundation Platform',
    subtitle: 'Content operations shaped into a maintainable system',
    classification: 'Content platform',
    status: 'Platform case',
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
    anchor: { x: 30, y: 55 },
    tilt: -0.6,
  },
  {
    slug: 'prime-leather',
    title: 'Prime Leather Repair',
    subtitle: 'A working service business presented through its craft',
    classification: 'Client delivery',
    status: 'Live client site',
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
    anchor: { x: 45, y: 57 },
    tilt: 1.1,
  },
  {
    slug: 'bookshelf',
    title: 'BookShelf',
    subtitle: 'A physical-book idea told as one continuous product story',
    classification: 'Interface narrative',
    status: 'Presentation case',
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
    anchor: { x: 31, y: 46 },
    tilt: -0.9,
  },
  {
    slug: 'local-ai',
    title: 'Local LLM Pipeline',
    subtitle: 'A repeatable experiment prepared for constrained hardware',
    classification: 'Applied AI research',
    status: 'Prepared pipeline',
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
    anchor: { x: 36, y: 56 },
    tilt: 0.7,
  },
] as const;

type AtlasStyle = CSSProperties & {
  '--case-tilt': string;
  '--anchor-x': string;
  '--anchor-y': string;
};

const padIndex = (index: number) => String(index + 1).padStart(2, '0');
const projectCount = String(projects.length).padStart(2, '0');

export function DreamEvidenceExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFact, setActiveFact] = useState(0);
  const [mode, setMode] = useState<'dream' | 'evidence'>('evidence');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stackedLayout, setStackedLayout] = useState(false);
  const [depthEnabled, setDepthEnabled] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  const activeProject = projects[activeIndex];
  const useStaticJourney = stackedLayout || reducedMotion;

  useEffect(() => {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stackedQuery = window.matchMedia('(max-width: 760px)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateMedia = () => {
      setReducedMotion(reducedQuery.matches);
      setStackedLayout(stackedQuery.matches);
      setDepthEnabled(!reducedQuery.matches && !stackedQuery.matches && finePointerQuery.matches);
    };

    updateMedia();
    reducedQuery.addEventListener('change', updateMedia);
    stackedQuery.addEventListener('change', updateMedia);
    finePointerQuery.addEventListener('change', updateMedia);
    return () => {
      reducedQuery.removeEventListener('change', updateMedia);
      stackedQuery.removeEventListener('change', updateMedia);
      finePointerQuery.removeEventListener('change', updateMedia);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const selector = useStaticJourney ? '[data-project-scene]' : '[data-atlas-marker]';
    const sections = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const nextIndex = Number(visible?.target.getAttribute('data-project-index'));
        if (Number.isInteger(nextIndex)) {
          setActiveFact(0);
          setActiveIndex(nextIndex);
        }
      },
      useStaticJourney
        ? { rootMargin: '-28% 0px -45% 0px', threshold: [0.15, 0.4] }
        : { rootMargin: '-49% 0px -49% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [useStaticJourney]);

  useEffect(() => {
    const contact = document.getElementById('contact');
    if (!contact) return;
    const observer = new IntersectionObserver(
      ([entry]) => setContactVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(contact);
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
        root.style.setProperty('--atlas-x', `${(event.clientX / window.innerWidth - 0.5) * 13}px`);
        root.style.setProperty('--atlas-y', `${(event.clientY / window.innerHeight - 0.5) * 9}px`);
        frame = 0;
      });
    };

    window.addEventListener('pointermove', handlePointer, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointer);
    };
  }, []);

  const selectMode = useCallback((nextMode: 'dream' | 'evidence') => {
    setMode(nextMode);
  }, []);

  const goToProject = useCallback((index: number) => {
    setActiveFact(0);
    setActiveIndex(index);
    const id = useStaticJourney
      ? `dream-${projects[index].slug}`
      : `dream-marker-${projects[index].slug}`;
    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion, useStaticJourney]);

  const traceStartY = 52 + activeFact * 8;
  const tracePath = `M 79 ${traceStartY} C 69 ${traceStartY}, 64 ${activeProject.anchor.y}, ${activeProject.anchor.x} ${activeProject.anchor.y}`;

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-contact-visible={contactVisible}
      data-dream-evidence-root
      data-layout={useStaticJourney ? 'stacked' : 'atlas'}
      data-reduced-motion={reducedMotion}
      data-view-mode={mode}
    >
      <a className={styles.skipLink} href="#atlas-stage">Skip to project evidence</a>

      <header className={styles.header}>
        <a className={styles.identity} href="#dream-pulseguard" aria-label="Nazar Falach — first project">
          <strong>Nazar Falach</strong>
          <span>Full-stack engineer · Poland</span>
        </a>

        <div className={styles.modeSwitch} aria-label="Portfolio view">
          <button
            type="button"
            aria-pressed={mode === 'dream'}
            onClick={() => selectMode('dream')}
          >
            Dream
          </button>
          <span className={styles.switchTrack} aria-hidden="true">
            <span data-position={mode} />
          </span>
          <button
            type="button"
            aria-pressed={mode === 'evidence'}
            onClick={() => selectMode('evidence')}
          >
            Evidence
          </button>
        </div>

        <a className={styles.contactLink} href="#contact" aria-label="Contact Nazar">
          <span>Contact</span><Send aria-hidden="true" />
        </a>
      </header>

      <aside className={styles.profileBrief} aria-label="Portfolio scope">
        <strong>Production systems, collaborative products, authored interfaces.</strong>
        <span>Six verified case files</span>
        <span>Available for full-stack roles and software projects</span>
      </aside>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ transform: `scaleX(${(activeIndex + 1) / projects.length})` }} />
      </div>

      <div className={styles.journey}>
        <div className={styles.stickyStage} id="atlas-stage">
          {depthEnabled ? (
            <DreamDepthField activeIndex={activeIndex} mode={mode} />
          ) : null}

          <div className={styles.sceneStack}>
            {projects.map((project, index) => {
              const active = activeIndex === index;
              const Title = index === 0 ? 'h1' : 'h2';
              const caseStyle: AtlasStyle = {
                '--case-tilt': `${project.tilt}deg`,
                '--anchor-x': `${project.anchor.x}%`,
                '--anchor-y': `${project.anchor.y}%`,
              };

              return (
                <article
                  className={styles.atlasScene}
                  id={`dream-${project.slug}`}
                  data-active={active}
                  data-project-index={index}
                  data-project-scene={project.slug}
                  key={project.slug}
                  aria-hidden={!useStaticJourney && !active}
                  aria-labelledby={`dream-${project.slug}-title`}
                  style={caseStyle}
                >
                  <div className={styles.world} aria-hidden="true">
                    <Image
                      className={styles.worldImage}
                      src={project.image}
                      alt=""
                      fill
                      sizes={useStaticJourney ? '(max-width: 760px) 100vw, 58vw' : '100vw'}
                      preload={index === 0}
                      style={{ objectPosition: project.imagePosition }}
                    />
                    <div className={styles.worldWash} />
                  </div>

                  <div className={styles.worldCopy}>
                    <Title id={`dream-${project.slug}-title`}>{project.title}</Title>
                    <div className={styles.projectLine}>
                      <span>{project.classification}</span>
                      <span>{project.year}</span>
                    </div>
                    <p className={styles.subtitle}>{project.subtitle}</p>
                  </div>

                  <section
                    className={styles.caseFile}
                    aria-label={`${project.title} engineering evidence`}
                  >
                    <div className={styles.paperLayer} aria-hidden="true" />
                    <div className={styles.clip} aria-hidden="true"><span /></div>
                    <div className={styles.stamp} aria-hidden="true">
                      <strong>NF</strong><small>Evidence<br />engineered</small>
                    </div>

                    <header className={styles.fileHeader}>
                      <span>{padIndex(index)} / {projectCount}</span>
                      <strong>{project.status}</strong>
                    </header>

                    <div className={styles.compactRecord}>
                      <strong>{project.title}</strong>
                      <span>{project.role}</span>
                    </div>

                    <div className={styles.caseDetails}>
                      <dl className={styles.metadata}>
                        <div><dt>Role</dt><dd>{project.role}</dd></div>
                        <div><dt>Stack</dt><dd className={styles.stack}>{project.stack.join(' / ')}</dd></div>
                        <div><dt>Record</dt><dd>{project.description}</dd></div>
                      </dl>

                      <ul className={styles.evidenceList}>
                        {project.evidence.map((item, evidenceIndex) => (
                          <li
                            key={item}
                            data-active={active && activeFact === evidenceIndex}
                            data-signal={index === 0 && evidenceIndex === 0}
                            onPointerEnter={() => setActiveFact(evidenceIndex)}
                          >
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
                            tabIndex={!useStaticJourney && !active ? -1 : undefined}
                          >
                            {link.label}
                            {link.external ? <ExternalLink aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
                          </a>
                        ))}
                      </div>
                    </div>

                    <button
                      className={styles.revealEvidence}
                      type="button"
                      onClick={() => selectMode('evidence')}
                      tabIndex={mode === 'dream' && (useStaticJourney || active) ? undefined : -1}
                    >
                      Inspect evidence <ArrowUpRight aria-hidden="true" />
                    </button>
                  </section>
                </article>
              );
            })}
          </div>

          <svg
            className={styles.focusTrace}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={tracePath} />
            <circle cx={activeProject.anchor.x} cy={activeProject.anchor.y} r="0.62" />
            <circle className={styles.traceHalo} cx={activeProject.anchor.x} cy={activeProject.anchor.y} r="1.35" />
          </svg>

          <div
            className={styles.sceneAnchor}
            style={{ left: `${activeProject.anchor.x}%`, top: `${activeProject.anchor.y}%` }}
            aria-hidden="true"
          >
            <span>{padIndex(activeIndex)}</span>
          </div>

          <div className={styles.atlasChrome} aria-hidden="true">
            <span>Nazar Falach · evidence atlas</span>
            <span>Case {padIndex(activeIndex)} of {projectCount}</span>
          </div>

          <p className={styles.activeAnnouncement} aria-live="polite">
            Showing {activeProject.title}: {activeProject.subtitle}
          </p>

          <nav className={styles.projectRail} aria-label="Project evidence records">
            {projects.map((project, index) => (
              <button
                type="button"
                key={project.slug}
                data-active={activeIndex === index}
                aria-current={activeIndex === index ? 'step' : undefined}
                aria-label={`Open ${project.title}`}
                onClick={() => goToProject(index)}
              >
                <span>{padIndex(index)}</span>
                <strong>{project.title}</strong>
                <i aria-hidden="true" />
              </button>
            ))}
          </nav>

          <button
            className={styles.nextCase}
            type="button"
            onClick={() => goToProject(Math.min(activeIndex + 1, projects.length - 1))}
            disabled={activeIndex === projects.length - 1}
          >
            <span>{activeIndex === projects.length - 1 ? 'Final case' : 'Next case'}</span>
            <ArrowDown aria-hidden="true" />
          </button>
        </div>

        <div className={styles.scrollMarkers} aria-hidden="true">
          {projects.map((project, index) => (
            <div
              id={`dream-marker-${project.slug}`}
              data-atlas-marker
              data-project-index={index}
              key={project.slug}
            />
          ))}
        </div>
      </div>

      <section className={styles.contact} id="contact" aria-labelledby="contact-title">
        <div className={styles.contactSky} aria-hidden="true">
          <Image src="/assets/dreamworld/stairway-exit.webp" alt="" fill sizes="100vw" />
        </div>
        <div className={styles.contactSheet}>
          <h2 id="contact-title">The evidence ends here.<br />The work does not.</h2>
          <p>I am open to full-stack engineering roles and software projects where product thinking and production detail both matter.</p>
          <div className={styles.contactActions}>
            <a href="mailto:nazarfalach51@gmail.com"><Mail aria-hidden="true" /> Email Nazar</a>
            <a href="https://t.me/tedosss" target="_blank" rel="noreferrer"><Send aria-hidden="true" /> Telegram</a>
            <a href="/assets/nazar-falach-cv.pdf" download><Download aria-hidden="true" /> Download CV</a>
          </div>
          <small>Filed in Poland · Falach.pl · 2026</small>
        </div>
      </section>
    </main>
  );
}
