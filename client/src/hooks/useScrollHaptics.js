import { useEffect, useRef } from 'react';
import { tapLight, selection } from '../lib/haptics';

// Scroll-driven haptic feedback. Native Android only via Capacitor — silent on web.
// Apple-style: subtle, purposeful, never buzzy.
//   - Tick once every TICK_PX of scroll distance while moving (continuous ambient feedback)
//   - Soft tap on overscroll-top (pull-to-refresh feel)
//   - Soft tap when the user hits the bottom of the page
//   - Selection-change tap when a top-level <section> snaps past the viewport center

const TICK_PX           = 480;   // distance between ambient ticks (~one tick per scroll gesture)
const OVERSCROLL_PX     = 32;    // distance above page top before pull-to-refresh tap fires
const BOTTOM_PAD_PX     = 8;     // distance from real bottom that counts as "end"
const SECTION_SELECTOR  = 'section, [data-haptic-section]';
const SCROLL_END_QUIET  = 140;   // ms of no-scroll that counts as the end of a gesture

export function useScrollHaptics({ enabled = true } = {}) {
  const state = useRef({
    lastY: 0,
    distanceSinceTick: 0,
    firedOverscroll: false,
    firedBottom: false,
    lastSectionIndex: -1,
    quietTimer: null,
  });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const s = state.current;
    s.lastY = window.scrollY || 0;

    const sections = () => Array.from(document.querySelectorAll(SECTION_SELECTOR));

    const onScroll = () => {
      const y         = window.scrollY || 0;
      const dy        = y - s.lastY;
      const viewport  = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Continuous ambient ticks — one per TICK_PX scrolled (cumulative absolute distance)
      s.distanceSinceTick += Math.abs(dy);
      if (s.distanceSinceTick >= TICK_PX) {
        s.distanceSinceTick = 0;
        tapLight();
      }

      // Pull-to-refresh feel — fires once per overscroll gesture above the page top
      if (y < -OVERSCROLL_PX && !s.firedOverscroll) {
        s.firedOverscroll = true;
        tapLight();
      } else if (y >= 0) {
        s.firedOverscroll = false;
      }

      // End-of-list tap — fires once per arrival at the bottom
      const atBottom = y + viewport >= fullHeight - BOTTOM_PAD_PX;
      if (atBottom && !s.firedBottom) {
        s.firedBottom = true;
        tapLight();
      } else if (!atBottom) {
        s.firedBottom = false;
      }

      // Section-snap selection tap — when the section under the viewport center changes
      const centerY = y + viewport / 2;
      const all = sections();
      if (all.length > 0) {
        let idx = -1;
        for (let i = 0; i < all.length; i++) {
          const r = all[i].getBoundingClientRect();
          const top = r.top + y;
          const bottom = top + r.height;
          if (centerY >= top && centerY < bottom) { idx = i; break; }
        }
        if (idx !== -1 && idx !== s.lastSectionIndex) {
          // skip the very first match so we don't fire on initial mount
          if (s.lastSectionIndex !== -1) selection();
          s.lastSectionIndex = idx;
        }
      }

      s.lastY = y;

      // Reset the distance counter on gesture end so the next gesture starts fresh
      if (s.quietTimer) clearTimeout(s.quietTimer);
      s.quietTimer = setTimeout(() => { s.distanceSinceTick = 0; }, SCROLL_END_QUIET);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (s.quietTimer) clearTimeout(s.quietTimer);
    };
  }, [enabled]);
}

export default useScrollHaptics;
