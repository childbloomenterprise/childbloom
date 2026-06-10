// GET /api/brief/today?childId=<uuid>
// Returns today's Daily Bloom Brief for the given child, or { brief: null } if
// the cron hasn't generated one yet. Read-only — generation happens in
// api/agent/cron.js. RLS guarantees the caller can only read their own child.

import { createClient } from '@supabase/supabase-js';
import { corsOrigin } from '../models.js';
import { isUuid } from '../rateLimit.js';

// India Standard Time date (UTC+5:30) as YYYY-MM-DD — must match cron.js.
function istDateStr(d = new Date()) {
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().slice(0, 10);
}

export async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const userToken = authHeader.slice(7);

  const childId = req.query?.childId;
  if (!isUuid(childId)) {
    return res.status(400).json({ error: { message: 'childId must be a valid UUID' } });
  }

  // User-scoped client — RLS ensures the caller only sees their own child's brief.
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${userToken}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const { data, error } = await supabase
    .from('daily_brief')
    .select('brief_date, title, expect_this_week, tip, reassurance, lang')
    .eq('child_id', childId)
    .eq('brief_date', istDateStr())
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: { message: 'Could not load today\'s brief.' } });
  }

  return res.status(200).json({ brief: data || null });
}
