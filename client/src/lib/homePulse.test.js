import { describe, it, expect, beforeEach } from 'vitest';
import {
  timeAgoShort, computeLogStreak, logDaySet, daysUntil, getWarmGreeting,
  readNapTimer, predictNextFeed,
} from './homePulse';

const NOW = new Date('2026-06-10T12:00:00');

describe('timeAgoShort', () => {
  it('returns null for missing/invalid input', () => {
    expect(timeAgoShort(null, NOW)).toBeNull();
    expect(timeAgoShort('not-a-date', NOW)).toBeNull();
  });

  it('returns null for future timestamps', () => {
    expect(timeAgoShort(new Date('2026-06-10T13:00:00'), NOW)).toBeNull();
  });

  it('formats minutes, hours and days compactly', () => {
    expect(timeAgoShort(new Date('2026-06-10T11:59:40'), NOW)).toBe('just now');
    expect(timeAgoShort(new Date('2026-06-10T11:25:00'), NOW)).toBe('35m ago');
    expect(timeAgoShort(new Date('2026-06-10T09:00:00'), NOW)).toBe('3h ago');
    expect(timeAgoShort(new Date('2026-06-07T12:00:00'), NOW)).toBe('3d ago');
  });
});

describe('computeLogStreak', () => {
  it('is 0 with no logged days', () => {
    expect(computeLogStreak(new Set(), NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const days = new Set(['2026-06-10', '2026-06-09', '2026-06-08']);
    expect(computeLogStreak(days, NOW)).toBe(3);
  });

  it('anchors on yesterday when today has no log yet', () => {
    const days = new Set(['2026-06-09', '2026-06-08']);
    expect(computeLogStreak(days, NOW)).toBe(2);
  });

  it('is 0 when the last log is older than yesterday', () => {
    const days = new Set(['2026-06-07', '2026-06-06']);
    expect(computeLogStreak(days, NOW)).toBe(0);
  });

  it('stops at gaps', () => {
    const days = new Set(['2026-06-10', '2026-06-09', '2026-06-07']);
    expect(computeLogStreak(days, NOW)).toBe(2);
  });

  it('accepts plain arrays', () => {
    expect(computeLogStreak(['2026-06-10'], NOW)).toBe(1);
  });
});

describe('logDaySet', () => {
  it('merges food and sleep logs into day strings', () => {
    const food = [
      { logged_date: '2026-06-10' },
      { logged_at: '2026-06-09T08:30:00Z' },
      { /* junk */ },
    ];
    const sleep = [{ logged_date: '2026-06-08' }];
    const days = logDaySet(food, sleep);
    expect(days.has('2026-06-10')).toBe(true);
    expect(days.has('2026-06-09')).toBe(true);
    expect(days.has('2026-06-08')).toBe(true);
    expect(days.size).toBe(3);
  });

  it('handles empty inputs', () => {
    expect(logDaySet().size).toBe(0);
  });
});

describe('daysUntil', () => {
  it('returns positive days for future dates and negative for overdue', () => {
    expect(daysUntil('2026-06-15', NOW)).toBe(5);
    expect(daysUntil('2026-06-05', NOW)).toBe(-5);
    expect(daysUntil(null, NOW)).toBeNull();
  });
});

describe('readNapTimer', () => {
  const CHILD = 'abc-123';
  beforeEach(() => localStorage.clear());

  it('returns null when no timer is stored', () => {
    expect(readNapTimer(CHILD, NOW)).toBeNull();
    expect(readNapTimer(null, NOW)).toBeNull();
  });

  it('returns elapsed minutes for a running timer', () => {
    localStorage.setItem(`cb_sleep_timer_${CHILD}`,
      JSON.stringify({ startedAt: '2026-06-10T11:15:00' }));
    expect(readNapTimer(CHILD, NOW)).toBe(45);
  });

  it('treats stale (>16h) or corrupt timers as idle', () => {
    localStorage.setItem(`cb_sleep_timer_${CHILD}`,
      JSON.stringify({ startedAt: '2026-06-09T10:00:00' }));
    expect(readNapTimer(CHILD, NOW)).toBeNull();
    localStorage.setItem(`cb_sleep_timer_${CHILD}`, '{not json');
    expect(readNapTimer(CHILD, NOW)).toBeNull();
  });
});

describe('predictNextFeed', () => {
  const feedAt = (iso) => ({ logged_at: iso });

  it('returns null with too little data', () => {
    expect(predictNextFeed([], NOW)).toBeNull();
    expect(predictNextFeed([feedAt('2026-06-10T08:00:00')], NOW)).toBeNull();
  });

  it('predicts last feed + median gap', () => {
    // Feeds every 3 hours, last at 10:00 → next ~13:00.
    const logs = [
      feedAt('2026-06-10T10:00:00'),
      feedAt('2026-06-10T07:00:00'),
      feedAt('2026-06-10T04:00:00'),
      feedAt('2026-06-10T01:00:00'),
      feedAt('2026-06-09T22:00:00'),
    ];
    const p = predictNextFeed(logs, NOW);
    expect(p).not.toBeNull();
    expect(p.gapMin).toBe(180);
    expect(p.at.getHours()).toBe(13);
  });

  it('returns null when data is stale (more than one gap overdue)', () => {
    const logs = [
      feedAt('2026-06-09T10:00:00'),
      feedAt('2026-06-09T07:00:00'),
      feedAt('2026-06-09T04:00:00'),
      feedAt('2026-06-09T01:00:00'),
      feedAt('2026-06-08T22:00:00'),
    ];
    expect(predictNextFeed(logs, NOW)).toBeNull();
  });

  it('ignores implausible gaps (<15 min or >12 h)', () => {
    const logs = [
      feedAt('2026-06-10T10:00:00'),
      feedAt('2026-06-10T09:59:00'), // 1-min gap — ignored
      feedAt('2026-06-08T10:00:00'), // 2-day gap — ignored
      feedAt('2026-06-08T09:00:00'),
    ];
    expect(predictNextFeed(logs, NOW)).toBeNull();
  });
});

describe('getWarmGreeting', () => {
  it('is deterministic for a given date and respects time slots', () => {
    const morning = new Date('2026-06-10T08:00:00');
    expect(getWarmGreeting(morning)).toBe(getWarmGreeting(morning));
    const night = new Date('2026-06-10T23:30:00');
    expect(['Quiet night', 'Late night cuddles', 'Still up']).toContain(getWarmGreeting(night));
  });
});
