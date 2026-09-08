'use client';

import { type MutableRefObject, useEffect, useRef } from 'react';
import { createDreamScene, dreamSegmentFromProgress, type DreamSceneController } from './dreamScene';
import styles from './DreamCanvas.module.css';

export type DreamCanvasProps = {
  className?: string;
  progressRef: MutableRefObject<number>;
  sceneRef?: MutableRefObject<number>;
  reducedMotion?: boolean;
  mobile?: boolean;
  onReady?: () => void;
  onFallback?: () => void;
  skipInitializationWhenReducedMotion?: boolean;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Parent contract:
 * - `progressRef.current` must be kept in normalized `0..1` page-progress space.
 * - `sceneRef.current` is updated by this component with the active scene index `0..8`.
 * - `onReady` fires once WebGL is live; `onFallback` fires if WebGL boot fails or is skipped.
 * - `reducedMotion` disables ambient drift; `skipInitializationWhenReducedMotion` keeps the poster only.
 */
export function DreamCanvas({
  className,
  progressRef,
  sceneRef,
  reducedMotion = false,
  mobile = false,
  onReady,
  onFallback,
  skipInitializationWhenReducedMotion = false,
}: DreamCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let controller: DreamSceneController | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let restoreFrame = 0;
    let disposed = false;
    let contextAvailable = true;
    let readyNotified = false;
    let lastScene = -1;

    const updateHostState = (state: 'poster' | 'loading' | 'ready' | 'fallback') => {
      if (!disposed) host.dataset.state = state;
    };

    const pushSceneRef = (progress: number) => {
      const scene = dreamSegmentFromProgress(progress);
      if (scene !== lastScene) {
        lastScene = scene;
        if (sceneRef) sceneRef.current = scene;
      }
    };

    const resize = () => {
      if (!controller) return;
      controller.resize(
        Math.max(1, host.clientWidth),
        Math.max(1, host.clientHeight),
        window.devicePixelRatio || 1,
      );
    };

    const setFallback = () => {
      updateHostState('fallback');
      onFallback?.();
    };

    const boot = () => {
      if (skipInitializationWhenReducedMotion && reducedMotion) {
        pushSceneRef(clamp(progressRef.current));
        setFallback();
        return;
      }

      updateHostState('loading');

      try {
        controller = createDreamScene(canvas, {
          mobile,
          reducedMotion,
          onSceneChange: (sceneIndex) => {
            if (sceneRef) sceneRef.current = sceneIndex;
            lastScene = sceneIndex;
          },
        });
      } catch (error) {
        console.warn('Dream canvas boot failed, keeping poster fallback.', error);
        controller?.dispose();
        controller = null;
        setFallback();
        return;
      }

      resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
      resizeObserver?.observe(host);
      resize();
      controller.setProgress(clamp(progressRef.current));
      controller.setVisible(!document.hidden && contextAvailable);
      controller.setIdle(
        document.querySelector('[data-dream-world]')?.getAttribute('data-idle') === 'true',
      );
      pushSceneRef(clamp(progressRef.current));
      updateHostState('ready');
      if (!readyNotified) {
        readyNotified = true;
        onReady?.();
      }
      if (reducedMotion) controller.renderNow();
    };

    const onDreamProgress = (event: Event) => {
      if (!controller) return;
      const detail = (event as CustomEvent<{ progress?: number }>).detail;
      const nextProgress = Number.isFinite(detail?.progress)
        ? clamp(detail.progress as number)
        : clamp(progressRef.current);
      controller.setProgress(nextProgress);
      pushSceneRef(nextProgress);
    };

    const onDreamIdle = (event: Event) => {
      const detail = (event as CustomEvent<{ idle?: boolean }>).detail;
      controller?.setIdle(Boolean(detail?.idle));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!controller || mobile || reducedMotion) return;
      controller.setPointer(
        (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1),
      );
    };

    const onPointerLeave = () => {
      controller?.setPointer(0, 0);
    };

    const onVisibilityChange = () => {
      controller?.setVisible(!document.hidden && contextAvailable);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextAvailable = false;
      controller?.setVisible(false);
      updateHostState('fallback');
    };

    const onContextRestored = () => {
      contextAvailable = true;
      window.cancelAnimationFrame(restoreFrame);
      restoreFrame = window.requestAnimationFrame(() => {
        if (!controller || disposed) return;
        resize();
        controller.setVisible(!document.hidden);
        controller.renderNow();
        updateHostState('ready');
      });
    };

    window.addEventListener('falach:dream-progress', onDreamProgress);
    window.addEventListener('falach:dream-idle', onDreamIdle);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    boot();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(restoreFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('falach:dream-progress', onDreamProgress);
      window.removeEventListener('falach:dream-idle', onDreamIdle);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      controller?.dispose();
      controller = null;
    };
  }, [
    mobile,
    onFallback,
    onReady,
    progressRef,
    reducedMotion,
    sceneRef,
    skipInitializationWhenReducedMotion,
  ]);

  const classes = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div ref={hostRef} className={classes} data-state="poster" aria-hidden="true">
      <div className={styles.poster}>
        <div className={styles.posterRoad} />
        <div className={styles.posterBuildings}>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
