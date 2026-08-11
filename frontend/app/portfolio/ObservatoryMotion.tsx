'use client';

import { useEffect } from 'react';

type ObservatoryLocation = {
  index: string;
  label: string;
  selector: string;
  variable: string;
};

const locations: readonly ObservatoryLocation[] = [
  { index: '00', label: 'CAUSEWAY', selector: '[data-observatory-act="causeway"]', variable: '--causeway-progress' },
  { index: '01', label: 'TICKET HALL', selector: '[data-observatory-act="hall"]', variable: '--hall-progress' },
  { index: '02', label: 'ARCHIVE', selector: '[data-observatory-act="archive"]', variable: '--archive-progress' },
  { index: '03', label: 'CALIBRATION', selector: '[data-observatory-act="calibration"]', variable: '--calibration-progress' },
  { index: '04', label: 'ROOFLINE', selector: '[data-observatory-act="roofline"]', variable: '--roofline-progress' },
] as const;

const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

function progressThrough(element: HTMLElement, viewportHeight: number) {
  const bounds = element.getBoundingClientRect();
  const travel = Math.max(1, element.offsetHeight - viewportHeight);
  return clamp(-bounds.top / travel);
}

export function ObservatoryMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-observatory-root]');
    if (!root) return;

    const sections = locations.map((location) => ({
      ...location,
      node: root.querySelector<HTMLElement>(location.selector),
    }));
    const records = [...root.querySelectorAll<HTMLElement>('[data-project-record]')];
    const recordCounter = root.querySelector<HTMLElement>('[data-record-counter]');
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const coarseQuery = matchMedia('(pointer: coarse)');
    let frame = 0;
    let previousScroll = scrollY;
    let previousTime = performance.now();
    let smoothedVelocity = 0;
    let lastLocation = '';
    let lastProject = '';

    document.documentElement.classList.add('observatory-mode');

    const update = (time = performance.now()) => {
      frame = 0;
      const viewport = innerHeight;
      const rootBounds = root.getBoundingClientRect();
      const totalTravel = Math.max(1, root.offsetHeight - viewport);
      const progress = clamp(-rootBounds.top / totalTravel);
      const elapsed = Math.max(16, time - previousTime);
      const rawVelocity = (scrollY - previousScroll) / elapsed;
      smoothedVelocity += (rawVelocity - smoothedVelocity) * 0.18;
      previousScroll = scrollY;
      previousTime = time;

      root.style.setProperty('--observatory-progress', progress.toFixed(5));
      root.style.setProperty('--scroll-velocity', clamp(Math.abs(smoothedVelocity) / 1.6).toFixed(4));
      root.dataset.motion = reducedQuery.matches ? 'reduced' : 'full';
      root.dataset.pointer = coarseQuery.matches ? 'coarse' : 'fine';

      let activeLocation = sections[0];
      const focusLine = viewport * 0.48;
      for (const section of sections) {
        if (!section.node) continue;
        const localProgress = progressThrough(section.node, viewport);
        root.style.setProperty(section.variable, localProgress.toFixed(5));
        const rect = section.node.getBoundingClientRect();
        if (rect.top <= focusLine && rect.bottom >= focusLine) activeLocation = section;
      }

      const archive = sections[2]?.node;
      const archiveProgress = archive ? progressThrough(archive, viewport) : 0;
      const project = String(Math.min(3, Math.floor(clamp(archiveProgress, 0, 0.9999) * 4)));
      root.dataset.activeProject = project;

      if (project !== lastProject) {
        lastProject = project;
        if (recordCounter) recordCounter.textContent = String(Number(project) + 1).padStart(2, '0');
        records.forEach((record, index) => {
          const hidden = index !== Number(project) && !reducedQuery.matches;
          record.inert = hidden;
          record.setAttribute('aria-hidden', String(hidden));
        });
        dispatchEvent(new CustomEvent('observatory:project', { detail: { index: Number(project) } }));
      }
      if (activeLocation && activeLocation.index !== lastLocation) {
        lastLocation = activeLocation.index;
        root.dataset.locationIndex = activeLocation.index;
        root.dataset.locationLabel = activeLocation.label;
        dispatchEvent(new CustomEvent('observatory:location', {
          detail: { index: activeLocation.index, label: activeLocation.label },
        }));
      }

      dispatchEvent(new CustomEvent('observatory:progress', {
        detail: {
          progress,
          velocity: smoothedVelocity,
          reduced: reducedQuery.matches,
          coarse: coarseQuery.matches,
          activeProject: Number(project),
        },
      }));
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const capabilityChange = () => {
      lastProject = '';
      requestUpdate();
    };
    const pointerMove = (event: PointerEvent) => {
      if (coarseQuery.matches) return;
      const x = event.clientX / innerWidth - 0.5;
      const y = event.clientY / innerHeight - 0.5;
      root.style.setProperty('--pointer-x', x.toFixed(4));
      root.style.setProperty('--pointer-y', y.toFixed(4));
      dispatchEvent(new CustomEvent('observatory:pointer', { detail: { x, y } }));
    };

    update();
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    addEventListener('pointermove', pointerMove, { passive: true });
    reducedQuery.addEventListener('change', capabilityChange);
    coarseQuery.addEventListener('change', capabilityChange);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('observatory-mode');
      removeEventListener('scroll', requestUpdate);
      removeEventListener('resize', requestUpdate);
      removeEventListener('pointermove', pointerMove);
      reducedQuery.removeEventListener('change', capabilityChange);
      coarseQuery.removeEventListener('change', capabilityChange);
    };
  }, []);

  return null;
}
