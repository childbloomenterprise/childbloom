import { useEffect, useRef } from 'react';

// Clamp to the AHA-recommended CPR range so a bad data value can never produce
// a dangerous pace.
export function clampBpm(bpm) {
  return Math.min(120, Math.max(100, Number(bpm) || 110));
}

// Audible + haptic CPR metronome. On every beat it plays a short Web Audio
// click and fires a navigator.vibrate pulse. The phone buzz is the channel that
// survives a noisy room / muted volume, so haptics keep firing even when
// `muted` silences the click. Fully offline — the oscillator is local, no
// network. Must be started from a user gesture (guided mode starts on a tap) so
// the browser permits audio playback.
export default function useMetronome({ bpm = 110, running = false, muted = false }) {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    const intervalMs = 60000 / clampBpm(bpm);

    const ensureCtx = () => {
      if (ctxRef.current) return ctxRef.current;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      try { ctxRef.current = new AC(); } catch { ctxRef.current = null; }
      return ctxRef.current;
    };

    const beat = () => {
      // Haptic — always, even when muted (silent, hands-free cue).
      try { navigator.vibrate?.(18); } catch { /* noop */ }
      if (muted) return;

      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume?.();

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1100;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.28, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.07);
      } catch { /* noop */ }
    };

    beat(); // immediate downbeat
    intervalRef.current = setInterval(beat, intervalMs);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [bpm, running, muted]);

  // Tear down the audio context when the component unmounts.
  useEffect(() => () => {
    try { ctxRef.current?.close?.(); } catch { /* noop */ }
    ctxRef.current = null;
  }, []);
}
