import { ImageResponse } from 'next/og';

export const alt = 'PulseGuard — API monitoring with confirmed incident alerts';
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
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '58px 64px',
          color: '#f2f0e8',
          background: '#11110f',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            opacity: 0.16,
            backgroundImage:
              'linear-gradient(rgba(242,240,232,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,232,.28) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #f2f0e8',
              background: '#b7ff3c',
              color: '#11110f',
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>
            PULSEGUARD<span style={{ color: '#3155ff' }}>/</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', maxWidth: 980, fontSize: 84, fontWeight: 900, lineHeight: 0.93, letterSpacing: -5 }}>
            Know first. Fix faster.
          </div>
          <div style={{ display: 'flex', maxWidth: 830, color: '#b7ff3c', fontSize: 27, lineHeight: 1.35 }}>
            Uptime, latency, confirmed incident transitions, and Telegram alerts for the endpoints you own.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, letterSpacing: 2 }}>
          <span>FALACH.PL/PAG</span>
          <span>MONITOR · CONFIRM · RECOVER</span>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 22,
            height: '100%',
            display: 'flex',
            background: '#ff6b35',
          }}
        />
      </div>
    ),
    size,
  );
}
