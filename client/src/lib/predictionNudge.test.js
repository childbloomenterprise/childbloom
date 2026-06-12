import { describe, it, expect } from 'vitest';
import { computeFeedNudge, NUDGE_DELAY_MIN, NUDGE_HORIZON_MIN } from './predictionNudge';

// Build a steady 3-hour rhythm ending at `lastAt`.
function steadyFeeds(lastAt, gapMin = 180, count = 6) {
  const last = new Date(lastAt);
  return Array.from({ length: count }, (_, i) => ({
    logged_at: new Date(last.getTime() - i * gapMin * 60000).toISOString(),
  }));
}

describe('computeFeedNudge', () => {
  // Last feed 09:00, median gap 3h → prediction 12:00.
  const feeds = steadyFeeds('2026-06-12T09:00:00');

  it('returns null with too few feeds (confidence gate)', () => {
    expect(computeFeedNudge({
      foodLogs7d: steadyFeeds('2026-06-12T09:00:00', 180, 3),
      now: new Date('2026-06-12T13:00:00'),
    })).toBeNull();
  });

  it('returns null before the prediction + delay has passed', () => {
    expect(computeFeedNudge({ foodLogs7d: feeds, now: new Date('2026-06-12T12:15:00') })).toBeNull();
  });

  it('nudges once the prediction is comfortably overdue', () => {
    const nudge = computeFeedNudge({ foodLogs7d: feeds, now: new Date('2026-06-12T12:45:00') });
    expect(nudge).not.toBeNull();
    expect(nudge.gapMin).toBe(180);
    expect(nudge.predictedAt.toISOString()).toBe(new Date('2026-06-12T12:00:00').toISOString());
  });

  it('goes quiet when the prediction is stale (no nagging hours later)', () => {
    const past = new Date(new Date('2026-06-12T12:00:00').getTime() + (NUDGE_HORIZON_MIN + 10) * 60000);
    expect(computeFeedNudge({ foodLogs7d: feeds, now: past })).toBeNull();
  });

  it('disappears when a feed lands near the predicted time', () => {
    // Parent logged at 12:10 — prediction recomputes from it into the future.
    const withCoveringFeed = [{ logged_at: '2026-06-12T12:10:00' }, ...feeds];
    expect(computeFeedNudge({ foodLogs7d: withCoveringFeed, now: new Date('2026-06-12T12:50:00') })).toBeNull();
  });

  it('respects today\'s dismiss', () => {
    expect(computeFeedNudge({
      foodLogs7d: feeds,
      now: new Date('2026-06-12T12:45:00'),
      dismissedDay: '2026-06-12',
    })).toBeNull();
  });

  it('ignores yesterday\'s dismiss', () => {
    expect(computeFeedNudge({
      foodLogs7d: feeds,
      now: new Date('2026-06-12T12:45:00'),
      dismissedDay: '2026-06-11',
    })).not.toBeNull();
  });

  it('never nudges tight cluster rhythms (gap ≤ 45 min would be noise)', () => {
    const cluster = steadyFeeds('2026-06-12T09:00:00', 40, 8);
    expect(computeFeedNudge({ foodLogs7d: cluster, now: new Date('2026-06-12T10:20:00') })).toBeNull();
  });

  it('handles invalid rows and empty input gracefully', () => {
    expect(computeFeedNudge({ foodLogs7d: [], now: new Date() })).toBeNull();
    expect(computeFeedNudge({ foodLogs7d: [{ logged_at: 'garbage' }], now: new Date() })).toBeNull();
    expect(computeFeedNudge()).toBeNull();
  });

  it('delay boundary: exactly at NUDGE_DELAY_MIN minutes past → nudges', () => {
    const at = new Date(new Date('2026-06-12T12:00:00').getTime() + NUDGE_DELAY_MIN * 60000);
    expect(computeFeedNudge({ foodLogs7d: feeds, now: at })).not.toBeNull();
  });
});
