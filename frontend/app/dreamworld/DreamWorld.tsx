'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DreamPortfolio, type DreamProgressDetail } from './DreamPortfolio';

const DynamicDreamCanvas = dynamic(
  () => import('./DreamCanvas').then((module) => module.DreamCanvas),
  { ssr: false },
);

type DreamProgressEvent = CustomEvent<DreamProgressDetail>;

export function DreamWorld() {
  const progressRef = useRef(0);
  const sceneRef = useRef(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canvasSettled, setCanvasSettled] = useState(false);

  useEffect(() => {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 760px), (pointer: coarse)');

    const syncMedia = () => {
      setReducedMotion(reducedQuery.matches);
      setMobile(mobileQuery.matches);
      setMediaReady(true);
    };

    syncMedia();
    reducedQuery.addEventListener('change', syncMedia);
    mobileQuery.addEventListener('change', syncMedia);

    return () => {
      reducedQuery.removeEventListener('change', syncMedia);
      mobileQuery.removeEventListener('change', syncMedia);
    };
  }, []);

  useEffect(() => {
    const syncProgress = (event: Event) => {
      const detail = (event as DreamProgressEvent).detail;
      if (!detail || !Number.isFinite(detail.progress)) return;
      progressRef.current = Math.min(1, Math.max(0, detail.progress));
    };

    window.addEventListener('falach:dream-progress', syncProgress);
    return () => window.removeEventListener('falach:dream-progress', syncProgress);
  }, []);

  const handleCanvasReady = useCallback(() => setCanvasSettled(true), []);
  const handleCanvasFallback = useCallback(() => setCanvasSettled(true), []);

  const canvasLayer = useMemo(
    () =>
      mediaReady ? (
        <DynamicDreamCanvas
          progressRef={progressRef}
          sceneRef={sceneRef}
          mobile={mobile}
          reducedMotion={reducedMotion}
          skipInitializationWhenReducedMotion
          onReady={handleCanvasReady}
          onFallback={handleCanvasFallback}
        />
      ) : (
        <span aria-hidden="true" />
      ),
    [handleCanvasFallback, handleCanvasReady, mediaReady, mobile, reducedMotion],
  );

  return <DreamPortfolio canvasLayer={canvasLayer} canvasReady={canvasSettled} />;
}
