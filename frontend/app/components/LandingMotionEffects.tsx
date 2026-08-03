"use client";

import { useEffect, useRef } from 'react';

export function LandingMotionEffects() {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = markerRef.current?.closest<HTMLElement>('.landing-v2');
    if (!surface) return;

    let frame = 0;
    const updatePointer = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        surface.style.setProperty('--pointer-x', `${event.clientX}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY}px`);
      });
    };

    const resetPointer = () => {
      surface.style.setProperty('--pointer-x', '72vw');
      surface.style.setProperty('--pointer-y', '32vh');
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', resetPointer);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', updatePointer);
      document.documentElement.removeEventListener('mouseleave', resetPointer);
    };
  }, []);

  return (
    <div ref={markerRef} className="landing-motion-layer" aria-hidden="true">
      <div className="landing-pointer-glow" />
      <div className="landing-scroll-progress"><span /></div>
    </div>
  );
}
