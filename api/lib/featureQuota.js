// Per-feature weekly free-quota meter, backed by public.ai_feature_usage.
//
// Mirrors consumeFreeQuota() in premium.js, but keyed by a `feature` string so
// each Phase-1 AI feature (myth-buster, voice log-parser) has its OWN weekly
// allowance that never touches Dr. Bloom's shared ai_usage bucket.
//
// Usage (server-side only — uses the service role):
//   import { consumeFeatureQuota } from '../lib/featureQuota.js';
//   const quota = await consumeFeatureQuota(user.id, 'myth_check', 3);
//   if (!quota.allowed) return res.status(402).json({ ... });
//
// Premium users should be checked with isPremium() BEFORE calling this, so the
// meter only ticks for free users.

import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Monday-based ISO week start as YYYY-MM-DD (UTC). Matches premium.js exactly
// so a user's "week" boundary is consistent across every metered feature.
export function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Mon=0
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

// Atomically check + consume one unit of a per-feature weekly quota.
// Returns { allowed, limit, used }.
export async function consumeFeatureQuota(userId, feature, limit, db = serviceClient()) {
  const ws = weekStart();

  const { data: existing } = await db
    .from('ai_feature_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('week_start', ws)
    .maybeSingle();

  const count = existing?.count ?? 0;
  if (count >= limit) {
    return { allowed: false, limit, used: count };
  }

  await db
    .from('ai_feature_usage')
    .upsert(
      { user_id: userId, feature, week_start: ws, count: count + 1 },
      { onConflict: 'user_id,feature,week_start' }
    );

  return { allowed: true, limit, used: count + 1 };
}
