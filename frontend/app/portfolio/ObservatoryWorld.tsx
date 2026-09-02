'use client';

import { useEffect, useRef } from 'react';
import type { ObservatorySceneController } from './observatoryScene';
import styles from './ObservatoryWorld.module.css';

export const OBSERVATORY_PROGRESS_EVENT = 'observatory:progress';

export type ObservatoryProgressDetail =
  | number
  | {
      progress: number;
    };

type ObservatoryWorldProps = {
  className?: string;
};

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

function readProgress(root: HTMLElement | null) {
  if (!root) return 0;

  const datasetValue = Number.parseFloat(root.dataset.observatoryProgress ?? '');
  if (Number.isFinite(datasetValue)) return clampProgress(datasetValue);

  const styles = getComputedStyle(root);
  const customProperty = Number.parseFloat(styles.getPropertyValue('--observatory-progress'));
  return Number.isFinite(customProperty) ? clampProgress(customProperty) : 0;
}

function progressFromEvent(event: Event, root: HTMLElement | null) {
  const detail = (event as CustomEvent<ObservatoryProgressDetail>).detail;
  const value = typeof detail === 'number' ? detail : detail?.progress;
  return Number.isFinite(value) ? clampProgress(value) : readProgress(root);
}

export function ObservatoryWorld({ className }: ObservatoryWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const root = document.querySelector<HTMLElement>('[data-observatory-root]');
    if (!host || !canvas) return;

    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    const compactQuery = matchMedia('(max-width: 760px), (pointer: coarse)');
    let controller: ObservatorySceneController | null = null;
    let disposed = false;
    let contextAvailable = true;
    let restorationFrame = 0;

    const setState = (state: 'poster' | 'loading' | 'ready' | 'fallback') => {
      if (!disposed) host.dataset.state = state;
    };

    const resize = () => {
      controller?.resize(
        Math.max(1, host.clientWidth),
        Math.max(1, host.clientHeight),
        window.devicePixelRatio || 1,
      );
    };

    const boot = async () => {
      if (compactQuery.matches || reducedQuery.matches) {
        setState('poster');
        return;
      }

      setState('loading');

      try {
        const { createObservatoryScene } = await import('./observatoryScene');
        if (disposed) return;
        controller = createObservatoryScene(canvas, {
          mobile: compactQuery.matches,
          reducedMotion: reducedQuery.matches,
        });
        controller.setProgress(readProgress(root));
        controller.setVisible(!document.hidden && contextAvailable);
        resize();
        setState('ready');
      } catch (error) {
        controller?.dispose();
        controller = null;
        setState('fallback');

        console.warn('The Lucid Vivarium is using its CSS poster fallback.', error);
      }
    };

    const onProgress = (event: Event) => {
      controller?.setProgress(progressFromEvent(event, root));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches || reducedQuery.matches) return;
      controller?.setPointer(
        (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1),
      );
    };

    const onPointerLeave = () => controller?.setPointer(0, 0);

    const onVisibilityChange = () => {
      controller?.setVisible(!document.hidden && contextAvailable);
    };

    const onMotionPreference = () => {
      controller?.setReducedMotion(reducedQuery.matches);
      if (reducedQuery.matches) controller?.setPointer(0, 0);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextAvailable = false;
      controller?.setVisible(false);
      setState('fallback');
    };

    const onContextRestored = () => {
      contextAvailable = true;
      cancelAnimationFrame(restorationFrame);
      restorationFrame = requestAnimationFrame(() => {
        if (disposed) return;
        controller?.setVisible(!document.hidden);
        resize();
        controller?.renderNow();
        setState('ready');
      });
    };

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
    resizeObserver?.observe(host);
    window.addEventListener(OBSERVATORY_PROGRESS_EVENT, onProgress);
    document.addEventListener(OBSERVATORY_PROGRESS_EVENT, onProgress);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedQuery.addEventListener('change', onMotionPreference);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    void boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(restorationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener(OBSERVATORY_PROGRESS_EVENT, onProgress);
      document.removeEventListener(OBSERVATORY_PROGRESS_EVENT, onProgress);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedQuery.removeEventListener('change', onMotionPreference);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      controller?.dispose();
      controller = null;
    };
  }, []);

  const classes = className ? [styles.world, className].join(' ') : styles.world;

  return (
    <div
      ref={hostRef}
      className={classes}
      data-observatory-world
      data-state="poster"
      aria-hidden="true"
    >
      <div className={styles.poster}>
        <i />
        <i />
        <i />
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
