import { useState, useEffect, useRef } from 'react';
import { T, FONTS, RADIUS } from '../components/cb/tokens';
import CBIcon from '../components/cb/CBIcon';
import CBLogoMark from '../components/cb/CBLogoMark';
import {
  isDismissed, dismiss, isStandalone, isIOS,
  setDeferredPrompt, getDeferredPrompt,
} from '../hooks/useInstallPrompt';

const SHOW_DELAY_MS = 8_000; // 8 seconds after page load

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const ios = isIOS();

    const maybeShow = () => {
      if (isStandalone() || isDismissed()) return;
      if (ios) {
        setIosMode(true);
        setVisible(true);
      } else if (getDeferredPrompt()) {
        setVisible(true);
      }
    };

    // Android/Chrome: capture the browser install event
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If timer already fired but prompt wasn't ready yet, show now
      if (!isStandalone() && !isDismissed()) setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Show after delay
    timerRef.current = setTimeout(maybeShow, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      clearTimeout(timerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    dismiss();
  };

  const handleInstall = async () => {
    const p = getDeferredPrompt();
    if (!p) return;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={handleDismiss}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(11,23,20,0.35)',
          backdropFilter: 'blur(2px)',
          animation: 'fade-in 0.2s ease both',
        }}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install ChildBloom"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
          background: T.surface,
          borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
          padding: '12px 20px 36px',
          boxShadow: '0 -8px 40px rgba(11,23,20,0.18)',
          maxWidth: 480, margin: '0 auto',
          fontFamily: FONTS.sans,
          animation: 'install-slide-up 0.34s cubic-bezier(0.32, 0.72, 0, 1) both',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: T.ink200, margin: '0 auto 20px',
        }} />

        {/* App identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: T.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(29,158,117,0.35)', flexShrink: 0,
          }}>
            <CBLogoMark size={28} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 20, color: T.ink900, fontStyle: 'italic', fontWeight: 500 }}>
              Install ChildBloom
            </div>
            <div style={{ fontSize: 13, color: T.ink400, marginTop: 2 }}>
              Add to your home screen
            </div>
          </div>
        </div>

        {/* Benefit pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { icon: 'wifi-off', label: 'Works offline' },
            { icon: 'zap',      label: 'Faster' },
            { icon: 'smartphone', label: 'Feels native' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 999,
                background: T.brandTint,
                fontSize: 12, fontWeight: 500, color: T.brand,
              }}
            >
              <CBIcon name={icon} size={12} stroke={2} />
              {label}
            </div>
          ))}
        </div>

        {iosMode ? (
          // iOS — Safari Share instructions
          <div style={{
            background: T.bg, borderRadius: RADIUS.md,
            padding: '14px 16px', marginBottom: 16,
            border: `1px solid ${T.line}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink900, marginBottom: 8 }}>
              To install on iPhone / iPad:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { n: '1', text: 'Tap the ', bold: 'Share', tail: ' button (↑) in Safari' },
                { n: '2', text: 'Scroll and tap ', bold: '"Add to Home Screen"', tail: '' },
                { n: '3', text: 'Tap ', bold: 'Add', tail: ' in the top right' },
              ].map(({ n, text, bold, tail }) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 999, background: T.brand,
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{n}</div>
                  <div style={{ fontSize: 13, color: T.ink700, lineHeight: 1.4 }}>
                    {text}<strong style={{ color: T.ink900 }}>{bold}</strong>{tail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            style={{
              width: '100%', padding: '14px', borderRadius: RADIUS.md, border: 'none',
              background: T.brand, color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: FONTS.sans, marginBottom: 10,
              boxShadow: '0 4px 16px rgba(29,158,117,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <CBIcon name="download" size={18} stroke={2} />
            Add to Home Screen
          </button>
        )}

        <button
          onClick={handleDismiss}
          style={{
            width: '100%', padding: '10px', background: 'transparent', border: 'none',
            fontSize: 14, color: T.ink400, cursor: 'pointer', fontFamily: FONTS.sans,
          }}
        >
          Not now
        </button>
      </div>

      <style>{`
        @keyframes install-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
