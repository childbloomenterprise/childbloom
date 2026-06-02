// Shared install-prompt state across the app.
// InstallPrompt.jsx captures the browser event; Settings can read + trigger it.

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'childbloom_install_dismissed_until';
const DISMISS_DAYS  = 7; // re-show after 7 days

export function isDismissed() {
  const until = localStorage.getItem(DISMISSED_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

export function dismiss() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISSED_KEY, String(until));
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

// Stores the deferred prompt globally so any component can trigger it.
let _deferredPrompt = null;

export function getDeferredPrompt() { return _deferredPrompt; }
export function setDeferredPrompt(p) { _deferredPrompt = p; }

// Hook: returns { canInstall, isIOS, triggerInstall }
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!_deferredPrompt);
  const ios = isIOS();

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const triggerInstall = async () => {
    const p = getDeferredPrompt();
    if (!p) return false;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { canInstall: canInstall || ios, isIOS: ios, triggerInstall };
}
