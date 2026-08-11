'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './ObservatoryChrome.module.css';

const LOADING_STEPS = [
  'WARMING INSTRUMENTS',
  'ALIGNING MIRRORS',
  'SIGNAL PATH OPEN',
] as const;

const LOADER_EXIT_STAGE = LOADING_STEPS.length;
const LOADER_DISMISSED_STAGE = LOADER_EXIT_STAGE + 1;

const OBSERVATORY_ROOMS = [
  { index: '00', label: 'CAUSEWAY', href: '#top', descriptor: 'ENTRY SPAN / PUBLIC' },
  { index: '01', label: 'TICKET HALL', href: '#about', descriptor: 'ORIENTATION / PROFILE' },
  { index: '02', label: 'ARCHIVE', href: '#work', descriptor: 'CATALOGUE / SELECTED WORK' },
  { index: '03', label: 'CALIBRATION', href: '#practice', descriptor: 'INSTRUMENT BAY / PRACTICE' },
  { index: '04', label: 'ROOFLINE', href: '#contact', descriptor: 'EXTERNAL DECK / CONTACT' },
] as const;

const DEFAULT_LOCATION = { index: '00', label: 'CAUSEWAY' };

export type ObservatoryLocationDetail = {
  index: string | number;
  label: string;
};

type ObservatoryLocation = {
  index: string;
  label: string;
};

type SuppressedElementState = {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
};

function suppressOutside(activeElement: HTMLElement) {
  const suppressedElements: SuppressedElementState[] = [];
  let branch: HTMLElement = activeElement;
  let parent = branch.parentElement;

  while (parent) {
    Array.from(parent.children).forEach((sibling) => {
      if (sibling === branch || !(sibling instanceof HTMLElement) || ['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) {
        return;
      }

      suppressedElements.push({
        element: sibling,
        inert: sibling.inert,
        ariaHidden: sibling.getAttribute('aria-hidden'),
      });
      sibling.inert = true;
      sibling.setAttribute('aria-hidden', 'true');
    });

    if (parent === document.body) break;
    branch = parent;
    parent = parent.parentElement;
  }

  return () => {
    suppressedElements.reverse().forEach(({ element, inert, ariaHidden }) => {
      element.inert = inert;
      if (ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', ariaHidden);
    });
  };
}

function parseLocation(detail: unknown): ObservatoryLocation | null {
  if (!detail || typeof detail !== 'object') return null;

  const candidate = detail as Partial<ObservatoryLocationDetail>;
  if ((typeof candidate.index !== 'string' && typeof candidate.index !== 'number') || typeof candidate.label !== 'string') {
    return null;
  }

  const rawIndex = String(candidate.index).trim();
  const label = candidate.label.trim();
  if (!rawIndex || !label) return null;

  return {
    index: rawIndex.padStart(2, '0').slice(0, 3),
    label: label.toUpperCase().slice(0, 40),
  };
}

export function ObservatoryChrome() {
  const [loadingStage, setLoadingStage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState<ObservatoryLocation>(DEFAULT_LOCATION);
  const dialogRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const indexButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuTitleId = `${menuId}-title`;
  const loaderExiting = loadingStage >= LOADER_EXIT_STAGE;
  const loadingComplete = loadingStage >= LOADER_DISMISSED_STAGE;
  const visibleLoadingStage = Math.min(loadingStage, LOADING_STEPS.length - 1);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reducedMotionTimer = window.setTimeout(() => setLoadingStage(LOADER_DISMISSED_STAGE), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    const timers = [
      window.setTimeout(() => setLoadingStage(1), 360),
      window.setTimeout(() => setLoadingStage(2), 730),
      window.setTimeout(() => setLoadingStage(LOADER_EXIT_STAGE), 1110),
      window.setTimeout(() => setLoadingStage(LOADER_DISMISSED_STAGE), 1720),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (loadingComplete) return;

    const loader = loaderRef.current;
    if (!loader) return;

    const previousOverflow = document.body.style.overflow;
    const restoreOutside = suppressOutside(loader);
    document.body.style.overflow = 'hidden';

    return () => {
      restoreOutside();
      document.body.style.overflow = previousOverflow;
    };
  }, [loadingComplete]);

  useEffect(() => {
    const handleLocation = (event: Event) => {
      const nextLocation = parseLocation((event as CustomEvent<unknown>).detail);
      if (!nextLocation) return;

      setLocation((currentLocation) => (
        currentLocation.index === nextLocation.index && currentLocation.label === nextLocation.label
          ? currentLocation
          : nextLocation
      ));
    };

    window.addEventListener('observatory:location', handleLocation);
    return () => window.removeEventListener('observatory:location', handleLocation);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusableElements = () => (
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => {
          if (element.hasAttribute('hidden') || element.inert || element.getAttribute('aria-hidden') === 'true') return false;
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
        })
    );

    dialog.focus({ preventScroll: true });
    const restoreOutside = suppressOutside(dialog);
    const focusFrame = window.requestAnimationFrame(() => {
      getFocusableElements()[0]?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreOutside();

      const elementToRestore = restoreFocusRef.current;
      if (elementToRestore?.isConnected) elementToRestore.focus({ preventScroll: true });
      restoreFocusRef.current = null;
    };
  }, [menuOpen]);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorMedia = window.matchMedia(
      '(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    );
    if (!cursor) return;

    let releaseCursor: (() => void) | null = null;

    const enableCursor = () => {
      if (releaseCursor || !cursorMedia.matches) return;

      document.documentElement.classList.add('observatoryCursor');
      let pointerFrame = 0;
      let pointerX = -40;
      let pointerY = -40;

      const paintPointer = () => {
        pointerFrame = 0;
        cursor.style.setProperty('--pointer-x', `${pointerX}px`);
        cursor.style.setProperty('--pointer-y', `${pointerY}px`);
      };

      const handlePointerMove = (event: PointerEvent) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        cursor.dataset.visible = 'true';
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(paintPointer);
      };

      const handlePointerOver = (event: PointerEvent) => {
        const target = event.target instanceof Element
          ? event.target.closest('a, button, [data-observatory-target]')
          : null;
        cursor.dataset.target = target ? 'true' : 'false';
      };

      const handlePointerDown = () => { cursor.dataset.pressed = 'true'; };
      const handlePointerUp = () => { cursor.dataset.pressed = 'false'; };
      const hidePointer = () => { cursor.dataset.visible = 'false'; };

      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerover', handlePointerOver, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
      window.addEventListener('pointerup', handlePointerUp, { passive: true });
      window.addEventListener('blur', hidePointer);
      document.documentElement.addEventListener('mouseleave', hidePointer);

      releaseCursor = () => {
        document.documentElement.classList.remove('observatoryCursor');
        window.cancelAnimationFrame(pointerFrame);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerover', handlePointerOver);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('blur', hidePointer);
        document.documentElement.removeEventListener('mouseleave', hidePointer);
        cursor.dataset.visible = 'false';
        cursor.dataset.target = 'false';
        cursor.dataset.pressed = 'false';
      };
    };

    const syncCursor = () => {
      if (cursorMedia.matches) {
        enableCursor();
      } else if (releaseCursor) {
        releaseCursor();
        releaseCursor = null;
      }
    };

    syncCursor();
    cursorMedia.addEventListener('change', syncCursor);

    return () => {
      cursorMedia.removeEventListener('change', syncCursor);
      releaseCursor?.();
    };
  }, []);

  const openMenu = () => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : indexButtonRef.current;
    setMenuOpen(true);
  };

  return (
    <>
      <div
        className={styles.loader}
        ref={loaderRef}
        data-ready={loaderExiting}
        data-stage={visibleLoadingStage}
        aria-hidden={loadingComplete}
      >
        <div className={styles.loaderHeader} aria-hidden="true">
          <span>THE SLEEP OBSERVATORY</span>
          <span>ENTRY PROTOCOL / 52.2297° N</span>
        </div>

        <div className={styles.instrument} aria-hidden="true">
          <i /><i /><i /><i />
          <span>SO</span>
        </div>

        <div className={styles.loadingReadout}>
          <p className={styles.loadingKicker} aria-hidden="true">NIGHT INSTRUMENT ARRAY / STARTUP</p>
          <p className={styles.loadingStatus} role="status" aria-live="polite">
            <span>{String(visibleLoadingStage + 1).padStart(2, '0')}</span>
            {LOADING_STEPS[visibleLoadingStage]}
          </p>
          <ol className={styles.loadingSteps} aria-hidden="true">
            {LOADING_STEPS.map((step, index) => (
              <li
                key={step}
                data-state={index < visibleLoadingStage ? 'complete' : index === visibleLoadingStage ? 'active' : 'pending'}
              >
                <i />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={styles.chrome} data-menu-open={menuOpen}>
        <aside
          className={styles.locationReadout}
          aria-label={`Current observatory location ${location.index}, ${location.label}`}
        >
          <span className={styles.locationIndex}>{location.index}</span>
          <span className={styles.locationName}>{location.label}</span>
          <span className={styles.coordinates}>52.2297° N / 21.0122° E</span>
        </aside>

        <button
          className={styles.indexButton}
          ref={indexButtonRef}
          type="button"
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          aria-label="Open the Observatory Index"
          aria-hidden={menuOpen}
          tabIndex={menuOpen ? -1 : 0}
          onClick={openMenu}
        >
          <span>OBSERVATORY INDEX</span>
          <i className={styles.indexGlyph} aria-hidden="true"><i /><i /><i /></i>
        </button>
      </div>

      <div
        className={styles.menu}
        id={menuId}
        ref={dialogRef}
        role="dialog"
        aria-modal={menuOpen ? 'true' : undefined}
        aria-labelledby={menuTitleId}
        aria-hidden={!menuOpen}
        data-open={menuOpen}
        tabIndex={-1}
      >
        <div className={styles.planGrid} aria-hidden="true" />

        <header className={styles.planHeader}>
          <div>
            <p>PUBLIC CIRCULATION PLAN / PLATE 01</p>
            <h2 id={menuTitleId}>Observatory Index</h2>
          </div>
          <div className={styles.planLegend} aria-hidden="true">
            <span><i /> OPEN ROUTE</span>
            <span><i /> CURRENT POSITION</span>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            aria-label="Close the Observatory Index"
            onClick={() => setMenuOpen(false)}
          >
            <span>CLOSE PLAN</span>
            <i aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.floorPlan} aria-label="Observatory locations">
          <ol>
            {OBSERVATORY_ROOMS.map((room) => (
              <li key={room.index} data-current={location.index === room.index}>
                <a
                  href={room.href}
                  tabIndex={menuOpen ? 0 : -1}
                  aria-label={`Go to ${room.label}, observatory location ${room.index}`}
                  aria-current={location.index === room.index ? 'location' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.roomIndex}>{room.index}</span>
                  <span className={styles.roomName}>{room.label}</span>
                  <span className={styles.roomDescriptor}>{room.descriptor}</span>
                  <span className={styles.roomArrow} aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
          <div className={styles.serviceCore} aria-hidden="true">
            <span>VOID</span>
            <i /><i />
          </div>
        </nav>

        <footer className={styles.planFooter} aria-hidden="true">
          <div className={styles.northMark}><i />N<span>TRUE NORTH</span></div>
          <p>THE SLEEP OBSERVATORY <span>/</span> VISITOR MOVEMENT STUDY <span>/</span> REV. 04</p>
          <div className={styles.scale}><span>0</span><i /><i /><i /><i /><span>20 M</span></div>
        </footer>
      </div>

      <div
        className={styles.cursor}
        ref={cursorRef}
        data-visible="false"
        data-target="false"
        data-pressed="false"
        aria-hidden="true"
      >
        <i />
        <span />
      </div>
    </>
  );
}
