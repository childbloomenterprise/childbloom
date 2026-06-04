// Quick-log event → Supabase row mapping.
//
// Pure builders (testable, no side effects) that turn a confirmed quick-log
// event into a row for the RIGHT table the ChildBloom app already reads:
//   feed   → food_logs   (so it counts in feedsToday + shows in Food tracker)
//   sleep  → sleep_logs  (so it counts in sleep metrics)
//   diaper → quick_logs  (type 'diaper')
//   meds   → quick_logs  (type 'meds')
//
// writeEvents() performs the inserts and reports which React Query keys to
// invalidate so the dashboard refreshes.

const SIDE_CODE = { left: 'L', right: 'R' };

function ymd(d) {
  // local YYYY-MM-DD (matches how the app derives logged_date with date-fns format)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Encode feed metadata the way lib/feedLearning.js expects to read it back:
// "<ml>ml · side:L · <free notes>"
export function buildFeedNotes(ev) {
  const parts = [];
  if (Number.isFinite(Number(ev.amount_ml))) parts.push(`${Math.round(Number(ev.amount_ml))}ml`);
  if (ev.side && SIDE_CODE[ev.side]) parts.push(`side:${SIDE_CODE[ev.side]}`);
  else if (ev.side === 'both') parts.push('both sides');
  if (ev.notes) parts.push(String(ev.notes));
  return parts.length ? parts.join(' · ') : null;
}

// Returns { table, row } or null if the event can't be persisted.
export function eventToRow(ev, { childId, userId, now = new Date() }) {
  if (!ev || !childId || !userId) return null;
  const iso = now.toISOString();
  const date = ymd(now);

  if (ev.type === 'feed') {
    const feedType = ev.feed_type || 'bottle';
    return {
      table: 'food_logs',
      invalidate: [['food-logs-today', childId], ['food-logs-7d', childId]],
      row: {
        child_id: childId,
        user_id: userId,
        logged_date: date,
        logged_at: iso,
        food_name: feedType,
        food_type: feedType,
        duration_minutes: Number.isFinite(Number(ev.duration_minutes)) ? Math.round(Number(ev.duration_minutes)) : null,
        notes: buildFeedNotes(ev),
      },
    };
  }

  if (ev.type === 'sleep') {
    const hours = Number(ev.hours_slept);
    const note = ev.quality
      ? `quality: ${ev.quality}${ev.notes ? ` · ${ev.notes}` : ''}`
      : (ev.notes || null);
    return {
      table: 'sleep_logs',
      invalidate: [['sleep-logs-today', childId], ['sleep-logs-7d', childId]],
      row: {
        child_id: childId,
        user_id: userId,
        logged_date: date,
        hours_slept: Number.isFinite(hours) && hours > 0 ? hours : 1,
        notes: note,
      },
    };
  }

  if (ev.type === 'diaper') {
    return {
      table: 'quick_logs',
      invalidate: [['quick-logs-today', childId]],
      row: {
        child_id: childId,
        user_id: userId,
        type: 'diaper',
        logged_at: iso,
        logged_date: date,
        data: { kind: ev.kind || 'wet' },
        notes: ev.notes || null,
      },
    };
  }

  if (ev.type === 'meds') {
    const name = (ev.name || '').trim();
    if (!name) return null;
    return {
      table: 'quick_logs',
      invalidate: [['quick-logs-today', childId]],
      row: {
        child_id: childId,
        user_id: userId,
        type: 'meds',
        logged_at: iso,
        logged_date: date,
        data: { name, dose: ev.dose || null },
        notes: ev.notes || null,
      },
    };
  }

  return null;
}

// Insert every confirmed event. Returns { saved, invalidateKeys } where
// invalidateKeys is a de-duplicated list of React Query keys to refresh.
export async function writeEvents(events, { supabase, childId, userId, now = new Date() }) {
  const mapped = events.map((ev) => eventToRow(ev, { childId, userId, now })).filter(Boolean);
  const invalidateKeys = [];
  let saved = 0;

  for (const { table, row, invalidate } of mapped) {
    const { error } = await supabase.from(table).insert(row);
    if (error) throw error;
    saved += 1;
    for (const key of invalidate) {
      if (!invalidateKeys.some((k) => JSON.stringify(k) === JSON.stringify(key))) {
        invalidateKeys.push(key);
      }
    }
  }
  return { saved, invalidateKeys };
}
