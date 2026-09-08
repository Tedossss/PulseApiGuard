import { ImageResponse } from 'next/og';

export const alt = 'The Remembered Street — six projects in a Dreamcore neighborhood by Nazar Falach';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const house = (
  x: number,
  y: number,
  scale: number,
  wall: string,
  roof: string,
) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-66 8 L0 -45 L66 8 V92 H-66 Z" fill={wall} stroke="#f9f3df" strokeWidth="6" />
    <path d="M-78 8 L0 -56 L78 8 L67 20 L0 -34 L-68 20 Z" fill={roof} />
    <rect x="-48" y="22" width="31" height="42" fill="#b8d9e8" stroke="#183854" strokeWidth="3" />
    <path d="M-32.5 22 V64 M-48 43 H-17" stroke="#f9f3df" strokeWidth="3" />
    <rect x="18" y="18" width="30" height="74" fill="#f4ead0" stroke="#183854" strokeWidth="3" />
    <circle cx="39" cy="56" r="3" fill="#183854" />
    <rect x="-60" y="72" width="70" height="23" fill="#f9f3df" stroke="#183854" strokeWidth="2" />
  </g>
);

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
          color: '#163750',
          background: '#75bde9',
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', inset: 0 }}>
          <rect width="1200" height="630" fill="#75bde9" />
          <circle cx="1060" cy="88" r="46" fill="#f8e98b" opacity=".94" />

          <g fill="#fffdf0" opacity=".92">
            <ellipse cx="340" cy="128" rx="70" ry="23" />
            <ellipse cx="298" cy="137" rx="43" ry="18" />
            <ellipse cx="812" cy="104" rx="55" ry="19" />
            <ellipse cx="850" cy="112" rx="37" ry="14" />
          </g>

          <path d="M0 345 C170 286 292 330 420 315 C594 295 683 245 852 301 C1008 351 1099 285 1200 304 V630 H0 Z" fill="#8fcf67" />
          <path d="M0 416 C187 363 310 402 473 375 C658 344 770 371 910 346 C1057 320 1119 353 1200 345 V630 H0 Z" fill="#6bae54" />
          <path d="M702 630 C663 551 659 484 714 423 C765 366 773 328 744 300" fill="none" stroke="#f5ecd4" strokeWidth="72" strokeLinecap="round" />
          <path d="M702 630 C663 551 659 484 714 423 C765 366 773 328 744 300" fill="none" stroke="#d8ccb4" strokeWidth="3" strokeLinecap="round" />

          <g opacity=".72" fill="#557a47">
            <circle cx="87" cy="346" r="10" /><circle cx="111" cy="352" r="16" /><circle cx="995" cy="323" r="14" />
            <circle cx="1021" cy="328" r="9" /><circle cx="527" cy="338" r="12" /><circle cx="554" cy="340" r="7" />
          </g>

          <g transform="translate(760 243) scale(.6)" stroke="#f7efd9" strokeWidth="7" fill="none">
            <path d="M-18 100 L-5 0 H25 L38 100 M-25 36 H45 M-30 69 H50" />
            <ellipse cx="10" cy="-10" rx="35" ry="14" fill="#f3e9d1" />
          </g>

          {house(1015, 338, 1.38, '#efb7aa', '#4d5262')}
          {house(851, 330, 0.82, '#e9c8c1', '#53586a')}
          {house(595, 324, 0.66, '#eee6d6', '#7a5963')}
          {house(458, 317, 0.55, '#d59c8d', '#5e6670')}
          {house(331, 309, 0.46, '#e5c98f', '#555f69')}
          {house(219, 303, 0.38, '#a9c2c8', '#535c70')}

          <g transform="translate(62 300)">
            <rect x="0" y="0" width="337" height="190" rx="3" fill="#f5efdc" stroke="#d0c5ad" strokeWidth="5" />
            <rect x="18" y="20" width="301" height="150" fill="none" stroke="#c3b79e" strokeWidth="2" />
            <path d="M18 190 V270 M319 190 V270" stroke="#ebe2ca" strokeWidth="18" />
          </g>

          <path d="M78 523 H1122" stroke="#f6eedb" strokeWidth="2" opacity=".8" />
          <circle cx="78" cy="523" r="7" fill="#163750" />
          <circle cx="1122" cy="523" r="7" fill="#f6eedb" stroke="#163750" strokeWidth="2" />
        </svg>

        <div
          style={{
            position: 'absolute',
            left: 100,
            top: 330,
            width: 265,
            height: 128,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', fontSize: 43, fontWeight: 700, letterSpacing: '-1.2px' }}>
            Nazar Falach
          </div>
          <div style={{ display: 'flex', marginTop: 8, fontSize: 23, fontWeight: 500 }}>
            Full-stack engineer · Poland
          </div>
          <div style={{ display: 'flex', marginTop: 7, fontSize: 22, fontWeight: 500 }}>
            Six places. One remembered street.
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 34,
            right: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 23,
            fontWeight: 600,
            borderBottom: '2px solid #163750',
            paddingBottom: 5,
          }}
        >
          falach.pl
        </div>
        <div
          style={{
            position: 'absolute',
            left: 62,
            bottom: 32,
            display: 'flex',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '.4px',
          }}
        >
          SIX REAL PROJECTS / ONE STRANGE, FAMILIAR STREET
        </div>
      </div>
    ),
    size,
  );
}
