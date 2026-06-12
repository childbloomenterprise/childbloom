// gardenVitality — pure helpers that turn the week's logs into the Bloom
// Garden's "watered" state. Every log is water; vitality is derived, never
// stored. Kept free of React/Supabase so it is trivially unit-testable
// (same contract as lib/homePulse.js: `now` always injectable).

import { format } from 'date-fns';

// Collapse any mix of log rows into a Set of local 'yyyy-MM-dd' day strings.
// Rows may carry `logged_date` (already local-day) or `logged_at` (ISO).
export function gardenDaySet(...logArrays) {
  const days = new Set();
  for (const logs of logArrays) {
    for (const l of logs || []) {
      const d = l?.logged_date
        || (l?.logged_at ? format(new Date(l.logged_at), 'yyyy-MM-dd') : null);
      if (d) days.add(d);
    }
  }
  return days;
}

export const VITALITY_TIERS = ['parched', 'budding', 'growing', 'thriving'];

export function vitalityTier(daysWatered7) {
  if (daysWatered7 >= 6) return 'thriving';
  if (daysWatered7 >= 3) return 'growing';
  if (daysWatered7 >= 1) return 'budding';
  return 'parched';
}

// The garden's pulse for the last 7 days (today inclusive).
// Returns { wateredToday, daysWatered7, tier, logsToday }.
export function computeVitality({ foodLogs7d = [], sleepLogs7d = [], quickLogs7d = [], now = new Date() } = {}) {
  const days = gardenDaySet(foodLogs7d, sleepLogs7d, quickLogs7d);

  const dayStr = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return format(d, 'yyyy-MM-dd');
  };

  let daysWatered7 = 0;
  for (let i = 0; i < 7; i++) {
    if (days.has(dayStr(i))) daysWatered7 += 1;
  }

  const todayStr = dayStr(0);
  const wateredToday = days.has(todayStr);

  const countToday = (logs) => (logs || []).filter((l) => {
    const d = l?.logged_date
      || (l?.logged_at ? format(new Date(l.logged_at), 'yyyy-MM-dd') : null);
    return d === todayStr;
  }).length;
  const logsToday = countToday(foodLogs7d) + countToday(sleepLogs7d) + countToday(quickLogs7d);

  return { wateredToday, daysWatered7, tier: vitalityTier(daysWatered7), logsToday };
}

// Logging feeds two garden areas directly: Nourishment (feeds) and
// Rest & Rhythm (sleep). Every 5 logs in the last week earn one synthetic
// "moment" credit, capped at 3 (the blooming threshold) so noted moments
// always stay the richer path. Merged into momentsByArea at the call site —
// bloom_moments is never written.
export const LOGS_PER_CREDIT = 5;
export const MAX_LOG_CREDITS = 3;

export function logDerivedAreaBoost({ feedCount7d = 0, sleepCount7d = 0 } = {}) {
  const credit = (n) => Math.min(MAX_LOG_CREDITS, Math.floor(Math.max(0, n) / LOGS_PER_CREDIT));
  return {
    nourishment: credit(feedCount7d),
    rest: credit(sleepCount7d),
  };
}

// Merge synthetic log credits into the real momentsByArea map (non-mutating).
export function mergeAreaCounts(momentsByArea = {}, boost = {}) {
  const merged = { ...momentsByArea };
  for (const [area, credits] of Object.entries(boost)) {
    if (credits > 0) merged[area] = (merged[area] || 0) + credits;
  }
  return merged;
}

// One celebration per day: returns true the first time the garden is watered
// on a given local day, persisting the day in localStorage. Safe in SSR/tests.
export function markWateredCelebrated(childId, now = new Date()) {
  if (!childId || typeof localStorage === 'undefined') return false;
  try {
    const key = `cb_watered_${childId}`;
    const today = format(now, 'yyyy-MM-dd');
    if (localStorage.getItem(key) === today) return false;
    localStorage.setItem(key, today);
    return true;
  } catch {
    return false;
  }
}
