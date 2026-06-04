import { describe, it, expect } from 'vitest';
import { computeSweetSpot, lastWakeMs } from './sweetSpot';

const iso = (ms) => new Date(ms).toISOString();

describe('lastWakeMs', () => {
  it('returns null when there is no signal', () => {
    expect(lastWakeMs([], [])).toBeNull();
    expect(lastWakeMs([{ woke_at: null }], [{ sleep_end: null }])).toBeNull();
  });

  it('picks the later of a wake event and a sleep_end', () => {
    const earlier = Date.UTC(2026, 5, 4, 3, 0, 0);
    const later = Date.UTC(2026, 5, 4, 9, 0, 0);
    expect(lastWakeMs([{ woke_at: iso(earlier) }], [{ sleep_end: iso(later) }])).toBe(later);
    expect(lastWakeMs([{ woke_at: iso(later) }], [{ sleep_end: iso(earlier) }])).toBe(later);
  });

  it('ignores null sleep_end (the common app case)', () => {
    const t = Date.UTC(2026, 5, 4, 9, 0, 0);
    expect(lastWakeMs([{ woke_at: iso(t) }], [{ sleep_end: null }])).toBe(t);
  });
});

describe('computeSweetSpot', () => {
  it('reports no-wake when nothing is known', () => {
    const r = computeSweetSpot({ ageInDays: 30, wakeEvents: [], sleepLogs: [] });
    expect(r.status).toBe('no-wake');
    expect(r.hasWake).toBe(false);
    expect(r.start).toBeNull();
  });

  it('reports unknown-age when age is missing but a wake exists', () => {
    const t = Date.now();
    const r = computeSweetSpot({ ageInDays: null, wakeEvents: [{ woke_at: iso(t) }], sleepLogs: [] });
    expect(r.status).toBe('unknown-age');
    expect(r.hasWake).toBe(true);
    expect(r.windowMinutes).toBeNull();
  });

  it.each([
    [30, 45],    // newborn
    [80, 75],
    [140, 100],
    [200, 150],
    [330, 180],
    [400, 240],
    [600, 360],  // 18m+
  ])('uses the right wake window for %i days → %i min', (ageInDays, expectedWindow) => {
    const wake = Date.UTC(2026, 5, 4, 6, 0, 0);
    const r = computeSweetSpot({
      ageInDays,
      wakeEvents: [{ woke_at: iso(wake) }],
      sleepLogs: [],
      now: new Date(wake), // just woke
    });
    expect(r.windowMinutes).toBe(expectedWindow);
    // start/end are a ±15-min band around wake + window
    expect(r.start.getTime()).toBe(wake + (expectedWindow - 15) * 60000);
    expect(r.end.getTime()).toBe(wake + (expectedWindow + 15) * 60000);
  });

  it('transitions building → approaching → now → overdue with the clock', () => {
    const wake = Date.UTC(2026, 5, 4, 6, 0, 0);
    const base = { ageInDays: 200, wakeEvents: [{ woke_at: iso(wake) }], sleepLogs: [] }; // 150-min window
    const at = (min) => computeSweetSpot({ ...base, now: new Date(wake + min * 60000) });

    expect(at(10).status).toBe('building');       // far from window
    expect(at(120).status).toBe('approaching');   // within 30 min of start (start=135)
    expect(at(140).status).toBe('now');           // inside 135–165 band
    expect(at(200).status).toBe('overdue');       // past 165
  });

  it('minutesUntilStart is positive before the window and negative after', () => {
    const wake = Date.UTC(2026, 5, 4, 6, 0, 0);
    const before = computeSweetSpot({ ageInDays: 200, wakeEvents: [{ woke_at: iso(wake) }], sleepLogs: [], now: new Date(wake + 60 * 60000) });
    expect(before.minutesUntilStart).toBeGreaterThan(0);
    const after = computeSweetSpot({ ageInDays: 200, wakeEvents: [{ woke_at: iso(wake) }], sleepLogs: [], now: new Date(wake + 200 * 60000) });
    expect(after.minutesUntilStart).toBeLessThan(0);
  });
});
