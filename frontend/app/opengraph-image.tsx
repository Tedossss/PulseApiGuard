import { ImageResponse } from 'next/og';

export const alt = 'The Sleep Observatory — an interactive portfolio by Nazar Falach';
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
          color: '#e8e2d7',
          background: 'linear-gradient(#667b84 0 51%, #141b21 51% 100%)',
          fontFamily: 'serif',
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', inset: 0 }}>
          <g fill="none" stroke="#e8e2d7" opacity=".34">
            <path d="M0 322 H1200" />
            <path d="M424 630 L548 322 H652 L782 630" />
            <path d="M460 630 L566 322 M742 630 L634 322" opacity=".28" />
            <path d="M502 322 A98 98 0 0 1 698 322" strokeWidth="2" />
            <path d="M525 322 A75 75 0 0 1 675 322" opacity=".5" />
          </g>
          <g stroke="#9dafb5" opacity=".22">
            <path d="M0 375 H1200 M0 434 H1200 M0 504 H1200 M0 584 H1200" />
            <path d="M78 344 L225 630 M1122 344 L975 630 M222 344 L314 630 M978 344 L886 630" />
          </g>
          <circle cx="925" cy="188" r="58" fill="#c69a61" opacity=".72" />
          <circle cx="925" cy="188" r="76" fill="none" stroke="#e8e2d7" opacity=".18" />
          <g fill="#8d504c">
            <circle cx="558" cy="359" r="5" /><circle cx="642" cy="359" r="5" />
          </g>
        </svg>
        <div style={{ position: 'absolute', top: 34, left: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          FALACH.PL / SIGNAL 2026
        </div>
        <div style={{ position: 'absolute', top: 34, right: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
          52.2297° N / 21.0122° E
        </div>
        <div style={{ position: 'absolute', top: 106, left: 42, display: 'flex', flexDirection: 'column', fontSize: 86, lineHeight: .82, letterSpacing: -5 }}>
          <span>THE SLEEP</span><span>OBSERVATORY</span>
        </div>
        <div style={{ position: 'absolute', right: 42, bottom: 30, display: 'flex', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          NAZAR FALACH / FULL-STACK ENGINEER
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: 42, display: 'flex', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>
          AN OPEN SIGNAL WAS FOUND
        </div>
      </div>
    ),
    size,
  );
}
