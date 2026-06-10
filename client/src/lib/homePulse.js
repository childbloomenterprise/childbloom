// homePulse — pure helpers behind the Home screen's "living tiles".
// Kept free of React/Supabase so they are trivially unit-testable.

import { differenceInCalendarDays, format } from 'date-fns';

// Compact relative time for tile subtitles: "just now", "35m ago", "2h ago", "3d ago".
export function timeAgoShort(dateLike, now = new Date()) {
  if (!dateLike) return null;
  const then = new Date(dateLike);
  if (Number.isNaN(then.getTime())) return null;
  const mins = Math.floor((now - then) / 60000);
  if (mins < 0) return null;
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Consecutive-day logging streak, anchored on today (or yesterday, so the
// streak doesn't read as broken before the parent has logged anything today).
// `daySet` is an iterable of 'yyyy-MM-dd' strings — any day with ≥1 log.
export function computeLogStreak(daySet, now = new Date()) {
  const days = daySet instanceof Set ? daySet : new Set(daySet || []);
  if (days.size === 0) return 0;

  const dayStr = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return format(d, 'yyyy-MM-dd');
  };

  // Anchor: today if logged today, else yesterday; otherwise streak is over.
  let offset;
  if (days.has(dayStr(0))) offset = 0;
  else if (days.has(dayStr(1))) offset = 1;
  else return 0;

  let streak = 0;
  while (days.has(dayStr(offset + streak))) streak += 1;
  return streak;
}

// Collapse food + sleep logs into the day-string set computeLogStreak wants.
export function logDaySet(foodLogs = [], sleepLogs = []) {
  const days = new Set();
  for (const f of foodLogs) {
    const d = f?.logged_date || (f?.logged_at ? String(f.logged_at).slice(0, 10) : null);
    if (d) days.add(d);
  }
  for (const s of sleepLogs) {
    if (s?.logged_date) days.add(s.logged_date);
  }
  return days;
}

// Days until a date (vaccine due, follow-up). Negative = overdue.
export function daysUntil(dateLike, now = new Date()) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return differenceInCalendarDays(d, now);
}

// Read SleepQuickSheet's persisted nap timer. Returns elapsed whole minutes,
// or null when idle/stale (>16h timers are treated as forgotten, not a nap).
export function readNapTimer(childId, now = new Date()) {
  if (!childId || typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`cb_sleep_timer_${childId}`);
    if (!stored) return null;
    const { startedAt } = JSON.parse(stored);
    const start = new Date(startedAt);
    if (Number.isNaN(start.getTime())) return null;
    const mins = Math.floor((now - start) / 60000);
    if (mins < 0 || mins > 16 * 60) return null;
    return mins;
  } catch {
    return null;
  }
}

// Predict the next feed from this week's actual rhythm.
// Uses the median gap between recent feeds (15 min – 12 h window, same bounds
// as the server-side pattern detector). Needs ≥3 usable gaps to say anything.
// Returns { at: Date, gapMin: number } or null.
export function predictNextFeed(foodLogs7d = [], now = new Date()) {
  const times = foodLogs7d
    .map((f) => new Date(f?.logged_at))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a)
    .slice(0, 30);
  if (times.length < 4) return null;

  const gaps = [];
  for (let i = 0; i < times.length - 1; i++) {
    const gap = (times[i] - times[i + 1]) / 60000;
    if (gap > 15 && gap < 720) gaps.push(gap);
  }
  if (gaps.length < 3) return null;

  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const medianGap = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;

  const lastFeed = times[0];
  const at = new Date(lastFeed.getTime() + medianGap * 60000);
  // Only predict within a sane horizon: stale data (>1 gap overdue) says nothing.
  if (now - at > medianGap * 60000) return null;
  return { at, gapMin: Math.round(medianGap) };
}

// Deterministic per-day greeting variant — same all day, fresh tomorrow.
const GREETINGS = {
  morning: ['Good morning', 'Rise and shine', 'Morning'],
  afternoon: ['Good afternoon', 'Hello again', 'Lovely afternoon'],
  evening: ['Good evening', 'Winding down', 'Evening'],
  night: ['Quiet night', 'Late night cuddles', 'Still up'],
};

export function getWarmGreeting(now = new Date()) {
  const h = now.getHours();
  const slot = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  const variants = GREETINGS[slot];
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return variants[dayOfYear % variants.length];
}
