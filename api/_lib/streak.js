// Server-side streak helpers for the agent cron. Pure (now injectable),
// IST-anchored — the parent's "day" is the India Standard Time day, matching
// istDateStr() in api/agent/cron.js and logged_date written by the client.

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

// IST calendar date (YYYY-MM-DD) `offset` days before `now`.
export function istDayStr(now = new Date(), offset = 0) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS - offset * 86400000);
  return ist.toISOString().slice(0, 10);
}

// Consecutive-day streak over a Set/array of 'YYYY-MM-DD' strings, anchored on
// today (IST) if logged, else yesterday. Mirrors client computeLogStreak so
// the number the agent defends is the number the parent sees on Home.
export function computeStreakFromDays(daySet, now = new Date()) {
  const days = daySet instanceof Set ? daySet : new Set(daySet || []);
  if (days.size === 0) return 0;

  let offset;
  if (days.has(istDayStr(now, 0))) offset = 0;
  else if (days.has(istDayStr(now, 1))) offset = 1;
  else return 0;

  let streak = 0;
  while (days.has(istDayStr(now, offset + streak))) streak += 1;
  return streak;
}

// The 12:30 UTC cron run lands at 18:00 IST — that's the evening run where
// streak-at-risk nudges make sense (parent still has hours to log).
export function isEveningRunIST(now = new Date()) {
  const istHour = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  return istHour >= 15; // 15:00 IST onward counts as the evening run
}

// Nudge only when there is a real streak to lose and today is still unlogged.
export function shouldNudgeStreak({ streak = 0, loggedToday = false } = {}) {
  return !loggedToday && streak >= 3;
}

// Monday (IST) gate for the weekly recap step.
export function isMondayIST(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.getUTCDay() === 1;
}

// The IST Monday that started LAST week (the completed week to recap).
export function lastWeekStartIST(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const day = ist.getUTCDay(); // 0 Sun … 6 Sat
  const sinceMonday = (day + 6) % 7; // days since this week's Monday
  const thisMonday = new Date(ist.getTime() - sinceMonday * 86400000);
  const lastMonday = new Date(thisMonday.getTime() - 7 * 86400000);
  return lastMonday.toISOString().slice(0, 10);
}
