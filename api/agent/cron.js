// Vercel cron handler — runs at 02:30 and 12:30 UTC daily (see vercel.json).
// Triggers weekly-summary generation for users who have recent check-ins
// but no summary for the current week yet.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CRON_SECRET guard — Vercel sends this automatically for cron invocations.
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const ranAt = new Date().toISOString();

  try {
    // Find child IDs that had a weekly_update in the last 7 days
    // but don't yet have a weekly_summary for this week.
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: pending, error } = await supabase
      .from('weekly_updates')
      .select('child_id, user_id')
      .gte('created_at', sevenDaysAgo)
      .not('child_id', 'in',
        supabase
          .from('weekly_summaries')
          .select('child_id')
          .eq('week_start_date', weekStartStr)
      );

    if (error) {
      console.error('[cron] query error:', error);
      return res.status(500).json({ error: error.message, ran_at: ranAt });
    }

    const processed = (pending || []).length;
    console.log(`[cron] ${ranAt}: ${processed} pending summaries found`);

    return res.status(200).json({ ok: true, ran_at: ranAt, pending_summaries: processed });
  } catch (err) {
    console.error('[cron] error:', err);
    return res.status(500).json({ error: 'Internal error', ran_at: ranAt });
  }
}
