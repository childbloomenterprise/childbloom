import { useState, useEffect, useRef } from 'react';
import { LogoMark } from './ui/LogoMark';

const DISMISSED_KEY = 'childbloom_install_dismissed';
const ENGAGE_DELAY_MS = 45_000; // 45 seconds

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const pageCount = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Never show if already installed or dismissed
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ios = isIOS();

    // Track page visits to measure engagement
    pageCount.current += 1;

    // Android / Chrome: listen for browser install prompt
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (pageCount.current >= 2) {
        timerRef.current = setTimeout(() => setVisible(true), ENGAGE_DELAY_MS);
      }
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // iOS: show custom instructions after engagement
    if (ios && pageCount.current >= 2) {
      timerRef.current = setTimeout(() => setShowIOS(true), ENGAGE_DELAY_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOS(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible && !showIOS) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6 pb-10 shadow-2xl animate-slide-up"
        style={{ background: '#F7F4EF', maxWidth: '480px', margin: '0 auto' }}
        role="dialog"
        aria-modal="true"
        aria-label="Install ChildBloom"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-5" />

        <div className="flex items-center gap-4 mb-4">
          <LogoMark size={48} className="rounded-xl flex-shrink-0" />
          <div>
            <h2 className="text-lg font-serif font-bold" style={{ color: '#2A1C15' }}>
              Install ChildBloom
            </h2>
            <p className="text-sm" style={{ color: 'rgba(61,43,35,0.60)' }}>
              Get the full app experience
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['Works offline', 'Faster', 'No browser bar'].map((f) => (
            <span
              key={f}
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{ borderColor: 'rgba(29,158,117,0.30)', color: '#1D9E75', background: 'rgba(29,158,117,0.07)' }}
            >
              {f}
            </span>
          ))}
        </div>

        {showIOS ? (
          // iOS instructions
          <div className="mb-5 p-4 rounded-xl bg-white border" style={{ borderColor: 'rgba(29,158,117,0.20)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#2A1C15' }}>To install on iOS:</p>
            <ol className="text-sm space-y-1" style={{ color: 'rgba(61,43,35,0.70)' }}>
              <li>1. Tap the <strong>Share</strong> button (↑) in Safari</li>
              <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>3. Tap <strong>Add</strong></li>
            </ol>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3.5 rounded-xl font-semibold text-white mb-3 active:scale-95 transition-transform"
            style={{ background: '#1D9E75' }}
          >
            Install App
          </button>
        )}

        <button
          onClick={dismiss}
          className="w-full py-2 text-sm font-medium"
          style={{ color: 'rgba(61,43,35,0.50)' }}
        >
          Not now
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
}
