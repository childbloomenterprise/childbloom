import { useEffect, useRef } from 'react';

// Keeps the screen awake while `active` is true (e.g. during a CPR flow where
// the parent's hands are busy and the screen must not dim). Uses the Screen
// Wake Lock API; silently no-ops where unsupported (older browsers, some TWAs).
// The OS auto-releases the lock when the tab is hidden, so we re-acquire it on
// `visibilitychange` when the user returns.
export default function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;

    let cancelled = false;

    const request = async () => {
      if (cancelled || lockRef.current) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { try { await lock.release(); } catch { /* noop */ } return; }
        lockRef.current = lock;
        // The OS may drop the lock (tab hidden / power saver); clear our ref so
        // visibilitychange can re-acquire it.
        lock.addEventListener?.('release', () => { lockRef.current = null; });
      } catch {
        // Denied / battery saver / unsupported — degrade gracefully.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      try { lockRef.current?.release?.(); } catch { /* noop */ }
      lockRef.current = null;
    };
  }, [active]);
}
