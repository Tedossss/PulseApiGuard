'use client';

import { ArrowDown, ArrowUpRight, Download, Github, Mail, Send, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './DreamPortfolio.module.css';
import { dreamProjects, dreamSceneCopy, dreamSkills, type DreamProject } from './dreamData';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const dialogCloseDuration = 360;
const exitCloseDuration = 700;
const visitedProjectsKey = 'falach:dream-project-visits';
const exitLoopKey = 'falach:dream-exit-loop';
const homeLoaderLine = 'THE STREET IS ALMOST HERE';

const orderedProjects = dreamProjects;
const projectLookup = new Map(orderedProjects.map((project) => [project.slug, project]));
const projectSlugSet = new Set(orderedProjects.map((project) => project.slug));

export const dreamSceneOrder = [
  'home',
  ...orderedProjects.map((project) => project.slug),
  'about',
  'contact',
] as const;

export type DreamSceneId = (typeof dreamSceneOrder)[number];

export type DreamProgressDetail = {
  progress: number;
  scene: DreamSceneId;
  sceneProgress: number;
};

type DialogState = {
  opener: HTMLElement;
  phase: 'opening' | 'open' | 'closing';
  project: DreamProject;
  triggerRect: { left: number; top: number; width: number; height: number };
};

type LoaderState =
  | { phase: 'loading' }
  | { phase: 'found' | 'hidden'; reason: 'canvas-ready' | 'fail-open' | 'reduced-motion' };

type DreamPortfolioProps = {
  /** The visual world. Semantic content remains complete if this layer cannot boot. */
  canvasLayer?: ReactNode;
  /** True after the canvas has either rendered or deliberately yielded to the CSS fallback. */
  canvasReady?: boolean;
};

function restoreDialogFocus(opener: HTMLElement) {
  window.requestAnimationFrame(() => {
    if (document.body.contains(opener)) opener.focus();
  });
}

function readVisitedProjects() {
  try {
    const raw = window.sessionStorage.getItem(visitedProjectsKey);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string' && projectSlugSet.has(value))
      : [];
  } catch {
    return [] as string[];
  }
}

function writeVisitedProjects(projects: string[]) {
  try {
    window.sessionStorage.setItem(visitedProjectsKey, JSON.stringify(projects));
  } catch {
    // Session storage is a progressive enhancement.
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
    // Session storage is a progressive enhancement.
  }
}

function getDialogStyle(dialogState: DialogState | null): CSSProperties | undefined {
  if (!dialogState) return undefined;
  return {
    '--dialog-origin-x': `${dialogState.triggerRect.left + dialogState.triggerRect.width / 2}px`,
    '--dialog-origin-y': `${dialogState.triggerRect.top + dialogState.triggerRect.height / 2}px`,
  } as CSSProperties;
}

function FallbackWorld() {
  return (
    <div className={styles.fallbackWorld} aria-hidden="true">
      <span className={styles.fallbackCloudOne} />
      <span className={styles.fallbackCloudTwo} />
      <span className={styles.fallbackHillFar} />
      <span className={styles.fallbackHillNear} />
      <span className={styles.fallbackRoad} />
      <span className={styles.fallbackTower} />
    </div>
  );
}

function ProjectScene({
  activeScene,
  index,
  onOpenProject,
  project,
  registerScene,
  visited,
}: {
  activeScene: DreamSceneId;
  index: number;
  onOpenProject: (project: DreamProject, opener: HTMLButtonElement) => void;
  project: DreamProject;
  registerScene: (id: DreamSceneId, element: HTMLElement | null) => void;
  visited: boolean;
}) {
  const active = activeScene === project.slug;
  const side = index % 2 === 0 ? 'left' : 'right';

  return (
    <section
      ref={(element) => registerScene(project.slug, element)}
      id={project.slug}
      className={styles.scene}
      data-scene={project.slug}
      data-project-index={index}
      aria-current={active ? 'step' : undefined}
      aria-labelledby={`${project.slug}-title`}
    >
      <div className={styles.sceneFrame}>
        <FallbackWorld />

        <article className={styles.evidenceMarker} data-side={side} data-active={active}>
          <h2 id={`${project.slug}-title`} className={styles.projectTitle}>
            {project.title}
            {active ? <span className={styles.srOnly}> Current stop.</span> : null}
          </h2>
          <p className={styles.projectSummary}>{project.summary}</p>

          <dl className={styles.markerFacts}>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Roadside signal</dt>
              <dd>{project.facts[0]}</dd>
            </div>
          </dl>

          <p className={styles.projectTeaser}>{project.teaser}</p>

          <div className={styles.markerActions}>
            <button
              type="button"
              className={styles.inspectButton}
              data-visited={visited}
              aria-haspopup="dialog"
              aria-controls={`${project.slug}-dialog`}
              onClick={(event) => onOpenProject(project, event.currentTarget)}
            >
              <span>{visited ? 'Inspect again' : 'Inspect project'}</span>
              <ArrowUpRight aria-hidden="true" />
            </button>
            <span className={styles.markerMeta}>
              {project.label} · {project.year}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function DreamPortfolio({ canvasLayer, canvasReady = false }: DreamPortfolioProps) {
  const rootRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const directoryRef = useRef<HTMLElement>(null);
  const directoryButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  const sceneRefs = useRef(new Map<DreamSceneId, HTMLElement>());
  const activeSceneRef = useRef<DreamSceneId>('home');
  const closeTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const loopRevealTimerRef = useRef<number | null>(null);

  const [activeScene, setActiveScene] = useState<DreamSceneId>('home');
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loaderState, setLoaderState] = useState<LoaderState>({ phase: 'loading' });
  const [idle, setIdle] = useState(false);
  const [visitedProjects, setVisitedProjects] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readVisitedProjects(),
  );
  const [loopedExit, setLoopedExit] = useState(() =>
    typeof window === 'undefined' ? false : readExitLoop(),
  );
  const [looping, setLooping] = useState(false);

  const hasCanvasLayer = canvasLayer !== undefined && canvasLayer !== null;
  const effectiveCanvasReady = hasCanvasLayer ? canvasReady : true;
  const dialogStyle = getDialogStyle(dialogState);
  const activeDialogSlug = dialogState?.project.slug;
  const activeProjectIndex = orderedProjects.findIndex((project) => project.slug === activeScene);
  const directoryIndex = activeProjectIndex >= 0
    ? activeProjectIndex
    : activeScene === 'home'
      ? 0
      : orderedProjects.length - 1;
  const directoryProgress = orderedProjects.length > 1
    ? directoryIndex / (orderedProjects.length - 1)
    : 0;
  const directoryStyle = {
    '--directory-progress': directoryProgress,
  } as CSSProperties;
  const activeProject = projectLookup.get(activeScene);
  const activeSceneLabel = activeProject?.title
    ?? (activeScene === 'about' ? 'About' : activeScene === 'contact' ? 'Contact' : 'Home');
  const loaderPhase = loaderState.phase;
  const loaderReleaseReason = loaderPhase === 'loading' ? 'pending' : loaderState.reason;

  useEffect(() => {
    const directory = directoryRef.current;
    const project = orderedProjects[directoryIndex];
    const button = project ? directoryButtonRefs.current.get(project.slug) : undefined;
    if (!directory || !button || directory.scrollWidth <= directory.clientWidth) return;

    const frame = window.requestAnimationFrame(() => {
      button.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [directoryIndex, reducedMotion]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    let syncFrame = 0;
    const syncMedia = () => {
      const nextReducedMotion = reducedMedia.matches;
      setReducedMotion(nextReducedMotion);
      if (!nextReducedMotion) return;
      setLoaderState((current) =>
        current.phase === 'hidden' && current.reason === 'reduced-motion'
          ? current
          : { phase: 'hidden', reason: 'reduced-motion' },
      );
    };

    syncFrame = window.requestAnimationFrame(syncMedia);
    reducedMedia.addEventListener('change', syncMedia);
    return () => {
      if (syncFrame) window.cancelAnimationFrame(syncFrame);
      reducedMedia.removeEventListener('change', syncMedia);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || loaderPhase !== 'loading' || !effectiveCanvasReady) return;
    const foundTimer = window.setTimeout(() => setLoaderState({ phase: 'found', reason: 'canvas-ready' }), 0);
    return () => window.clearTimeout(foundTimer);
  }, [effectiveCanvasReady, loaderPhase, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || loaderPhase !== 'loading') return;
    const failOpenTimer = window.setTimeout(() => setLoaderState({ phase: 'found', reason: 'fail-open' }), 2200);
    return () => window.clearTimeout(failOpenTimer);
  }, [loaderPhase, reducedMotion]);

  useEffect(() => {
    if (loaderPhase !== 'found') return;
    const hideTimer = window.setTimeout(() => {
      setLoaderState((current) =>
        current.phase === 'found' ? { phase: 'hidden', reason: current.reason } : current,
      );
    }, 420);
    return () => window.clearTimeout(hideTimer);
  }, [loaderPhase]);

  useEffect(() => {
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

    const activateScene = (id: DreamSceneId) => {
      if (activeSceneRef.current === id) return;
      activeSceneRef.current = id;
      startTransition(() => setActiveScene(id));
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

    const sceneTriggers = dreamSceneOrder.flatMap((id) => {
      const element = sceneRefs.current.get(id);
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
        start: 'top 48%',
        end: 'bottom 48%',
        onEnter: () => activateScene(id),
        onEnterBack: () => activateScene(id),
      });

      return [progressTrigger, activeTrigger];
    });

    const syncInitialScene = () => {
      let closest: DreamSceneId = dreamSceneOrder[0];
      let closestDistance = Number.POSITIVE_INFINITY;
      dreamSceneOrder.forEach((id) => {
        const element = sceneRefs.current.get(id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        if (distance < closestDistance) {
          closest = id;
          closestDistance = distance;
        }
      });
      activateScene(closest);
    };

    const resizeRefresh = () => ScrollTrigger.refresh();

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
      duration: 1.15,
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
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor?.hash) return;
      const section = document.getElementById(anchor.hash.slice(1));
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
    if (!activeDialogSlug) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

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
      const initial = focusables.find((element) => element.dataset.dialogInitialFocus !== undefined)
        ?? focusables[0];
      initial?.focus();
    };

    if (reducedMotion) {
      moveFocusInside();
      return () => {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      };
    }

    const focusFrame = window.requestAnimationFrame(moveFocusInside);
    return () => {
      window.cancelAnimationFrame(focusFrame);
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

    const requestClose = () => {
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
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
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
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current);
      if (loopRevealTimerRef.current) window.clearTimeout(loopRevealTimerRef.current);
    };
  }, []);

  const registerScene = (id: DreamSceneId, element: HTMLElement | null) => {
    if (element) sceneRefs.current.set(id, element);
    else sceneRefs.current.delete(id);
  };

  const scrollToScene = (sceneId: DreamSceneId) => {
    const target = sceneRefs.current.get(sceneId);
    if (!target) return;
    if (lenisRef.current && !reducedMotion) {
      lenisRef.current.scrollTo(target, { offset: 0 });
      return;
    }
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const rememberProjectVisit = (slug: string) => {
    setVisitedProjects((current) => {
      if (current.includes(slug)) return current;
      const next = [...current, slug];
      writeVisitedProjects(next);
      return next;
    });
  };

  const openProject = (project: DreamProject, opener: HTMLButtonElement) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const rect = opener.getBoundingClientRect();
    rememberProjectVisit(project.slug);
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

  const closeProject = () => {
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
  };

  const followDialogLink = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    event.preventDefault();
    const sceneId = href.slice(1);
    setDialogState(null);
    window.setTimeout(() => scrollToScene(sceneId), 0);
  };

  const handleExitLoop = () => {
    if (looping) return;
    writeExitLoop();
    setLoopedExit(true);
    setIdle(false);
    setLooping(true);

    loopTimerRef.current = window.setTimeout(() => {
      const target = sceneRefs.current.get('home');
      if (target && lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(target, { immediate: true });
      } else {
        target?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }

      loopRevealTimerRef.current = window.setTimeout(() => {
        setLooping(false);
        loopRevealTimerRef.current = null;
      }, 300);
      loopTimerRef.current = null;
    }, reducedMotion ? 20 : exitCloseDuration);
  };

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-dream-world
      data-loader-state={loaderPhase}
      data-loader-release={loaderReleaseReason}
      data-reduced-motion={reducedMotion}
      data-idle={idle}
      data-return-visit={visitedProjects.length > 0 || loopedExit}
    >
      <div
        className={styles.experienceShell}
        aria-hidden={dialogState ? true : undefined}
        inert={dialogState ? true : undefined}
      >
        <a className={styles.skipLink} href="#dream-main">
          Skip to portfolio stops
        </a>

        <div className={styles.loader} aria-live="polite" data-visible={loaderPhase !== 'hidden'}>
          <span>Loading the street</span>
          <strong>{loaderPhase === 'loading' ? homeLoaderLine : 'ROAD READY'}</strong>
        </div>

        <div className={styles.canvasSlot} aria-hidden="true" data-has-canvas={hasCanvasLayer}>
          {canvasLayer}
        </div>
        <div className={styles.grain} aria-hidden="true" />

        <header className={styles.siteHeader}>
          <button type="button" className={styles.topContact} onClick={() => scrollToScene('contact')}>
            <span>Contact</span>
            <ArrowDown aria-hidden="true" />
          </button>
        </header>

        <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
          Current portfolio stop: {activeSceneLabel}.
        </p>

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
              <FallbackWorld />

              <header className={styles.identitySign}>
                <h1 id="dream-hero-title">Nazar Falach</h1>
                <p>Full-stack engineer · Poland</p>
                <strong>Six places. One remembered street.</strong>
              </header>

              <button
                type="button"
                className={styles.scrollCue}
                onClick={() => scrollToScene(orderedProjects[0]?.slug ?? 'about')}
              >
                <span>Follow the road</span>
                <ArrowDown aria-hidden="true" />
              </button>

              {visitedProjects.length > 0 || loopedExit ? (
                <p className={styles.returnNote}>The street remembered your footsteps.</p>
              ) : null}
            </div>
          </section>

          {orderedProjects.map((project, index) => (
            <ProjectScene
              key={project.slug}
              activeScene={activeScene}
              index={index}
              onOpenProject={openProject}
              project={project}
              registerScene={registerScene}
              visited={visitedProjects.includes(project.slug)}
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
              <FallbackWorld />
              <article className={styles.aboutSign}>
                <h2 id="about-title">
                  {dreamSceneCopy.about.title}
                  {activeScene === 'about' ? <span className={styles.srOnly}> Current stop.</span> : null}
                </h2>
                <p className={styles.aboutRole}>{dreamSceneCopy.about.subtitle}</p>
                <p className={styles.aboutBody}>{dreamSceneCopy.about.body}</p>
                <div className={styles.skillDirectory} aria-label="Technology experience">
                  {dreamSkills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </article>
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
              <FallbackWorld />
              <article className={styles.contactSign}>
                <h2 id="contact-title">
                  {dreamSceneCopy.contact.title}
                  {activeScene === 'contact' ? <span className={styles.srOnly}> Current stop.</span> : null}
                </h2>
                <p>{dreamSceneCopy.contact.body}</p>

                <div className={styles.contactLinks}>
                  <a href="mailto:nazarfalach51@gmail.com">
                    <Mail aria-hidden="true" />
                    <span>Email</span>
                  </a>
                  <a href="https://github.com/Tedossss" target="_blank" rel="noreferrer noopener">
                    <Github aria-hidden="true" />
                    <span>GitHub</span>
                  </a>
                  <a href="https://t.me/tedosss" target="_blank" rel="noreferrer noopener">
                    <Send aria-hidden="true" />
                    <span>Telegram</span>
                  </a>
                  <a href="/assets/nazar-falach-cv.pdf" download>
                    <Download aria-hidden="true" />
                    <span>Download CV</span>
                  </a>
                </div>

                <button type="button" className={styles.exitButton} onClick={handleExitLoop} disabled={looping}>
                  <span>{looping ? 'Returning…' : dreamSceneCopy.contact.exit}</span>
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </article>
            </div>
          </section>
        </div>

        <nav
          ref={directoryRef}
          className={styles.streetDirectory}
          aria-label="Project street directory"
          style={directoryStyle}
        >
          <span className={styles.directoryLine} aria-hidden="true">
            <span />
          </span>
          {orderedProjects.map((project, index) => {
            const active = project.slug === activeScene;
            return (
              <button
                key={project.slug}
                ref={(element) => {
                  if (element) directoryButtonRefs.current.set(project.slug, element);
                  else directoryButtonRefs.current.delete(project.slug);
                }}
                type="button"
                data-active={active}
                data-visited={visitedProjects.includes(project.slug)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${project.title}, stop ${index + 1} of ${orderedProjects.length}`}
                onClick={() => scrollToScene(project.slug)}
              >
                <span>{project.title}</span>
              </button>
            );
          })}
        </nav>

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
            if (event.target === event.currentTarget) closeProject();
          }}
        >
          <div
            ref={dialogRef}
            id={`${dialogState.project.slug}-dialog`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogState.project.slug}-dialog-title`}
            aria-describedby={`${dialogState.project.slug}-dialog-summary`}
            className={styles.dialogSurface}
            data-state={dialogState.phase}
            style={dialogStyle}
          >
            <button
              type="button"
              className={styles.dialogClose}
              autoFocus
              data-dialog-initial-focus
              onClick={closeProject}
            >
              <span>Close</span>
              <X aria-hidden="true" />
            </button>

            <header className={styles.dialogHeader}>
              <h2 id={`${dialogState.project.slug}-dialog-title`} className={styles.dialogTitle}>
                {dialogState.project.title}
              </h2>
              <p id={`${dialogState.project.slug}-dialog-summary`} className={styles.dialogSummary}>
                {dialogState.project.summary}
              </p>
              <p className={styles.dialogMeta}>
                {dialogState.project.role} · {dialogState.project.year} · {dialogState.project.label}
              </p>
            </header>

            <div className={styles.dialogFacts}>
              <p>
                <strong>Description</strong>
                <span>{dialogState.project.description}</span>
              </p>
              {dialogState.project.details.map((detail) => (
                <p key={`${dialogState.project.slug}-${detail.label}`}>
                  <strong>{detail.label}</strong>
                  <span>{detail.value}</span>
                </p>
              ))}
            </div>

            <div className={styles.dialogColumns}>
              <section>
                <h3>Verified facts</h3>
                <ul>
                  {dialogState.project.facts.map((fact) => (
                    <li key={`${dialogState.project.slug}-${fact}`}>{fact}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Technology</h3>
                <ul>
                  {dialogState.project.technologies.map((technology) => (
                    <li key={`${dialogState.project.slug}-${technology}`}>{technology}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className={styles.dialogLinks}>
              {dialogState.project.links.map((link) => (
                <a
                  key={`${dialogState.project.slug}-${link.label}`}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer noopener' : undefined}
                  onClick={(event) => followDialogLink(event, link.href)}
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
