// Auto-dim hook — applies a "night-dim" CSS attribute on <html> between 21:00
// and 06:00 local time. Pure data attribute; CSS in index.css handles the rest.
//
// Why not auto-dark-mode? Because we already have a manual theme picker.
// This is a quieter dim layer that softens whites, mutes the brand color,
// and lowers animation intensity — applied ON TOP of whatever theme is
// currently active. Toggleable manually via localStorage `cb_night_dim` =
// 'off' to opt out.

import { useEffect, useState } from 'react';

function isNightTime(date = new Date()) {
  const h = date.getHours();
  return h >= 21 || h < 6;
}

export function useNightDim() {
  const [active, setActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (localStorage.getItem('cb_night_dim') === 'off') return false;
    return isNightTime();
  });

  useEffect(() => {
    const update = () => {
      if (localStorage.getItem('cb_night_dim') === 'off') {
        setActive(false);
        return;
      }
      setActive(isNightTime());
    };

    update();
    // Check on tab focus + every 5 min
    const interval = setInterval(update, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-night-dim', active ? 'on' : 'off');
  }, [active]);

  return active;
}
