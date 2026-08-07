"use client";

import { useEffect, useRef } from 'react';

export function LandingMotionEffects() {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = markerRef.current?.closest<HTMLElement>('.landing-v2');
    if (!surface) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;

    let frame = 0;
    const updatePointer = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        surface.style.setProperty('--pointer-x', `${event.clientX}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY}px`);
        const horizontal = (event.clientX / window.innerWidth - 0.5) * 2;
        const vertical = (event.clientY / window.innerHeight - 0.5) * 2;
        surface.style.setProperty('--tilt-x', `${vertical * -2.4}deg`);
        surface.style.setProperty('--tilt-y', `${horizontal * 3.2}deg`);
      });
    };

    const resetPointer = () => {
      surface.style.setProperty('--pointer-x', '72vw');
      surface.style.setProperty('--pointer-y', '32vh');
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
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
