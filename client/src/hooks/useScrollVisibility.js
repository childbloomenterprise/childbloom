// useScrollVisibility — tracks scroll direction and velocity to drive
// the fluid dock hide/show behaviour.
//
// Returns:
//   visible:  boolean — true when the dock should be visible
//   atTop:    boolean — true when scrollY < topThreshold (dock always shows)
//
// Behaviour:
//   • Always visible when within `topThreshold` px of the top.
//   • Hides when scrolling DOWN faster than `velocityThreshold` px/ms.
//   • Shows when scrolling UP by any amount.
//   • Auto-shows after `idleMs` ms of no scroll (user stopped).
//   • The actual CSS animation (spring vs ease-in) lives in the component.

import { useState, useEffect, useRef } from 'react';

const DEFAULT_TOP_THRESHOLD   = 60;   // px
const DEFAULT_VELOCITY_THRESHOLD = 0.04; // px/ms — below this, ignore small jitter
const DEFAULT_IDLE_MS         = 1400; // ms idle → re-show

export function useScrollVisibility({
  topThreshold   = DEFAULT_TOP_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  idleMs         = DEFAULT_IDLE_MS,
} = {}) {
  const [visible, setVisible] = useState(true);
  const [atTop,   setAtTop]   = useState(true);

  const prevY     = useRef(0);
  const prevTime  = useRef(Date.now());
  const raf       = useRef(null);
  const idle      = useRef(null);
  const pendingY  = useRef(null);

  useEffect(() => {
    function processScroll() {
      const y   = pendingY.current ?? window.scrollY;
      const now = Date.now();
      const dy  = y - prevY.current;
      const dt  = now - prevTime.current;
      const vel = dt > 0 ? dy / dt : 0; // px/ms, positive = scrolling down

      prevY.current    = y;
      prevTime.current = now;

      const top = y < topThreshold;
      setAtTop(top);

      if (top) {
        setVisible(true);
      } else if (vel > velocityThreshold) {
        // Scrolling down — hide
        setVisible(false);
      } else if (vel < -velocityThreshold) {
        // Scrolling up — show
        setVisible(true);
      }

      // Reset idle timer — if user stops scrolling, re-show
      clearTimeout(idle.current);
      idle.current = setTimeout(() => setVisible(true), idleMs);

      raf.current = null;
    }

    function onScroll() {
      pendingY.current = window.scrollY;
      if (!raf.current) {
        raf.current = requestAnimationFrame(processScroll);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
      clearTimeout(idle.current);
    };
  }, [topThreshold, velocityThreshold, idleMs]);

  return { visible, atTop };
}
