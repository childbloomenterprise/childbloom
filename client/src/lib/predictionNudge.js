// predictionNudge — pure logic for the "Was there a feed around 3:05 pm?"
// card. The app proposes the log; the parent confirms with one tap.
//
// A nudge only appears when ALL of these hold (false positives erode trust):
//   1. predictNextFeed() has a confident rhythm (≥4 feeds this week)
//   2. the predicted time is ≥ NUDGE_DELAY_MIN minutes in the past
//   3. no feed was actually logged within ±NUDGE_WINDOW_MIN of the prediction
//   4. the parent hasn't dismissed today's nudge
//
// Pure: no React, no Supabase, `now` injectable.

import { format } from 'date-fns';
import { predictNextFeed } from './homePulse';

export const NUDGE_DELAY_MIN = 30;   // wait this long past the prediction
export const NUDGE_WINDOW_MIN = 45;  // a feed within ± this counts as "covered"
export const NUDGE_HORIZON_MIN = 180; // predictions older than this are stale

// → null | { predictedAt: Date, gapMin: number }
export function computeFeedNudge({ foodLogs7d = [], now = new Date(), dismissedDay = null } = {}) {
  // 4. dismissed today?
  if (dismissedDay && dismissedDay === format(now, 'yyyy-MM-dd')) return null;

  // 1. confident rhythm? predictNextFeed needs ≥4 feeds + ≥3 sane gaps, but
  // its horizon check rejects predictions >1 gap overdue — for the nudge we
  // recompute the raw prediction from the last feed + median gap ourselves so
  // a 40-minute-old prediction still nudges.
  const times = (foodLogs7d || [])
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
  const predictedAt = new Date(lastFeed.getTime() + medianGap * 60000);

  // 2. enough time passed, but not stale
  const minsPast = (now - predictedAt) / 60000;
  if (minsPast < NUDGE_DELAY_MIN || minsPast > NUDGE_HORIZON_MIN) return null;

  // 3. already covered? (any feed within ± window of the prediction —
  // including feeds logged after it)
  const covered = times.some((t) => Math.abs(t - predictedAt) / 60000 <= NUDGE_WINDOW_MIN && t !== lastFeed);
  if (covered) return null;
  // The anchor feed itself can cover the prediction when the gap is tiny.
  if (Math.abs(lastFeed - predictedAt) / 60000 <= NUDGE_WINDOW_MIN) return null;

  return { predictedAt, gapMin: Math.round(medianGap) };
}

// localStorage helpers for the per-day dismiss (safe in SSR/tests).
const DISMISS_KEY = (childId) => `cb_nudge_dismissed_${childId}`;

export function readNudgeDismissedDay(childId) {
  if (!childId || typeof localStorage === 'undefined') return null;
  try { return localStorage.getItem(DISMISS_KEY(childId)); } catch { return null; }
}

export function dismissNudgeForToday(childId, now = new Date()) {
  if (!childId || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(DISMISS_KEY(childId), format(now, 'yyyy-MM-dd')); } catch { /* noop */ }
}
