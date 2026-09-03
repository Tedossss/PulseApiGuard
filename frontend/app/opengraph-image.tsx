import { ImageResponse } from 'next/og';

export const alt = 'The Lucid Vivarium — an interactive full-stack portfolio by Nazar Falach';
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
          color: '#052f42',
          background: 'linear-gradient(180deg, #ffe657 0%, #ff9fbe 46%, #58e0dc 73%, #1aa4b3 100%)',
          fontFamily: 'serif',
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', inset: 0 }}>
          <path d="M0 395 C150 333 265 382 405 349 L513 630 H0 Z" fill="#ff6f91" />
          <path d="M1200 382 C1040 324 932 382 795 345 L688 630 H1200 Z" fill="#ff8aa6" />
          <path d="M465 630 L557 350 H643 L741 630 Z" fill="#24cbd1" />
          <path d="M517 630 L574 350 H626 L687 630 Z" fill="#97fff1" opacity=".72" />
          <g fill="#dcff39" opacity=".82">
            <ellipse cx="92" cy="180" rx="190" ry="82" transform="rotate(-24 92 180)" />
            <ellipse cx="255" cy="264" rx="181" ry="68" transform="rotate(18 255 264)" />
            <ellipse cx="1118" cy="166" rx="204" ry="84" transform="rotate(25 1118 166)" />
            <ellipse cx="947" cy="258" rx="176" ry="67" transform="rotate(-19 947 258)" />
          </g>
          <g fill="#2447c7">
            <path d="M532 351 A68 68 0 0 1 668 351 Z" />
            <rect x="548" y="344" width="104" height="29" />
            <circle cx="600" cy="300" r="7" fill="#fffbed" />
          </g>
          <g fill="none" stroke="#fffbed" opacity=".42">
            <path d="M0 394 H1200" />
            <path d="M465 630 L557 350 H643 L741 630" strokeWidth="2" />
            <path d="M493 540 H713 M511 484 H694 M530 429 H674 M546 382 H655" />
          </g>
          <g fill="#fffbed" opacity=".58">
            <circle cx="86" cy="386" r="6" /><circle cx="178" cy="415" r="10" /><circle cx="292" cy="376" r="7" />
            <circle cx="1104" cy="389" r="8" /><circle cx="1018" cy="421" r="5" /><circle cx="907" cy="378" r="11" />
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 34, left: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          FALACH.PL / VIVARIUM 2026
        </div>
        <div style={{ position: 'absolute', top: 34, right: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          52.2297° N / 21.0122° E
        </div>
        <div style={{ position: 'absolute', top: 104, left: 42, display: 'flex', flexDirection: 'column', fontSize: 88, lineHeight: .82, letterSpacing: -3 }}>
          <span>THE LUCID</span><span>VIVARIUM</span>
        </div>
        <div style={{ position: 'absolute', right: 42, bottom: 30, display: 'flex', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          NAZAR FALACH / FULL-STACK ENGINEER
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          A PORTFOLIO GROWING INSIDE THE DREAM
        </div>
      </div>
    ),
    size,
  );
}
