// Client-side pattern detector for the Child Memory Graph (lightweight).
// Reads last 7 days of food + sleep logs, returns structured observations
// the dashboard can surface ambiently.
//
// Future: this moves server-side once we have a daily cron generating
// cached "insight rows" — but for now, doing it on the client is honest
// and avoids extra API cost.

import { differenceInMinutes, differenceInHours, format } from 'date-fns';

/**
 * Returns the most useful pattern observation given the data, or null
 * if nothing interesting is happening.
 *
 * Shape: { headline, body } — both short, factual, non-alarming.
 */
export function detectFeedPattern({ foodLogs, sleepLogs, childName }) {
  if (!foodLogs || foodLogs.length < 4) return null; // need a base
  const name = childName || 'your baby';

  // ── 1. Average gap between feeds (last 7 days) ──
  const sorted = [...foodLogs]
    .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
    .slice(0, 30);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = differenceInMinutes(new Date(sorted[i].logged_at), new Date(sorted[i + 1].logged_at));
    if (gap > 15 && gap < 720) gaps.push(gap); // ignore <15min (same session) and >12h (night)
  }
  if (gaps.length < 3) return null;
  const avgGapMin = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const avgGapHr = avgGapMin / 60;

  // ── 2. Cluster-feed detection: are evening gaps shorter than daytime? ──
  const eveningGaps = [];
  const daytimeGaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const hour = new Date(sorted[i].logged_at).getHours();
    const gap = differenceInMinutes(new Date(sorted[i].logged_at), new Date(sorted[i + 1].logged_at));
    if (gap > 15 && gap < 720) {
      if (hour >= 18 && hour <= 22) eveningGaps.push(gap);
      else if (hour >= 9 && hour < 18) daytimeGaps.push(gap);
    }
  }
  if (eveningGaps.length >= 3 && daytimeGaps.length >= 3) {
    const evAvg = eveningGaps.reduce((a, b) => a + b, 0) / eveningGaps.length;
    const dayAvg = daytimeGaps.reduce((a, b) => a + b, 0) / daytimeGaps.length;
    if (evAvg < dayAvg * 0.75) {
      return {
        headline: `${name} cluster-feeds in the evening`,
        body: `Evening gaps average ${Math.round(evAvg)} min vs ${Math.round(dayAvg)} min during the day — normal pattern, especially around developmental leaps.`,
      };
    }
  }

  // ── 3. Side preference (breast feeds) ──
  const breastFeeds = sorted.filter(f => f.food_type === 'breast' && f.notes);
  const leftCount = breastFeeds.filter(f => /side:l\b/i.test(f.notes)).length;
  const rightCount = breastFeeds.filter(f => /side:r\b/i.test(f.notes)).length;
  if (leftCount + rightCount >= 6) {
    const total = leftCount + rightCount;
    if (leftCount / total > 0.7) {
      return {
        headline: 'Left-side preference showing',
        body: `${leftCount} of last ${total} breast feeds were on the left. Try offering right side first to balance supply.`,
      };
    }
    if (rightCount / total > 0.7) {
      return {
        headline: 'Right-side preference showing',
        body: `${rightCount} of last ${total} breast feeds were on the right. Try offering left side first to balance supply.`,
      };
    }
  }

  // ── 4. Sleep + feed correlation ──
  if (sleepLogs && sleepLogs.length >= 3) {
    const recentSleep = sleepLogs.slice(0, 5);
    const avgHours = recentSleep.reduce((s, l) => s + (l.hours_slept || 0), 0) / recentSleep.length;
    if (avgHours >= 11) {
      return {
        headline: `${name} is sleeping steadily`,
        body: `Average ${avgHours.toFixed(1)}h over the last ${recentSleep.length} nights. This usually means feeds are timed well.`,
      };
    }
  }

  // ── 5. Default: gap rhythm observation ──
  return {
    headline: `Feeding every ~${avgGapHr.toFixed(1)} hours`,
    body: `Based on the last ${gaps.length} feeds. Consistent rhythm is a great sign.`,
  };
}

// Last 7 days of food logs — small fetch helper
export const FEED_LOGS_7D_QUERY_KEY = (childId) => ['food-logs-7d', childId];
