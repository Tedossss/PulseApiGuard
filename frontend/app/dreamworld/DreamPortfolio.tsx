'use client';

import { ArrowDown, ArrowUpRight, Github, Mail, Menu, Send, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Image from 'next/image';
import {
  type CSSProperties,
  type ReactNode,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './DreamPortfolio.module.css';
import { dreamProjects, dreamSceneCopy, dreamSections, dreamSkills, type DreamProject } from './dreamData';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const projectLookup = new Map(dreamProjects.map((project) => [project.slug, project]));
const projectOrder = [
  'pulseguard',
  'colab',
  'foundation',
  'prime-leather',
  'bookshelf',
  'local-ai-lab',
] as const;
type ProjectSlug = (typeof projectOrder)[number];
const projectSlugSet = new Set<string>(projectOrder);
const orderedProjects = projectOrder.flatMap((slug) => {
  const project = projectLookup.get(slug);
  return project ? [{ project, slug }] : [];
});

const homeLoaderLine = 'THE WEATHER IS ALMOST READY';
const cursorReach = 176;
const dialogCloseDuration = 620;
const exitCloseDuration = 760;
const visitedProjectsKey = 'falach:dream-project-visits';
const exitLoopKey = 'falach:dream-exit-loop';

function restoreDialogFocus(opener: HTMLElement) {
  window.requestAnimationFrame(() => {
    if (document.body.contains(opener)) opener.focus();
  });
}

export const dreamSceneOrder = [
  'home',
  ...projectOrder,
  'about',
  'contact',
] as const;

export type DreamSceneId = (typeof dreamSceneOrder)[number];

export type DreamProgressDetail = {
  progress: number;
  scene: DreamSceneId;
  sceneProgress: number;
};

export const dreamSceneFallbacks: Record<DreamSceneId, string> = {
  home: '/assets/dreamworld/meadow-house.webp',
  pulseguard: '/assets/dreamworld/meadow-house.webp',
  colab: '/assets/dreamworld/cloud-transit.webp',
  foundation: '/assets/dreamworld/endless-market.webp',
  'prime-leather': '/assets/dreamworld/repair-waiting.webp',
  bookshelf: '/assets/dreamworld/pastel-library.webp',
  'local-ai-lab': '/assets/dreamworld/computer-garden.webp',
  about: '/assets/dreamworld/about-room.webp',
  contact: '/assets/dreamworld/stairway-exit.webp',
};

type NavId = (typeof dreamSections)[number]['id'];

type DialogState = {
  opener: HTMLElement;
  phase: 'opening' | 'open' | 'closing';
  project: DreamProject;
  triggerRect: { left: number; top: number; width: number; height: number };
};

type CursorBadgeState = {
  label: string;
  slug: ProjectSlug | '';
  visible: boolean;
};

type DreamPortfolioProps = {
  /**
   * Root can pass the live WebGL layer here once DreamCanvas is wired.
   * The DOM layer stays usable without it.
   */
  canvasLayer?: ReactNode;
  /**
   * When a canvas layer is provided, keep the loader up until it reports ready.
   */
  canvasReady?: boolean;
};

type SceneDescriptor = {
  id: DreamSceneId;
  nav: NavId;
};

const sceneDescriptors: readonly SceneDescriptor[] = [
  { id: 'home', nav: 'home' },
  { id: 'pulseguard', nav: 'places' },
  { id: 'colab', nav: 'places' },
  { id: 'foundation', nav: 'places' },
  { id: 'prime-leather', nav: 'places' },
  { id: 'bookshelf', nav: 'places' },
  { id: 'local-ai-lab', nav: 'places' },
  { id: 'about', nav: 'about' },
  { id: 'contact', nav: 'contact' },
] as const;

const navTargets: Record<NavId, DreamSceneId> = {
  home: 'home',
  places: 'pulseguard',
  about: 'about',
  contact: 'contact',
};

const projectSceneCopy: Record<
  ProjectSlug,
  {
    landmark: string;
    note: string;
    prompt: string;
    sublabel: string;
  }
> = {
  pulseguard: {
    landmark: 'A white roadside house keeps one side door unlocked for incident reports.',
    note: 'The porch light is the status page.',
    prompt: 'Open the side door',
    sublabel: 'Door record',
  },
  colab: {
    landmark: 'A transit stop hums along with a route map that still updates itself.',
    note: 'The bus never quite leaves the curb.',
    prompt: 'Check the ticket window',
    sublabel: 'Transit ticket',
  },
  foundation: {
    landmark: 'A washed market corridor turns partner lists and pages into paper trails.',
    note: 'The receipt printer keeps renaming the floor.',
    prompt: 'Lift the hanging receipt',
    sublabel: 'Market receipt',
  },
  'prime-leather': {
    landmark: 'A repair waiting room hangs stitched tags beside a polished service bench.',
    note: 'Everything here looks ready for pickup.',
    prompt: 'Read the repair tag',
    sublabel: 'Repair tag',
  },
  bookshelf: {
    landmark: 'A library pool reflects giant pastel shelves and one book left open.',
    note: 'The page lands on the same spread every time.',
    prompt: 'Turn the floating page',
    sublabel: 'Open book',
  },
  'local-ai-lab': {
    landmark: 'A computer classroom grows vines around one monitor left running overnight.',
    note: 'The machine cooled down but never shut off.',
    prompt: 'Lift the monitor shutter',
    sublabel: 'Projector shutter',
  },
};

const heroNotes = {
  first: dreamSceneCopy.hero.firstTitle,
  return: dreamSceneCopy.hero.returnTitle,
  loop: 'You came back from the stairs.',
} as const;

function isProjectSceneId(sceneId: DreamSceneId): sceneId is ProjectSlug {
  return projectSlugSet.has(sceneId);
}

function isProjectSlug(value: string): value is ProjectSlug {
  return projectSlugSet.has(value);
}

function readVisitedProjects() {
  try {
    const raw = window.sessionStorage.getItem(visitedProjectsKey);
    if (!raw) return [] as ProjectSlug[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is ProjectSlug => typeof value === 'string' && isProjectSlug(value))
      : [];
  } catch {
    return [] as ProjectSlug[];
  }
}

function writeVisitedProjects(projects: ProjectSlug[]) {
  try {
    window.sessionStorage.setItem(visitedProjectsKey, JSON.stringify(projects));
  } catch {
    // Session storage is best-effort only.
  }
}

function readExitLoop() {
  try {
    return window.sessionStorage.getItem(exitLoopKey) === '1';
  } catch {
    return false;
  }
}

function writeExitLoop() {
  try {
    window.sessionStorage.setItem(exitLoopKey, '1');
  } catch {
    // Session storage is best-effort only.
  }
}

function getIdleLine(scene: DreamSceneId, hasVisitedProjects: boolean, loopedExit: boolean) {
  if (scene === 'home') {
    if (loopedExit) return 'the road still leads back here';
    if (hasVisitedProjects) return 'the weather remembered you';
    return 'the clouds only move when you stop';
  }

  if (scene === 'about') return dreamSceneCopy.about.note.toLowerCase();
  if (scene === 'contact') return 'the stairs are still listening';
  if (!isProjectSceneId(scene)) return '';
  return projectLookup.get(scene)?.microcopy ?? '';
}

function getDialogStyle(dialogState: DialogState | null): CSSProperties | undefined {
  if (!dialogState) return undefined;
  return {
    '--dialog-origin-x': `${dialogState.triggerRect.left + dialogState.triggerRect.width / 2}px`,
    '--dialog-origin-y': `${dialogState.triggerRect.top + dialogState.triggerRect.height / 2}px`,
  } as CSSProperties;
}

function ProjectScene({
  activeScene,
  onOpenProject,
  project,
  projectSlug,
  registerScene,
  registerTrigger,
  visited,
}: {
  activeScene: DreamSceneId;
  onOpenProject: (project: DreamProject, projectSlug: ProjectSlug, element: HTMLButtonElement) => void;
  project: DreamProject;
  projectSlug: ProjectSlug;
  registerScene: (id: DreamSceneId, element: HTMLElement | null) => void;
  registerTrigger: (slug: ProjectSlug, element: HTMLButtonElement | null) => void;
  visited: boolean;
}) {
  const copy = projectSceneCopy[projectSlug];

  return (
    <section
      ref={(element) => registerScene(projectSlug, element)}
      id={project.slug}
      className={styles.scene}
      data-scene={projectSlug}
      aria-current={activeScene === projectSlug ? 'step' : undefined}
      aria-labelledby={`${project.slug}-title`}
    >
      <div className={styles.sceneFrame}>
        <div className={styles.sceneImageWrap} aria-hidden="true">
          <Image
            src={dreamSceneFallbacks[projectSlug]}
            alt=""
            fill
            sizes="100vw"
            className={styles.sceneImage}
          />
        </div>
        <div className={styles.sceneTint} aria-hidden="true" />
        <div className={styles.sceneCloudBand} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.sceneGround} aria-hidden="true" />
        <div className={styles.sceneLandmark} aria-hidden="true">
          <span className={styles.landmarkPrimary} />
          <span className={styles.landmarkSecondary} />
          <span className={styles.landmarkAccent} />
        </div>

        <header className={styles.sceneCopy}>
          <p className={styles.sceneKicker}>
            <span>{project.label}</span>
            <span>{project.year}</span>
          </p>
          <h2 id={`${project.slug}-title`} className={styles.sceneTitle}>
            {project.title}
            {activeScene === projectSlug ? <span className={styles.srOnly}> Current scene.</span> : null}
          </h2>
          <p className={styles.sceneSummary}>{project.summary}</p>
          <p className={styles.sceneBody}>{project.description}</p>
        </header>

        <div className={styles.sceneLedger} aria-label={`${project.title} scene details`}>
          <p className={styles.ledgerLine}>
            <strong>Role</strong>
            <span>{project.role}</span>
          </p>
          <p className={styles.ledgerLine}>
            <strong>Environment</strong>
            <span>{copy.landmark}</span>
          </p>
          <div className={styles.factList} role="list" aria-label={`${project.title} key facts`}>
            {project.facts.map((fact) => (
              <span key={`${project.slug}-${fact}`} role="listitem">
                {fact}
              </span>
            ))}
          </div>
          <div className={styles.techRun} aria-label={`${project.title} technologies`}>
            {project.technologies.map((technology) => (
              <span key={`${project.slug}-${technology}`}>{technology}</span>
            ))}
          </div>
        </div>

        <button
          ref={(element) => registerTrigger(projectSlug, element)}
          type="button"
          className={styles.artifactButton}
          data-transition={project.transition}
          data-visited={visited}
          aria-describedby={`${project.slug}-object-note`}
          onClick={(event) => onOpenProject(project, projectSlug, event.currentTarget)}
        >
          <span className={styles.artifactLabel}>{copy.sublabel}</span>
          <span className={styles.artifactPrompt}>{copy.prompt}</span>
          <span className={styles.artifactMeta}>{project.objectLabel}</span>
        </button>

        <p id={`${project.slug}-object-note`} className={styles.objectNote}>
          {copy.note}
        </p>
      </div>
    </section>
  );
}

export function DreamPortfolio({ canvasLayer, canvasReady = false }: DreamPortfolioProps) {
  const rootRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  const sceneRefs = useRef<Record<DreamSceneId, HTMLElement | null>>({
    home: null,
    pulseguard: null,
    colab: null,
    foundation: null,
    'prime-leather': null,
    bookshelf: null,
    'local-ai-lab': null,
    about: null,
    contact: null,
  });
  const triggerRefs = useRef<Record<ProjectSlug, HTMLButtonElement | null>>({
    pulseguard: null,
    colab: null,
    foundation: null,
    'prime-leather': null,
    bookshelf: null,
    'local-ai-lab': null,
  });
  const activeSceneRef = useRef<DreamSceneId>('home');
  const activeNavRef = useRef<NavId>('home');
  const closeTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const loopRevealTimerRef = useRef<number | null>(null);
  const [activeScene, setActiveScene] = useState<DreamSceneId>('home');
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [initialImageReady, setInitialImageReady] = useState(false);
  const [loaderState, setLoaderState] = useState<'loading' | 'found' | 'hidden'>('loading');
  const [idle, setIdle] = useState(false);
  const [visitedProjects, setVisitedProjects] = useState<ProjectSlug[]>(() =>
    typeof window === 'undefined' ? [] : readVisitedProjects(),
  );
  const [loopedExit, setLoopedExit] = useState(() => (typeof window === 'undefined' ? false : readExitLoop()));
  const [looping, setLooping] = useState(false);
  const [cursorBadge, setCursorBadge] = useState<CursorBadgeState>({
    label: '',
    slug: '',
    visible: false,
  });

  const hasCanvasLayer = canvasLayer !== undefined && canvasLayer !== null;
  const effectiveCanvasReady = hasCanvasLayer ? canvasReady : true;
  const hasVisitedProjects = visitedProjects.length > 0;
  const heroTitle = loopedExit ? heroNotes.loop : hasVisitedProjects ? heroNotes.return : heroNotes.first;
  const heroDirectoryLabel = loopedExit ? 'Loop confirmed' : hasVisitedProjects ? 'Directory changed' : 'Directory stable';
  const idleLine = getIdleLine(activeScene, hasVisitedProjects, loopedExit);
  const dialogStyle = getDialogStyle(dialogState);
  const activeDialogSlug = dialogState?.project.slug;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerMedia = window.matchMedia('(pointer: fine)');

    const syncMedia = () => {
      setReducedMotion(reducedMedia.matches);
      setFinePointer(finePointerMedia.matches);
    };

    syncMedia();
    reducedMedia.addEventListener('change', syncMedia);
    finePointerMedia.addEventListener('change', syncMedia);

    return () => {
      reducedMedia.removeEventListener('change', syncMedia);
      finePointerMedia.removeEventListener('change', syncMedia);
    };
  }, []);

  useEffect(() => {
    if (loaderState !== 'loading' || !initialImageReady || !effectiveCanvasReady) return;
    const foundTimer = window.setTimeout(() => {
      setLoaderState('found');
    }, 0);
    return () => window.clearTimeout(foundTimer);
  }, [effectiveCanvasReady, initialImageReady, loaderState]);

  useEffect(() => {
    if (loaderState !== 'found') return;
    const hideTimer = window.setTimeout(
      () => setLoaderState('hidden'),
      reducedMotion ? 120 : 420,
    );
    return () => window.clearTimeout(hideTimer);
  }, [loaderState, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let idleTimer = 0;
    const resetIdle = () => {
      setIdle(false);
      window.dispatchEvent(new CustomEvent('falach:dream-idle', { detail: { idle: false } }));
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setIdle(true);
        window.dispatchEvent(new CustomEvent('falach:dream-idle', { detail: { idle: true } }));
      }, 8000);
    };

    resetIdle();
    const events: Array<keyof WindowEventMap> = ['pointermove', 'scroll', 'keydown', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetIdle, { passive: true }));

    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdle));
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sceneProgress = new Map<DreamSceneId, number>();

    const activateScene = (id: DreamSceneId, nav: NavId) => {
      if (activeSceneRef.current !== id) {
        activeSceneRef.current = id;
        startTransition(() => setActiveScene(id));
      }
      if (activeNavRef.current !== nav) {
        activeNavRef.current = nav;
        startTransition(() => setActiveNav(nav));
      }
    };

    const publishProgress = (nextProgress: number) => {
      const progress = clamp(nextProgress);
      const scene = activeSceneRef.current;
      const activeSceneProgress = sceneProgress.get(scene) ?? 0;
      root.style.setProperty('--scroll-progress', progress.toFixed(4));
      root.style.setProperty('--active-scene-progress', activeSceneProgress.toFixed(4));

      window.dispatchEvent(
        new CustomEvent<DreamProgressDetail>('falach:dream-progress', {
          detail: { progress, scene, sceneProgress: activeSceneProgress },
        }),
      );
    };

    const sceneTriggers = sceneDescriptors.flatMap(({ id, nav }) => {
      const element = sceneRefs.current[id];
      if (!element) return [];

      const progressTrigger = ScrollTrigger.create({
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          sceneProgress.set(id, self.progress);
          element.style.setProperty('--scene-progress', self.progress.toFixed(4));
          element.dataset.state = self.progress < 0.16 ? 'arrival' : self.progress < 0.72 ? 'middle' : 'exit';
        },
      });

      const activeTrigger = ScrollTrigger.create({
        trigger: element,
        start: 'top 45%',
        end: 'bottom 45%',
        onEnter: () => activateScene(id, nav),
        onEnterBack: () => activateScene(id, nav),
      });

      return [progressTrigger, activeTrigger];
    });

    const syncInitialScene = () => {
      let closest = sceneDescriptors[0];
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const descriptor of sceneDescriptors) {
        const element = sceneRefs.current[descriptor.id];
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        if (distance < closestDistance) {
          closest = descriptor;
          closestDistance = distance;
        }
      }
      activateScene(closest.id, closest.nav);
    };

    const resizeRefresh = () => {
      ScrollTrigger.refresh();
    };

    if (reducedMotion) {
      const paintNativeProgress = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        ScrollTrigger.update();
        publishProgress(window.scrollY / maxScroll);
      };
      const requestNativePaint = () => {
        if (rafRef.current) return;
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = 0;
          paintNativeProgress();
        });
      };

      syncInitialScene();
      paintNativeProgress();
      window.addEventListener('scroll', requestNativePaint, { passive: true });
      window.addEventListener('resize', resizeRefresh, { passive: true });

      return () => {
        sceneTriggers.forEach((trigger) => trigger.kill());
        window.removeEventListener('scroll', requestNativePaint);
        window.removeEventListener('resize', resizeRefresh);
        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      };
    }

    const lenis = new Lenis({
      duration: 1.2,
      gestureOrientation: 'vertical',
      syncTouch: false,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', () => {
      ScrollTrigger.update();
      publishProgress(lenis.progress);
    });

    const onAnchorClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (!target.hash || !target.hash.startsWith('#')) return;
      const section = document.getElementById(target.hash.slice(1));
      if (!section) return;
      event.preventDefault();
      lenis.scrollTo(section, { offset: 0 });
    };

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = window.requestAnimationFrame(raf);
    };

    ScrollTrigger.refresh();
    syncInitialScene();
    publishProgress(lenis.progress);
    rafRef.current = window.requestAnimationFrame(raf);
    document.addEventListener('click', onAnchorClick);
    window.addEventListener('resize', resizeRefresh, { passive: true });

    return () => {
      document.removeEventListener('click', onAnchorClick);
      window.removeEventListener('resize', resizeRefresh);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      sceneTriggers.forEach((trigger) => trigger.kill());
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!finePointer || reducedMotion || dialogState) return;

    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    let nextPointer = { x: 0, y: 0, vx: 0, vy: 0 };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0 };

    const paintPointer = () => {
      frame = 0;
      pointer.x = lerp(pointer.x, nextPointer.x, 0.22);
      pointer.y = lerp(pointer.y, nextPointer.y, 0.22);
      pointer.vx = lerp(pointer.vx, nextPointer.vx, 0.2);
      pointer.vy = lerp(pointer.vy, nextPointer.vy, 0.2);

      root.style.setProperty('--cursor-x', `${pointer.x}px`);
      root.style.setProperty('--cursor-y', `${pointer.y}px`);
      root.style.setProperty('--cursor-artifact', `${Math.min(1, Math.hypot(pointer.vx, pointer.vy) / 32).toFixed(3)}`);

      let nearest:
        | {
            distance: number;
            label: string;
            slug: ProjectSlug;
          }
        | undefined;

      orderedProjects.forEach(({ slug }) => {
        const trigger = triggerRefs.current[slug];
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
        if (!nearest || distance < nearest.distance) {
          nearest = {
            distance,
            label: projectSceneCopy[slug].sublabel,
            slug,
          };
        }
      });

      if (nearest && nearest.distance <= cursorReach) {
        const nearestBadge = nearest;
        setCursorBadge((previous) => {
          if (
            previous.visible &&
            previous.slug === nearestBadge.slug &&
            previous.label === nearestBadge.label
          ) {
            return previous;
          }
          return {
            label: nearestBadge.label,
            slug: nearestBadge.slug,
            visible: true,
          };
        });
      } else {
        setCursorBadge((previous) => (previous.visible ? { ...previous, visible: false } : previous));
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      nextPointer = {
        x: event.clientX,
        y: event.clientY,
        vx: event.movementX,
        vy: event.movementY,
      };
      if (!frame) frame = window.requestAnimationFrame(paintPointer);
    };

    const hidePointer = () => {
      setCursorBadge((previous) => (previous.visible ? { ...previous, visible: false } : previous));
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', hidePointer);
    window.addEventListener('blur', hidePointer);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', hidePointer);
      window.removeEventListener('blur', hidePointer);
    };
  }, [dialogState, finePointer, reducedMotion]);

  useEffect(() => {
    if (!activeDialogSlug) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const moveFocusInside = () => {
      const surface = dialogRef.current;
      if (!surface) return;
      const focusables = Array.from(surface.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
      );
      const initial = focusables.find((element) => element.dataset.dialogInitialFocus !== undefined) ?? focusables[0];
      initial?.focus();
    };

    if (reducedMotion) {
      moveFocusInside();
    } else {
      const focusFrame = window.requestAnimationFrame(moveFocusInside);
      return () => {
        window.cancelAnimationFrame(focusFrame);
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      };
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [activeDialogSlug, reducedMotion]);

  useEffect(() => {
    if (!dialogState) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }

        const opener = dialogState.opener;
        if (reducedMotion) {
          setDialogState(null);
          restoreDialogFocus(opener);
          return;
        }

        setDialogState((current) => (current ? { ...current, phase: 'closing' } : current));
        closeTimerRef.current = window.setTimeout(() => {
          setDialogState(null);
          restoreDialogFocus(opener);
          closeTimerRef.current = null;
        }, dialogCloseDuration);
        return;
      }

      if (event.key !== 'Tab') return;
      const surface = dialogRef.current;
      if (!surface) return;

      const focusables = Array.from(surface.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialogState, reducedMotion]);

  useEffect(() => {
    if (!menuOpen || dialogState) return;

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener('keydown', closeMenuOnEscape);
    return () => document.removeEventListener('keydown', closeMenuOnEscape);
  }, [dialogState, menuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (loopTimerRef.current) {
        window.clearTimeout(loopTimerRef.current);
      }
      if (loopRevealTimerRef.current) {
        window.clearTimeout(loopRevealTimerRef.current);
      }
    };
  }, []);

  const registerScene = (id: DreamSceneId, element: HTMLElement | null) => {
    sceneRefs.current[id] = element;
  };

  const registerTrigger = (slug: ProjectSlug, element: HTMLButtonElement | null) => {
    triggerRefs.current[slug] = element;
  };

  const scrollToScene = (sceneId: DreamSceneId) => {
    const target = sceneRefs.current[sceneId];
    if (!target) return;
    const restoreMenuFocus = menuOpen;
    setMenuOpen(false);
    if (restoreMenuFocus) menuButtonRef.current?.focus();
    if (lenisRef.current && !reducedMotion) {
      lenisRef.current.scrollTo(target, { offset: 0 });
      return;
    }
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const rememberProjectVisit = (slug: ProjectSlug) => {
    setVisitedProjects((current) => {
      if (current.includes(slug)) return current;
      const next = [...current, slug];
      writeVisitedProjects(next);
      return next;
    });
  };

  const openProject = (project: DreamProject, projectSlug: ProjectSlug, opener: HTMLButtonElement) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const rect = opener.getBoundingClientRect();
    rememberProjectVisit(projectSlug);
    setDialogState({
      opener,
      phase: reducedMotion ? 'open' : 'opening',
      project,
      triggerRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });

    if (!reducedMotion) {
      window.requestAnimationFrame(() => {
        setDialogState((current) =>
          current && current.project.slug === project.slug ? { ...current, phase: 'open' } : current,
        );
      });
    }
  };

  function closeProject() {
    if (!dialogState) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const opener = dialogState.opener;
    if (reducedMotion) {
      setDialogState(null);
      restoreDialogFocus(opener);
      return;
    }

    setDialogState((current) => (current ? { ...current, phase: 'closing' } : current));
    closeTimerRef.current = window.setTimeout(() => {
      setDialogState(null);
      restoreDialogFocus(opener);
      closeTimerRef.current = null;
    }, dialogCloseDuration);
  }

  const handleExitLoop = () => {
    if (looping) return;
    writeExitLoop();
    setLoopedExit(true);
    setIdle(false);
    setLooping(true);

    loopTimerRef.current = window.setTimeout(() => {
      const target = sceneRefs.current.home;
      if (target && lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(target, { immediate: true });
      } else {
        target?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }

      loopRevealTimerRef.current = window.setTimeout(() => {
        setLooping(false);
        loopRevealTimerRef.current = null;
      }, 320);
      loopTimerRef.current = null;
    }, reducedMotion ? 20 : exitCloseDuration);
  };

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-dream-world
      data-loader-state={loaderState}
      data-reduced-motion={reducedMotion}
      data-idle={idle}
      data-return-visit={hasVisitedProjects || loopedExit}
    >
      <div
        className={styles.experienceShell}
        aria-hidden={dialogState ? true : undefined}
        inert={dialogState ? true : undefined}
      >
        <a className={styles.skipLink} href="#dream-main">
          Skip to portfolio scenes
        </a>

      <div className={styles.loader} aria-live="polite" data-visible={loaderState !== 'hidden'}>
        <span>{dreamSceneCopy.loader.top}</span>
        <strong>{loaderState === 'loading' ? homeLoaderLine : dreamSceneCopy.loader.done}</strong>
      </div>

      <div className={styles.canvasSlot} aria-hidden="true" data-has-canvas={hasCanvasLayer}>
        {canvasLayer}
      </div>

      <button
        type="button"
        className={styles.menuBackdrop}
        data-open={menuOpen}
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
      />

      <nav className={styles.directory} aria-label="Portfolio directory">
        <button className={styles.wordmark} type="button" onClick={() => scrollToScene('home')}>
          <span>Nazar Falach</span>
          <em>{heroDirectoryLabel}</em>
        </button>

        <div className={styles.desktopNav}>
          {dreamSections.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-current={activeNav === section.id ? 'page' : undefined}
              data-active={activeNav === section.id}
              onClick={() => scrollToScene(navTargets[section.id])}
            >
              {section.label}
            </button>
          ))}
        </div>

        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="dream-mobile-nav"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className={styles.srOnly}>{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <div
          className={styles.mobileNav}
          id="dream-mobile-nav"
          data-open={menuOpen}
          aria-hidden={!menuOpen}
        >
          {dreamSections.map((section) => (
            <button
              key={section.id}
              type="button"
              tabIndex={menuOpen ? 0 : -1}
              aria-current={activeNav === section.id ? 'page' : undefined}
              data-active={activeNav === section.id}
              onClick={() => scrollToScene(navTargets[section.id])}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {finePointer && !reducedMotion ? (
        <div className={styles.cursorBadge} data-visible={cursorBadge.visible} aria-hidden="true">
          <span>{cursorBadge.label}</span>
        </div>
      ) : null}

      <div className={styles.idlePrompt} data-visible={idle && !dialogState && idleLine.length > 0}>
        <span>{idleLine}</span>
      </div>

      <div id="dream-main" className={styles.sceneRail}>
        <section
          ref={(element) => registerScene('home', element)}
          id="home"
          className={styles.scene}
          data-scene="home"
          aria-current={activeScene === 'home' ? 'step' : undefined}
          aria-labelledby="dream-hero-title"
        >
          <div className={styles.sceneFrame}>
            <div className={styles.sceneImageWrap} aria-hidden="true">
              <Image
                src={dreamSceneFallbacks.home}
                alt=""
                fill
                priority
                sizes="100vw"
                className={styles.sceneImage}
                onLoad={() => setInitialImageReady(true)}
              />
            </div>
            <div className={styles.sceneTint} aria-hidden="true" />
            <div className={styles.heroClouds} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className={styles.heroRoad} aria-hidden="true" />
            <div className={styles.heroHouse} aria-hidden="true">
              <span />
            </div>
            <div className={styles.heroSignpost} aria-hidden="true">
              <span />
              <span />
            </div>

            <header className={styles.heroCopy}>
              <p className={styles.heroKicker}>falach.pl / weather restored</p>
              <h1 id="dream-hero-title" className={styles.heroTitle}>
                {heroTitle}
              </h1>
              <p className={styles.heroSubline}>{dreamSceneCopy.hero.subtitle}</p>
              <p className={styles.heroBody}>{dreamSceneCopy.hero.body}</p>
            </header>

            <div className={styles.heroActions}>
              <button type="button" className={styles.heroAction} onClick={() => scrollToScene('pulseguard')}>
                <span>Follow the road</span>
                <ArrowDown aria-hidden="true" />
              </button>
              <button type="button" className={styles.heroActionGhost} onClick={() => scrollToScene('about')}>
                Read the inventory
              </button>
            </div>

            <p className={styles.heroAside}>
              The road starts practical, keeps getting stranger, and still ends with real work.
            </p>
          </div>
        </section>

        {orderedProjects.map(({ project, slug }) => (
          <ProjectScene
            key={slug}
            activeScene={activeScene}
            onOpenProject={openProject}
            project={project}
            projectSlug={slug}
            registerScene={registerScene}
            registerTrigger={registerTrigger}
            visited={visitedProjects.includes(slug)}
          />
        ))}

        <section
          ref={(element) => registerScene('about', element)}
          id="about"
          className={styles.scene}
          data-scene="about"
          aria-current={activeScene === 'about' ? 'step' : undefined}
          aria-labelledby="about-title"
        >
          <div className={styles.sceneFrame}>
            <div className={styles.sceneImageWrap} aria-hidden="true">
              <Image
                src={dreamSceneFallbacks.about}
                alt=""
                fill
                sizes="100vw"
                className={styles.sceneImage}
              />
            </div>
            <div className={styles.sceneTint} aria-hidden="true" />
            <div className={styles.aboutShelves} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <header className={styles.aboutCopy}>
              <p className={styles.sceneKicker}>{dreamSceneCopy.about.kicker}</p>
              <h2 id="about-title" className={styles.sceneTitle}>
                {dreamSceneCopy.about.title}
                {activeScene === 'about' ? <span className={styles.srOnly}> Current scene.</span> : null}
              </h2>
              <p className={styles.sceneSummary}>{dreamSceneCopy.about.subtitle}</p>
              <p className={styles.sceneBody}>{dreamSceneCopy.about.body}</p>
            </header>

            <div className={styles.inventoryBoard} aria-label="Working inventory">
              {dreamSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </section>

        <section
          ref={(element) => registerScene('contact', element)}
          id="contact"
          className={styles.scene}
          data-scene="contact"
          aria-current={activeScene === 'contact' ? 'step' : undefined}
          aria-labelledby="contact-title"
        >
          <div className={styles.sceneFrame}>
            <div className={styles.sceneImageWrap} aria-hidden="true">
              <Image
                src={dreamSceneFallbacks.contact}
                alt=""
                fill
                sizes="100vw"
                className={styles.sceneImage}
              />
            </div>
            <div className={styles.sceneTint} aria-hidden="true" />
            <div className={styles.exitStairs} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <header className={styles.contactCopy}>
              <p className={styles.sceneKicker}>Sky stairs</p>
              <h2 id="contact-title" className={styles.sceneTitle}>
                {dreamSceneCopy.contact.title}
                {activeScene === 'contact' ? <span className={styles.srOnly}> Current scene.</span> : null}
              </h2>
              <p className={styles.sceneBody}>{dreamSceneCopy.contact.body}</p>
            </header>

            <div className={styles.contactLinks}>
              <a href="mailto:nazarfalach51@gmail.com">
                <Mail aria-hidden="true" />
                <span>nazarfalach51@gmail.com</span>
              </a>
              <a href="https://github.com/Tedossss" target="_blank" rel="noreferrer noopener">
                <Github aria-hidden="true" />
                <span>github.com/Tedossss</span>
              </a>
              <a href="https://t.me/tedosss" target="_blank" rel="noreferrer noopener">
                <Send aria-hidden="true" />
                <span>t.me/tedosss</span>
              </a>
            </div>

            <button type="button" className={styles.exitButton} onClick={handleExitLoop} disabled={looping}>
              <span>{dreamSceneCopy.contact.exit}</span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      <div className={styles.loopDoor} data-active={looping} aria-hidden="true">
        <span />
        <span />
      </div>
      </div>

      {dialogState ? (
        <div
          className={styles.dialogRoot}
          data-visible={dialogState.phase !== 'closing'}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProject();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogState.project.slug}-dialog-title`}
            className={styles.dialogSurface}
            data-state={dialogState.phase}
            data-transition={dialogState.project.transition}
            style={dialogStyle}
          >
            <button
              type="button"
              className={styles.dialogClose}
              autoFocus
              data-dialog-initial-focus
              onClick={closeProject}
            >
              Close
            </button>

            <div className={styles.dialogHeader}>
              <p className={styles.sceneKicker}>
                <span>{dialogState.project.label}</span>
                <span>{dialogState.project.year}</span>
              </p>
              <h2 id={`${dialogState.project.slug}-dialog-title`} className={styles.dialogTitle}>
                {dialogState.project.title}
              </h2>
              <p className={styles.dialogSummary}>{dialogState.project.summary}</p>
            </div>

            <div className={styles.dialogFacts}>
              <p>
                <strong>Role</strong>
                <span>{dialogState.project.role}</span>
              </p>
              {dialogState.project.details.map((detail) => (
                <p key={`${dialogState.project.slug}-${detail.label}`}>
                  <strong>{detail.label}</strong>
                  <span>{detail.value}</span>
                </p>
              ))}
            </div>

            <div className={styles.dialogColumns}>
              <div className={styles.dialogColumn}>
                <h3>Facts</h3>
                <ul>
                  {dialogState.project.facts.map((fact) => (
                    <li key={`${dialogState.project.slug}-${fact}`}>{fact}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.dialogColumn}>
                <h3>Technology</h3>
                <ul>
                  {dialogState.project.technologies.map((technology) => (
                    <li key={`${dialogState.project.slug}-${technology}`}>{technology}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.dialogLinks}>
              {dialogState.project.links.map((link) => (
                <a
                  key={`${dialogState.project.slug}-${link.label}`}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer noopener' : undefined}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
