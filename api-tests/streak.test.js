import { describe, it, expect } from 'vitest';
import {
  istDayStr, computeStreakFromDays, isEveningRunIST, shouldNudgeStreak,
  isMondayIST, lastWeekStartIST,
} from '../api/_lib/streak.js';

describe('istDayStr', () => {
  it('converts UTC to the IST calendar day', () => {
    // 20:00 UTC = 01:30 IST next day
    expect(istDayStr(new Date('2026-06-11T20:00:00Z'))).toBe('2026-06-12');
    // 02:30 UTC = 08:00 IST same day (the morning cron)
    expect(istDayStr(new Date('2026-06-12T02:30:00Z'))).toBe('2026-06-12');
  });

  it('offsets backwards in IST days', () => {
    expect(istDayStr(new Date('2026-06-12T02:30:00Z'), 1)).toBe('2026-06-11');
    expect(istDayStr(new Date('2026-06-12T02:30:00Z'), 8)).toBe('2026-06-04');
  });
});

describe('computeStreakFromDays', () => {
  const now = new Date('2026-06-12T12:30:00Z'); // 18:00 IST Friday

  it('is 0 with no days', () => {
    expect(computeStreakFromDays(new Set(), now)).toBe(0);
  });

  it('counts consecutive IST days ending today', () => {
    expect(computeStreakFromDays(['2026-06-12', '2026-06-11', '2026-06-10'], now)).toBe(3);
  });

  it('anchors on yesterday when today is unlogged', () => {
    expect(computeStreakFromDays(['2026-06-11', '2026-06-10'], now)).toBe(2);
  });

  it('is 0 when the last log is 2+ days old', () => {
    expect(computeStreakFromDays(['2026-06-09', '2026-06-08'], now)).toBe(0);
  });

  it('stops at the first gap', () => {
    expect(computeStreakFromDays(['2026-06-12', '2026-06-10', '2026-06-09'], now)).toBe(1);
  });
});

describe('isEveningRunIST', () => {
  it('is false for the 02:30 UTC morning run (08:00 IST)', () => {
    expect(isEveningRunIST(new Date('2026-06-12T02:30:00Z'))).toBe(false);
  });
  it('is true for the 12:30 UTC evening run (18:00 IST)', () => {
    expect(isEveningRunIST(new Date('2026-06-12T12:30:00Z'))).toBe(true);
  });
});

describe('shouldNudgeStreak', () => {
  it('nudges only for streak ≥3 with nothing logged today', () => {
    expect(shouldNudgeStreak({ streak: 3, loggedToday: false })).toBe(true);
    expect(shouldNudgeStreak({ streak: 7, loggedToday: false })).toBe(true);
    expect(shouldNudgeStreak({ streak: 2, loggedToday: false })).toBe(false);
    expect(shouldNudgeStreak({ streak: 5, loggedToday: true })).toBe(false);
    expect(shouldNudgeStreak()).toBe(false);
  });
});

describe('isMondayIST / lastWeekStartIST', () => {
  it('detects Monday in IST, not UTC', () => {
    // Sunday 20:00 UTC = Monday 01:30 IST
    expect(isMondayIST(new Date('2026-06-14T20:00:00Z'))).toBe(true);
    // Monday 12:30 UTC = Monday 18:00 IST
    expect(isMondayIST(new Date('2026-06-15T12:30:00Z'))).toBe(true);
    // Friday
    expect(isMondayIST(new Date('2026-06-12T12:30:00Z'))).toBe(false);
  });

  it('returns the Monday that started the COMPLETED week', () => {
    // Monday 2026-06-15 (IST) → last week began Monday 2026-06-08
    expect(lastWeekStartIST(new Date('2026-06-15T02:30:00Z'))).toBe('2026-06-08');
    // Mid-week Friday → still the previous Monday's week
    expect(lastWeekStartIST(new Date('2026-06-12T12:30:00Z'))).toBe('2026-06-01');
  });
});
