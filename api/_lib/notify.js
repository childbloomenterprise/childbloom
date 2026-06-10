// Notification dispatch — STUB for Phase 1.
//
// The Daily Bloom Brief (feature #1) is the first trigger that will want to
// push a parent ("today's brief is ready"). The full push/notification engine
// is Phase-2 feature #6 (web push + Resend email fallback + a prefs table +
// quiet hours). Until that lands, this is a safe no-op so the cron can call it
// without a hard dependency, and #6 only has to fill in the body.
//
// TODO(feature #6): look up the user's push subscription + notif prefs, respect
// quiet hours, and deliver via web push with a Resend email fallback.

/**
 * Notify a parent that today's Daily Bloom Brief is ready.
 * @param {string} userId - auth.users.id
 * @param {object} [opts] - { childId, title }
 * @returns {Promise<{ delivered: boolean, reason: string }>}
 */
export async function notifyDailyBrief(userId, opts = {}) {
  // No-op until the push engine exists. Never throws — callers fire-and-forget.
  void userId;
  void opts;
  return { delivered: false, reason: 'push_engine_not_implemented' };
}
