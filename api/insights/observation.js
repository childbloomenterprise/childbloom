// Server-side Child Memory Graph observation generator.
//
// GET /api/insights/observation?childId=<uuid>
//   Auth: Bearer <jwt>
//   Returns: { observation: {kind, eyebrow, headline, body, tone} | null,
//              generated_at, cached: boolean }
//
// Strategy:
//   1. Check cmg_observations table for a fresh (unexpired) row for this child.
//      If found → return it (cached=true).
//   2. Otherwise: fetch last 14 days of food + sleep + weekly_updates,
//      run pattern detectors, write to cache table (if it exists),
//      return the freshly-generated row (cached=false).
//
// Graceful degradation: if cmg_observations table doesn't exist (migration
// not run yet), the endpoint still works — it just skips caching.

import { createClient } from '@supabase/supabase-js';
import { corsOrigin } from '../lib/models.js';
import { checkRateLimit, logUsage, isUuid } from '../lib/rateLimit.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const RATE_TIERS = [
  { limit: 30,  windowSec: 3600,  message: 'Too many observation requests this hour.' },
  { limit: 200, windowSec: 86400, message: 'Daily observation limit reached.' },
];

// ── Pattern detectors (server-side port of feedPatterns.js) ──────────────────

function minutesBetween(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / 60000;
}

function detectPattern({ foodLogs, sleepLogs, childName }) {
  if (!foodLogs || foodLogs.length < 4) return null;
  const name = childName || 'your baby';

  // 1. Average gap between feeds
  const sorted = [...foodLogs]
    .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
    .slice(0, 60);

  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = minutesBetween(sorted[i].logged_at, sorted[i + 1].logged_at);
    if (gap > 15 && gap < 720) gaps.push(gap);
  }
  if (gaps.length < 3) return null;
  const avgGapMin = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const avgGapHr = avgGapMin / 60;

  // 2. Cluster-feed detection (evening vs daytime gap)
  const eveningGaps = [];
  const daytimeGaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const hour = new Date(sorted[i].logged_at).getHours();
    const gap = minutesBetween(sorted[i].logged_at, sorted[i + 1].logged_at);
    if (gap > 15 && gap < 720) {
      if (hour >= 18 && hour <= 22) eveningGaps.push(gap);
      else if (hour >= 9 && hour < 18) daytimeGaps.push(gap);
    }
  }
  if (eveningGaps.length >= 3 && daytimeGaps.length >= 3) {
    const evAvg = eveningGaps.reduce((a, b) => a + b, 0) / eveningGaps.length;
    const dayAvg = daytimeGaps.reduce((a, b) => a + b, 0) / daytimeGaps.length;
    if (evAvg < dayAvg * 0.75) {
      return {
        kind: 'pattern',
        eyebrow: 'Pattern noticed',
        headline: `${name} cluster-feeds in the evening`,
        body: `Evening gaps average ${Math.round(evAvg)} min vs ${Math.round(dayAvg)} min during the day — normal pattern, especially around developmental leaps.`,
        tone: 'calm',
      };
    }
  }

  // 3. Side preference (breast feeds)
  const breastFeeds = sorted.filter(f => f.food_type === 'breast' && f.notes);
  const leftCount = breastFeeds.filter(f => /side:l\b/i.test(f.notes)).length;
  const rightCount = breastFeeds.filter(f => /side:r\b/i.test(f.notes)).length;
  if (leftCount + rightCount >= 6) {
    const total = leftCount + rightCount;
    if (leftCount / total > 0.7) {
      return {
        kind: 'pattern',
        eyebrow: 'Side preference',
        headline: 'Left-side preference showing',
        body: `${leftCount} of last ${total} breast feeds were on the left. Try offering right side first to balance supply.`,
        tone: 'attention',
      };
    }
    if (rightCount / total > 0.7) {
      return {
        kind: 'pattern',
        eyebrow: 'Side preference',
        headline: 'Right-side preference showing',
        body: `${rightCount} of last ${total} breast feeds were on the right. Try offering left side first to balance supply.`,
        tone: 'attention',
      };
    }
  }

  // 4. Sleep streak
  if (sleepLogs && sleepLogs.length >= 3) {
    const recent = sleepLogs.slice(0, 7);
    const avgHours = recent.reduce((s, l) => s + (l.hours_slept || 0), 0) / recent.length;
    if (avgHours >= 11) {
      return {
        kind: 'rhythm',
        eyebrow: 'Sleeping steady',
        headline: `${name} is sleeping steadily`,
        body: `Average ${avgHours.toFixed(1)}h over the last ${recent.length} nights. This usually means feeds are timed well.`,
        tone: 'positive',
      };
    }
  }

  // 5. Default — gap rhythm
  return {
    kind: 'rhythm',
    eyebrow: 'Feed rhythm',
    headline: `Feeding every ~${avgGapHr.toFixed(1)} hours`,
    body: `Based on the last ${gaps.length} feeds. Consistent rhythm is a great sign.`,
    tone: 'calm',
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  // Input
  const childId = req.query?.childId;
  if (!isUuid(childId)) {
    return res.status(400).json({ error: { message: 'childId must be a valid UUID' } });
  }

  // Rate limit
  const limited = await checkRateLimit(supabase, user.id, 'observation', RATE_TIERS);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: { message: limited.message } });
  }
  logUsage(supabase, user.id, 'observation');

  // ── 1. Check cache ──
  let cached = null;
  try {
    const { data, error } = await supabase
      .from('cmg_observations')
      .select('*')
      .eq('child_id', childId)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) cached = data;
  } catch {
    // Table missing → fall through to fresh compute
  }
  if (cached) {
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).json({
      observation: {
        kind: cached.kind,
        eyebrow: cached.eyebrow,
        headline: cached.headline,
        body: cached.body,
        tone: cached.tone,
      },
      generated_at: cached.generated_at,
      cached: true,
    });
  }

  // ── 2. Fresh compute ──
  // Verify child belongs to user (RLS would block otherwise via children select)
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('id, name, user_id')
    .eq('id', childId)
    .single();
  if (childError || !child) {
    return res.status(404).json({ error: { message: 'Child not found' } });
  }
  if (child.user_id !== user.id) {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }

  // 14d window
  const fourteenAgoIso = new Date(Date.now() - 14 * 86400000).toISOString();
  const fourteenAgoDate = fourteenAgoIso.split('T')[0];

  const [{ data: foodLogs }, { data: sleepLogs }] = await Promise.all([
    supabase.from('food_logs').select('food_type, logged_at, notes, duration_minutes')
      .eq('child_id', childId).gte('logged_at', fourteenAgoIso)
      .order('logged_at', { ascending: false }),
    supabase.from('sleep_logs').select('hours_slept, logged_date')
      .eq('child_id', childId).gte('logged_date', fourteenAgoDate)
      .order('logged_date', { ascending: false }),
  ]);

  const pattern = detectPattern({
    foodLogs: foodLogs || [],
    sleepLogs: sleepLogs || [],
    childName: child.name,
  });

  if (!pattern) {
    return res.status(200).json({ observation: null, generated_at: new Date().toISOString(), cached: false });
  }

  // ── 3. Write to cache (best-effort) ──
  const generated_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
  try {
    await supabase.from('cmg_observations').insert({
      user_id: user.id,
      child_id: childId,
      kind: pattern.kind,
      eyebrow: pattern.eyebrow,
      headline: pattern.headline,
      body: pattern.body,
      tone: pattern.tone,
      generated_at,
      expires_at,
      input_summary: {
        food_count: (foodLogs || []).length,
        sleep_count: (sleepLogs || []).length,
      },
    });
  } catch {
    // Cache miss — table doesn't exist or insert failed. Endpoint still serves.
  }

  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.status(200).json({
    observation: pattern,
    generated_at,
    cached: false,
  });
}
