import { useState, useRef, useEffect, useCallback } from 'react';

// Formats a remaining-seconds value for display.
//   < 60  → "9"        (bare seconds, for the short emergency holds)
//   ≥ 60  → "4:59"     (m:ss, for the 2-min / 5-min waits)
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// Pure: seconds left given a start timestamp, total duration, evaluated at `now`.
// Exported for deterministic unit testing.
export function secondsRemaining(startMs, totalSeconds, nowMs = Date.now()) {
  return Math.max(0, totalSeconds - (nowMs - startMs) / 1000);
}

// Drives a single step's countdown. Starts when `running` becomes true (or on
// mount), ticks ~10×/sec for a smooth ring, and fires `onComplete` exactly once
// when it reaches zero. `reset()` restarts it. Time math uses Date.now() so it
// stays accurate across React re-renders and is testable with fake timers.
export default function useCountdown(totalSeconds, { running = true, onComplete } = {}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const startRef = useRef(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reset = useCallback(() => {
    startRef.current = Date.now();
    doneRef.current = false;
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running || !totalSeconds) return undefined;

    startRef.current = Date.now();
    doneRef.current = false;
    setRemaining(totalSeconds);

    const id = setInterval(() => {
      const left = secondsRemaining(startRef.current, totalSeconds);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onCompleteRef.current?.();
        }
      }
    }, 100);

    return () => clearInterval(id);
  }, [running, totalSeconds]);

  return { remaining, reset };
}
