import { ImageResponse } from 'next/og';

export const alt = 'Nazar Falach — full-stack engineer and interactive dream portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          color: '#162434',
          background: 'linear-gradient(180deg, #89cfff 0 58%, #d8f5b8 58% 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', inset: 0 }}>
          <g fill="#ffffff" opacity=".75">
            <ellipse cx="245" cy="154" rx="118" ry="48" />
            <ellipse cx="338" cy="141" rx="82" ry="34" />
            <ellipse cx="884" cy="121" rx="140" ry="54" />
            <ellipse cx="996" cy="144" rx="88" ry="38" />
          </g>
          <g fill="#9ed56d" opacity=".9">
            <path d="M0 445 C120 386 248 392 360 435 C482 482 592 500 720 456 C846 411 979 382 1200 448 V630 H0 Z" />
            <path d="M0 500 C168 451 291 471 404 520 C545 580 676 579 815 528 C928 487 1039 476 1200 516 V630 H0 Z" fill="#76b254" />
          </g>
          <g fill="#fbf7ef" stroke="#2f3c45" strokeWidth="4">
            <path d="M770 396 L848 321 L926 396 V519 H770 Z" />
            <rect x="804" y="447" width="43" height="72" fill="#cfeab9" />
            <rect x="826" y="379" width="32" height="44" fill="#d9f0ff" />
          </g>
          <path d="M548 630 L623 360 L662 360 L738 630 Z" fill="#f6f2e8" opacity=".85" />
          <path d="M0 630 L484 410 L516 410 L0 630 Z" fill="#f8f6f1" opacity=".82" />
          <path d="M1200 630 L707 410 L739 410 L1200 630 Z" fill="#f8f6f1" opacity=".82" />
        </svg>
        <div style={{ position: 'absolute', top: 34, left: 42, display: 'flex', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          FALACH.PL / AUGUST 2026
        </div>
        <div style={{ position: 'absolute', top: 34, right: 42, display: 'flex', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          FULL-STACK ENGINEER / POLAND
        </div>
        <div style={{ position: 'absolute', top: 106, left: 42, display: 'flex', flexDirection: 'column', fontSize: 82, lineHeight: .83, letterSpacing: -5 }}>
          <span>YOU TOOK</span><span>THE LONG WAY.</span>
        </div>
        <div style={{ position: 'absolute', right: 42, bottom: 30, display: 'flex', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          NAZAR FALACH / PRODUCTION SYSTEMS / INTERACTIVE PORTFOLIO
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: 42, display: 'flex', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          SYSTEMS / APPLIED AI / FRONTEND ENGINEERING
        </div>
      </div>
    ),
    size,
  );
}
