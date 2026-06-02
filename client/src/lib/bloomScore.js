// Bloom Score & reactive Dr. Bloom note.
// Pure functions — no React, no Supabase. Easy to test.

export function computeBloomScore({ sleepToday, sleepTarget, feedsToday, feedsTarget, hasCheckin }) {
  // Each track contributes 0..1 only if logged. No fake defaults.
  const sleepPct = sleepToday != null ? Math.min(sleepToday / sleepTarget, 1) : null;
  const feedPct  = feedsToday != null ? Math.min(feedsToday / feedsTarget, 1) : null;
  const checkPct = hasCheckin ? 1 : null;

  const tracks = [sleepPct, feedPct, checkPct].filter(p => p != null);
  if (tracks.length < 3) return null; // not enough data → caller hides score

  const avg = tracks.reduce((a, b) => a + b, 0) / tracks.length;
  return Math.round(avg * 100);
}

/**
 * Reactive Dr. Bloom note. Picks the most useful single nudge given:
 *  - what was/wasn't logged today
 *  - child age in days
 *  - hour of day
 *  - upcoming vaccine
 */
export function getReactiveDrBloomNote({
  childName,
  ageInDays,
  feedsToday = 0,
  feedsTarget = 8,
  sleepToday = null,
  sleepTarget = 14,
  hasCheckinToday = false,
  nextVaccineDays = null,
  hour = new Date().getHours(),
}) {
  const name = childName || 'your little one';

  if (!ageInDays && ageInDays !== 0) {
    return `Welcome. Set up ${name}'s profile so I can give real guidance.`;
  }

  // Urgent vaccine first
  if (nextVaccineDays != null && nextVaccineDays >= 0 && nextVaccineDays <= 2) {
    return nextVaccineDays === 0
      ? `${name}'s vaccine is due today. Don't skip — IAP schedule matters.`
      : `${name}'s next vaccine is in ${nextVaccineDays} day${nextVaccineDays === 1 ? '' : 's'}. Plan the clinic visit.`;
  }

  // Missing feeds (only relevant for under-6m)
  if (ageInDays < 180 && feedsToday < Math.floor(feedsTarget * 0.5) && hour >= 12) {
    return `Only ${feedsToday} feed${feedsToday === 1 ? '' : 's'} logged so far. ${name} usually needs ${feedsTarget} a day at this age — aim for ${feedsTarget - feedsToday} more.`;
  }

  // Sleep gap
  if (sleepToday != null && sleepToday < sleepTarget * 0.7) {
    return `${name} slept ${sleepToday}h — under the ${sleepTarget}h target for this age. Try an earlier wind-down tonight.`;
  }

  // No check-in yet, late afternoon
  if (!hasCheckinToday && hour >= 17) {
    return `No check-in today. Two minutes now and I can spot anything off for ${name}.`;
  }

  // Positive feedback if all logged
  if (feedsToday >= feedsTarget * 0.8 && hasCheckinToday) {
    return `${name} is on rhythm today — ${feedsToday} feeds, check-in done. You're doing the work.`;
  }

  // Age-based default if nothing else fires
  return getAgeNote(name, ageInDays);
}

function getAgeNote(name, ageInDays) {
  if (ageInDays <= 7)   return `${name} is in their first week — skin-to-skin and feeding are everything right now.`;
  if (ageInDays <= 14)  return `${name} is regaining birth weight this week. Feeding often is exactly right.`;
  if (ageInDays <= 21)  return `${name}'s hearing is now fully developed — they recognize your voice distinctly.`;
  if (ageInDays <= 30)  return `${name} is on day ${ageInDays}. First social smiles are days away.`;
  if (ageInDays <= 60)  return `${name} is starting to track faces and coo. Talk often.`;
  if (ageInDays <= 90)  return `${name} is building head control. Tummy time — even 5 minutes counts.`;
  if (ageInDays <= 180) return `${name} is approaching the sitting milestone. Lots to celebrate this month.`;
  if (ageInDays <= 365) return `${name} is close to their first year. Every word you say is building vocabulary.`;
  return `${name} is growing beautifully. You're doing great.`;
}
