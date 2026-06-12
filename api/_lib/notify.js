// Notification dispatch — in-app delivery via the public.notifications table.
//
// The client already subscribes to this table over Supabase Realtime
// (client/src/hooks/useNotifications.js) and lists it in the Inbox, so an
// insert IS a delivery: instant toast when the app is open, waiting in the
// inbox when it isn't. Web push / FCM / email stay behind this interface —
// when they land they slot into insertNotification without touching callers.
//
// All functions are fail-soft and never throw: agent steps fire-and-forget.

/**
 * Insert one in-app notification. Service-role client required (the cron's).
 * @param {object} supabase - service-role Supabase client
 * @param {object} n - { recipientId, type, title, body, data }
 * @returns {Promise<{ delivered: boolean, reason: string }>}
 */
export async function insertNotification(supabase, { recipientId, type, title, body = null, data = {} }) {
  try {
    if (!recipientId || !type || !title) return { delivered: false, reason: 'missing_fields' };
    const { error } = await supabase.from('notifications').insert({
      recipient_id: recipientId,
      type,
      title,
      body,
      data,
      sender_name: 'ChildBloom',
      sender_role: 'system',
    });
    if (error) return { delivered: false, reason: error.message };
    return { delivered: true, reason: 'inserted' };
  } catch (err) {
    return { delivered: false, reason: err?.message || 'unknown_error' };
  }
}

/**
 * Has this user already received a notification of `type` for `data.date`?
 * Used to dedup agent nudges across the two daily cron runs.
 */
export async function alreadyNotifiedToday(supabase, { recipientId, type, date }) {
  try {
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('type', type)
      .eq('data->>date', date)
      .limit(1);
    if (error) return false; // fail-open: worst case is one duplicate nudge
    return (rows || []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Notify a parent that today's Daily Bloom Brief is ready.
 * Kept for the existing call-site contract; now actually delivers in-app.
 * @param {string} userId - auth.users.id
 * @param {object} [opts] - { supabase, childId, title }
 */
export async function notifyDailyBrief(userId, opts = {}) {
  if (!opts.supabase) return { delivered: false, reason: 'no_client' };
  return insertNotification(opts.supabase, {
    recipientId: userId,
    type: 'daily_brief',
    title: opts.title || 'Today’s Bloom Brief is ready',
    data: { child_id: opts.childId || null },
  });
}
