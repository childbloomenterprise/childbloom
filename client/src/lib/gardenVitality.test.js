import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  gardenDaySet, vitalityTier, computeVitality,
  logDerivedAreaBoost, mergeAreaCounts, markWateredCelebrated,
} from './gardenVitality';

const NOW = new Date('2026-06-12T15:00:00');
const day = (offset) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

describe('gardenDaySet', () => {
  it('is empty for no logs', () => {
    expect(gardenDaySet([], [], []).size).toBe(0);
    expect(gardenDaySet().size).toBe(0);
  });

  it('collects logged_date and derives from logged_at', () => {
    const set = gardenDaySet(
      [{ logged_date: '2026-06-10' }],
      [{ logged_at: '2026-06-11T08:30:00' }],
    );
    expect(set.has('2026-06-10')).toBe(true);
    expect(set.has('2026-06-11')).toBe(true);
  });

  it('ignores rows without dates and tolerates null arrays', () => {
    const set = gardenDaySet([{ notes: 'x' }, null], null, undefined);
    expect(set.size).toBe(0);
  });

  it('prefers logged_date over logged_at when both present', () => {
    const set = gardenDaySet([{ logged_date: '2026-06-09', logged_at: '2026-06-10T01:00:00Z' }]);
    expect(set.has('2026-06-09')).toBe(true);
    expect(set.size).toBe(1);
  });
});

describe('vitalityTier', () => {
  it('maps day counts to tiers at the boundaries', () => {
    expect(vitalityTier(0)).toBe('parched');
    expect(vitalityTier(1)).toBe('budding');
    expect(vitalityTier(2)).toBe('budding');
    expect(vitalityTier(3)).toBe('growing');
    expect(vitalityTier(5)).toBe('growing');
    expect(vitalityTier(6)).toBe('thriving');
    expect(vitalityTier(7)).toBe('thriving');
  });
});

describe('computeVitality', () => {
  it('handles a totally empty week', () => {
    const v = computeVitality({ now: NOW });
    expect(v).toEqual({ wateredToday: false, daysWatered7: 0, tier: 'parched', logsToday: 0 });
  });

  it('detects watered today from any log table', () => {
    const v = computeVitality({ quickLogs7d: [{ logged_date: day(0) }], now: NOW });
    expect(v.wateredToday).toBe(true);
    expect(v.daysWatered7).toBe(1);
    expect(v.tier).toBe('budding');
    expect(v.logsToday).toBe(1);
  });

  it('counts distinct watered days across tables without double counting', () => {
    const v = computeVitality({
      foodLogs7d: [{ logged_date: day(0) }, { logged_date: day(1) }],
      sleepLogs7d: [{ logged_date: day(1) }, { logged_date: day(2) }],
      now: NOW,
    });
    expect(v.daysWatered7).toBe(3);
    expect(v.tier).toBe('growing');
  });

  it('ignores days older than the 7-day window', () => {
    const v = computeVitality({
      foodLogs7d: [{ logged_date: day(7) }, { logged_date: day(10) }],
      now: NOW,
    });
    expect(v.daysWatered7).toBe(0);
    expect(v.tier).toBe('parched');
  });

  it('reaches thriving with 6 of 7 days watered', () => {
    const v = computeVitality({
      foodLogs7d: [0, 1, 2, 3, 4, 5].map((o) => ({ logged_date: day(o) })),
      now: NOW,
    });
    expect(v.daysWatered7).toBe(6);
    expect(v.tier).toBe('thriving');
  });

  it('counts logsToday across all tables, only for today', () => {
    const v = computeVitality({
      foodLogs7d: [{ logged_date: day(0) }, { logged_date: day(0) }, { logged_date: day(1) }],
      sleepLogs7d: [{ logged_date: day(0) }],
      quickLogs7d: [{ logged_at: `${day(0)}T09:00:00` }],
      now: NOW,
    });
    expect(v.logsToday).toBe(4);
  });

  it('respects the injected now across month boundaries', () => {
    const monthEdge = new Date('2026-07-01T08:00:00');
    const v = computeVitality({
      foodLogs7d: [{ logged_date: '2026-06-30' }, { logged_date: '2026-06-29' }],
      now: monthEdge,
    });
    expect(v.daysWatered7).toBe(2);
    expect(v.wateredToday).toBe(false);
  });
});

describe('logDerivedAreaBoost', () => {
  it('gives no credit below the threshold', () => {
    expect(logDerivedAreaBoost({ feedCount7d: 4, sleepCount7d: 0 })).toEqual({ nourishment: 0, rest: 0 });
  });

  it('earns one credit per 5 logs', () => {
    expect(logDerivedAreaBoost({ feedCount7d: 5, sleepCount7d: 11 })).toEqual({ nourishment: 1, rest: 2 });
  });

  it('caps at the blooming threshold (3)', () => {
    expect(logDerivedAreaBoost({ feedCount7d: 40, sleepCount7d: 100 })).toEqual({ nourishment: 3, rest: 3 });
  });

  it('tolerates missing/negative input', () => {
    expect(logDerivedAreaBoost()).toEqual({ nourishment: 0, rest: 0 });
    expect(logDerivedAreaBoost({ feedCount7d: -3 })).toEqual({ nourishment: 0, rest: 0 });
  });
});

describe('mergeAreaCounts', () => {
  it('adds credits onto real moment counts without mutating', () => {
    const real = { nourishment: 1, body: 2 };
    const merged = mergeAreaCounts(real, { nourishment: 2, rest: 1 });
    expect(merged).toEqual({ nourishment: 3, body: 2, rest: 1 });
    expect(real).toEqual({ nourishment: 1, body: 2 });
  });

  it('skips zero-credit areas so buds stay buds', () => {
    const merged = mergeAreaCounts({}, { nourishment: 0, rest: 0 });
    expect(merged).toEqual({});
  });
});

describe('markWateredCelebrated', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
    });
  });

  it('returns true once per child per day, then false', () => {
    expect(markWateredCelebrated('c1', NOW)).toBe(true);
    expect(markWateredCelebrated('c1', NOW)).toBe(false);
  });

  it('resets on a new day', () => {
    expect(markWateredCelebrated('c1', NOW)).toBe(true);
    const tomorrow = new Date('2026-06-13T08:00:00');
    expect(markWateredCelebrated('c1', tomorrow)).toBe(true);
  });

  it('tracks children independently and rejects missing ids', () => {
    expect(markWateredCelebrated('c1', NOW)).toBe(true);
    expect(markWateredCelebrated('c2', NOW)).toBe(true);
    expect(markWateredCelebrated(null, NOW)).toBe(false);
  });
});
