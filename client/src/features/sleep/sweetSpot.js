// Sleep SweetSpot — predict the ideal next nap/bedtime window.
//
// Pure, instant, offline-capable. No ML: a reliable age-based wake-window model
// (reuses wakeWindowMinutes from lib/feedLearning.js — single source of truth).
//
// "Last wake" is the LATEST of:
//   • the newest wake_events.woke_at (the "she just woke up" one-tap), and
//   • the newest sleep_logs.sleep_end (when the app actually recorded an end).
// Next ideal sleep = lastWake + age-appropriate wake window (a ±15-min band).

import { wakeWindowMinutes } from '../../lib/feedLearning';

/** Parse a timestamp-ish value to ms, or null. */
function toMs(v) {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Most recent wake time across both signals.
 * @param {Array<{woke_at:string}>} wakeEvents
 * @param {Array<{sleep_end?:string}>} sleepLogs
 * @returns {number|null} epoch ms of the latest wake, or null if unknown
 */
export function lastWakeMs(wakeEvents = [], sleepLogs = []) {
  const candidates = [];
  for (const w of wakeEvents) {
    const ms = toMs(w?.woke_at);
    if (ms != null) candidates.push(ms);
  }
  for (const s of sleepLogs) {
    const ms = toMs(s?.sleep_end);
    if (ms != null) candidates.push(ms);
  }
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

/**
 * Compute the next ideal sleep window.
 *
 * @param {object} args
 * @param {number|null} args.ageInDays
 * @param {Array} args.wakeEvents - rows with woke_at (desc not required)
 * @param {Array} args.sleepLogs  - rows with sleep_end (may be null)
 * @param {Date}  [args.now]      - injectable clock for tests
 * @returns {{
 *   hasWake: boolean,
 *   lastWake: Date|null,
 *   windowMinutes: number|null,
 *   start: Date|null,   // lastWake + (window - 15m)
 *   end: Date|null,     // lastWake + (window + 15m)
 *   minutesUntilStart: number|null, // negative if the window is already open/past
 *   status: 'no-wake'|'unknown-age'|'building'|'approaching'|'now'|'overdue'
 * }}
 */
export function computeSweetSpot({ ageInDays, wakeEvents = [], sleepLogs = [], now = new Date() }) {
  const windowMinutes = wakeWindowMinutes(ageInDays);
  const wakeMs = lastWakeMs(wakeEvents, sleepLogs);
  const nowMs = now.getTime();

  if (wakeMs == null) {
    return { hasWake: false, lastWake: null, windowMinutes, start: null, end: null, minutesUntilStart: null, status: 'no-wake' };
  }
  if (windowMinutes == null) {
    return { hasWake: true, lastWake: new Date(wakeMs), windowMinutes: null, start: null, end: null, minutesUntilStart: null, status: 'unknown-age' };
  }

  const BAND = 15; // ± minutes around the ideal point
  const startMs = wakeMs + (windowMinutes - BAND) * 60000;
  const endMs = wakeMs + (windowMinutes + BAND) * 60000;
  const minutesUntilStart = Math.round((startMs - nowMs) / 60000);

  let status;
  if (nowMs > endMs) status = 'overdue';
  else if (nowMs >= startMs) status = 'now';
  else if (minutesUntilStart <= 30) status = 'approaching';
  else status = 'building';

  return {
    hasWake: true,
    lastWake: new Date(wakeMs),
    windowMinutes,
    start: new Date(startMs),
    end: new Date(endMs),
    minutesUntilStart,
    status,
  };
}
