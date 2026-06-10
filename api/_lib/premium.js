import { createClient } from '@supabase/supabase-js';

const FREE_WEEKLY_LIMIT = 5;

function serviceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Monday-based ISO week start as YYYY-MM-DD (UTC).
function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Mon=0
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export async function isPremium(userId) {
  const { data } = await serviceClient()
    .from('premium_subscriptions')
    .select('status, premium_until')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data || data.status !== 'active' || !data.premium_until) return false;
  return new Date(data.premium_until) > new Date();
}

// Atomically check + consume one free Dr. Bloom message for the current week.
// Returns { allowed, limit, used }.
export async function consumeFreeQuota(userId) {
  const db = serviceClient();
  const ws = weekStart();

  const { data: existing } = await db
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('week_start', ws)
    .maybeSingle();

  const count = existing?.count ?? 0;
  if (count >= FREE_WEEKLY_LIMIT) {
    return { allowed: false, limit: FREE_WEEKLY_LIMIT, used: count };
  }

  await db
    .from('ai_usage')
    .upsert(
      { user_id: userId, week_start: ws, count: count + 1 },
      { onConflict: 'user_id,week_start' }
    );

  return { allowed: true, limit: FREE_WEEKLY_LIMIT, used: count + 1 };
}
