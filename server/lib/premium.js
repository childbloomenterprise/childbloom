import supabaseAdmin from './supabaseAdmin.js';

// Free Dr. Bloom messages per ISO week for non-premium users.
export const FREE_WEEKLY_LIMIT = 5;

// Monday-based ISO week start as a YYYY-MM-DD string (UTC).
function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

// True if the user currently has an active, unexpired subscription.
export async function isPremium(userId) {
  const { data, error } = await supabaseAdmin
    .from('premium_subscriptions')
    .select('status, premium_until')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || data.status !== 'active' || !data.premium_until) return false;
  return new Date(data.premium_until) > new Date();
}

// Atomically check + consume one free Dr. Bloom message for the current week.
// Returns { allowed, limit, used }.
export async function consumeFreeQuota(userId) {
  const ws = weekStart();
  const { data: usage } = await supabaseAdmin
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('week_start', ws)
    .maybeSingle();

  const count = usage?.count || 0;
  if (count >= FREE_WEEKLY_LIMIT) {
    return { allowed: false, limit: FREE_WEEKLY_LIMIT, used: count };
  }

  await supabaseAdmin
    .from('ai_usage')
    .upsert({ user_id: userId, week_start: ws, count: count + 1 }, { onConflict: 'user_id,week_start' });

  return { allowed: true, limit: FREE_WEEKLY_LIMIT, used: count + 1 };
}

// Express middleware for premium-only endpoints (e.g. doctor PDF export).
export async function requirePremium(req, res, next) {
  try {
    if (await isPremium(req.userId)) return next();
    return res.status(402).json({ error: 'premium_required', upgrade: true });
  } catch (e) {
    console.error('requirePremium failed', e);
    return res.status(500).json({ error: 'premium_check_failed' });
  }
}
