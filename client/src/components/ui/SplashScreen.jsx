import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2800);
    const doneTimer = setTimeout(() => onDone?.(), 3500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{
        backgroundColor: '#f5f0e8',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: '28px' }}>

        {/* Logo + glow ring */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="splash-glow" />

          <svg
            className="splash-logo"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            aria-hidden="true"
          >
            <g className="splash-leaf splash-leaf-left">
              <path d="M100 160 C60 140 30 100 50 60 C65 30 95 40 100 80 Z" fill="#1f5e3a" />
            </g>
            <g className="splash-leaf splash-leaf-right">
              <path d="M100 160 C140 140 170 100 150 60 C135 30 105 40 100 80 Z" fill="#1f5e3a" />
            </g>
            <g className="splash-leaf splash-leaf-center">
              <path d="M100 165 C85 130 80 90 100 50 C120 90 115 130 100 165 Z" fill="#2a7a50" />
            </g>
          </svg>
        </div>

        {/* Wordmark */}
        <div className="splash-wordmark flex flex-col items-center" style={{ gap: '4px' }}>
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '26px',
              fontWeight: 700,
              color: '#1f5e3a',
              letterSpacing: '0.04em',
            }}
          >
            ChildBloom
          </span>
          <span
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6a9a7a',
              fontWeight: 400,
            }}
          >
            Your child's growth companion
          </span>
        </div>

        {/* Dot loader */}
        <div className="splash-dots flex" style={{ gap: '8px' }}>
          <div className="splash-dot" />
          <div className="splash-dot splash-dot-2" />
          <div className="splash-dot splash-dot-3" />
        </div>

      </div>
    </div>
  );
}
