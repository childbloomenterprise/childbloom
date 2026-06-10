// POST /api/myth-check  { advice, childAgeDays?, language? }
// "Is this normal?" myth-buster for free-text advice not covered by the static
// presets (client-side). Returns a warm, evidence-based verdict as STRICT JSON:
//   { verdict: 'safe'|'caution'|'avoid', reason, safer_alternative }
//
// Gating: presets are always free (never hit this endpoint). Free-text gets
// 3 checks/week for free users (independent ai_feature_usage bucket), unlimited
// for premium. Rate-limited, never diagnoses, disclaimer woven in.

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { FAST_MODEL, corsOrigin } from '../models.js';
import { checkRateLimit, logUsage, isString, sanitizeText } from '../rateLimit.js';
import { isPremium } from '../premium.js';
import { consumeFeatureQuota } from '../featureQuota.js';
import { track } from '../posthog.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_WEEKLY_LIMIT = 3;
const MAX_ADVICE_CHARS = 300;

const RATE_TIERS = [
  { limit: 5,  windowSec: 60,   message: 'Slow down — only 5 checks per minute.' },
  { limit: 40, windowSec: 3600, message: 'You\'ve reached 40 checks this hour. Please try again later.' },
];

const VALID_VERDICTS = new Set(['safe', 'caution', 'avoid']);

function ageLine(childAgeDays) {
  const d = Number(childAgeDays);
  if (!Number.isFinite(d) || d < 0) return 'Child age: not specified.';
  const months = Math.floor(d / 30.44);
  if (d < 365) return `Child age: about ${months} month${months === 1 ? '' : 's'} (${d} days). Apply age-specific safety rules — e.g. no honey before 12 months, no cow\'s milk as main drink or water before 6 months.`;
  const years = Math.floor(d / 365.25);
  return `Child age: about ${years} year${years === 1 ? '' : 's'} (${d} days).`;
}

function parseVerdictJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith('{')) {
    const s = text.indexOf('{'); const e = text.lastIndexOf('}');
    if (s === -1 || e <= s) return null;
    text = text.slice(s, e + 1);
  }
  let obj;
  try { obj = JSON.parse(text); } catch { return null; }
  const verdict = String(obj?.verdict || '').toLowerCase();
  if (!VALID_VERDICTS.has(verdict)) return null;
  return {
    verdict,
    reason: typeof obj.reason === 'string' ? obj.reason.trim() : '',
    safer_alternative: typeof obj.safer_alternative === 'string' ? obj.safer_alternative.trim() : '',
  };
}

export async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const userToken = authHeader.slice(7);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${userToken}` } } }
  );

  const { advice, childAgeDays, language = 'en' } = req.body || {};
  if (!isString(advice, { min: 1, max: MAX_ADVICE_CHARS })) {
    return res.status(400).json({ error: { message: `advice must be 1–${MAX_ADVICE_CHARS} characters` } });
  }
  if (typeof language !== 'string' || language.length > 8) {
    return res.status(400).json({ error: { message: 'invalid language' } });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const limited = await checkRateLimit(supabase, user.id, 'myth-check', RATE_TIERS);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: { message: limited.message } });
  }
  logUsage(supabase, user.id, 'myth-check');

  // Premium = unlimited; free = 3 free-text checks/week (own bucket).
  const premium = await isPremium(user.id);
  if (!premium) {
    const quota = await consumeFeatureQuota(user.id, 'myth_check', FREE_WEEKLY_LIMIT);
    if (!quota.allowed) {
      return res.status(402).json({
        error: { message: `You've used your ${quota.limit} free "Is this normal?" checks this week.` },
        upgrade: true,
        limit: quota.limit,
      });
    }
  }

  const safeAdvice = sanitizeText(advice, { maxLen: MAX_ADVICE_CHARS });

  const systemPrompt = `You are Dr. Bloom, helping an Indian parent judge a piece of baby-care advice they were given (often by a relative or elder). Give a calm, evidence-based verdict — never shame the family member who suggested it.

${ageLine(childAgeDays)}

Evidence base (apply India-first): IAP 2023-2024, WHO, AAP. Key hard rules: no honey before 12 months (botulism); no kajal/kohl (lead, tear-duct blockage); no cow\'s milk as main drink before 12 months; no water or solids before ~6 months; no salt/sugar in the first year; loose cords/bangles around a baby are a strangulation risk.

Classify the advice as exactly one verdict:
- "safe": evidence-supported or harmless to follow.
- "caution": not harmful but not proven / depends / do it carefully.
- "avoid": evidence advises against it or it carries real risk.

RULES
- Warm and respectful. 2nd person. Each field ≤ 2 sentences.
- NEVER diagnose the child or name a medication/dose. If the advice is about a medical symptom, gently add that their pediatrician is the right person to confirm.
- "safer_alternative": always offer one practical, India-appropriate alternative the parent can do instead (or a safe way to keep a harmless tradition).
- No markdown, no emojis, no headings inside values.

OUTPUT FORMAT
Return ONLY a single minified JSON object, nothing else:
{"verdict":"safe|caution|avoid","reason":"...","safer_alternative":"..."}`;

  try {
    const completion = await anthropic.messages.create({
      model: FAST_MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Advice I was given: "${safeAdvice}"` }],
    });

    const raw = completion?.content?.[0]?.type === 'text' ? completion.content[0].text : '';
    const verdict = parseVerdictJson(raw);
    if (!verdict) {
      return res.status(502).json({ error: { message: 'Could not check that just now. Please try again.' } });
    }

    track(user.id, 'myth_check_run', { verdict: verdict.verdict, was_preset: false, is_premium: premium, language });
    return res.status(200).json(verdict);
  } catch (err) {
    console.error('myth-check error:', err?.status, err?.message);
    return res.status(502).json({ error: { message: 'Could not check that just now. Please try again.' } });
  }
}
