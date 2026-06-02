// Shared rate-limit helper backed by public.api_usage (auth'd) and
// public.ip_rate_limits (anon/IP-based).
//
// Usage (authenticated):
//   const limited = await checkRateLimit(supabase, user.id, 'ask', [
//     { limit: 3,   windowSec: 60     },
//     { limit: 30,  windowSec: 3600   },
//     { limit: 100, windowSec: 86400  },
//   ]);
//   if (limited) return res.status(429).json({ error: { message: limited.message } });
//
// Usage (IP-based):
//   const limited = await checkIpRateLimit(serviceClient, getClientIp(req), 'send-review', [...]);
//
// Notes:
// - For checkRateLimit, pass a user-scoped supabase (RLS-enforced inserts).
// - For checkIpRateLimit, pass a service-role supabase (bypasses RLS).
// - Fail-closed on DB errors: a broken counter returns rate-limited.

import { createHash } from 'crypto';

export async function checkRateLimit(supabase, userId, endpoint, tiers) {
  for (const tier of tiers) {
    const sinceIso = new Date(Date.now() - tier.windowSec * 1000).toISOString();
    const { count, error } = await supabase
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', sinceIso);

    if (error) {
      return { message: 'Rate-limit check failed. Try again in a moment.', retryAfterSec: 30 };
    }

    if ((count ?? 0) >= tier.limit) {
      return {
        message: tier.message
          || `Rate limit reached: ${tier.limit} per ${humanizeWindow(tier.windowSec)}. Please try again soon.`,
        retryAfterSec: tier.windowSec,
      };
    }
  }
  return null;
}

export function logUsage(supabase, userId, endpoint) {
  return supabase.from('api_usage').insert({ user_id: userId, endpoint }).then(() => {});
}

function humanizeWindow(sec) {
  if (sec <= 60)    return `${sec}s`;
  if (sec <= 3600)  return `${Math.round(sec / 60)} min`;
  if (sec <= 86400) return `${Math.round(sec / 3600)} hr`;
  return `${Math.round(sec / 86400)} day`;
}

// ── IP-based rate limit for unauthenticated endpoints ───────────────────────

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip) {
  return createHash('sha256').update(`childbloom:ip:${ip}`).digest('hex').slice(0, 32);
}

export async function checkIpRateLimit(supabaseService, ip, endpoint, tiers) {
  const ipHash = hashIp(ip);
  for (const tier of tiers) {
    const sinceIso = new Date(Date.now() - tier.windowSec * 1000).toISOString();
    const { count, error } = await supabaseService
      .from('ip_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('endpoint', endpoint)
      .gte('created_at', sinceIso);

    if (error) {
      return { message: 'Rate-limit check failed. Try again in a moment.', retryAfterSec: 30 };
    }

    if ((count ?? 0) >= tier.limit) {
      return {
        message: tier.message || `Too many requests. Try again in ${humanizeWindow(tier.windowSec)}.`,
        retryAfterSec: tier.windowSec,
      };
    }
  }
  await supabaseService.from('ip_rate_limits').insert({ ip_hash: ipHash, endpoint });
  return null;
}

// ── Input validation helpers ─────────────────────────────────────────────────

export function isString(v, { min = 0, max = Infinity } = {}) {
  return typeof v === 'string' && v.length >= min && v.length <= max;
}

export function isUuid(v) {
  return typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function sanitizeText(s, { maxLen = 2000 } = {}) {
  if (typeof s !== 'string') return '';
  return s.slice(0, maxLen);
}
