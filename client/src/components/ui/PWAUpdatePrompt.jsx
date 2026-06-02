// PWA update prompt — appears when a new service worker has installed
// and is waiting to take over. Gives the user one tap to refresh.
//
// Without this, users keep loading the old cached bundle for days even
// though we ship new code every deploy. This was the root cause of the
// "I don't see the changes" issue earlier.

import { useEffect, useState } from 'react';

export default function PWAUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let mounted = true;

    // When the active SW changes (new version takes over), reload once.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || !mounted) return;

      // Already waiting (downloaded but not activated)
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShow(true);
      }

      // New SW installing
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed but old one still in control — prompt user
            if (!mounted) return;
            setWaitingWorker(newSW);
            setShow(true);
          }
        });
      });
    });

    return () => { mounted = false; };
  }, []);

  if (!show) return null;

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => setShow(false);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
        left: 16, right: 16,
        zIndex: 250,
        display: 'flex', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: '#1D3D2E',
        color: '#fff',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        maxWidth: 420, width: '100%',
        pointerEvents: 'auto',
        fontFamily: '-apple-system, system-ui, sans-serif',
        animation: 'fade-in-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 999, background: '#7DD3A4',
          flexShrink: 0, animation: 'pulse-live 2s ease-in-out infinite',
        }} aria-hidden="true" />
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
          <strong style={{ fontWeight: 600 }}>Update ready.</strong>{' '}
          <span style={{ opacity: 0.78 }}>Refresh for the latest version.</span>
        </div>
        <button
          onClick={handleUpdate}
          aria-label="Apply update and reload"
          style={{
            padding: '8px 14px', borderRadius: 999,
            background: '#1D9E75', color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.005em',
          }}
        >
          Refresh
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss update prompt"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', padding: 4, fontSize: 18, lineHeight: 1,
          }}
        >×</button>
      </div>
    </div>
  );
}
