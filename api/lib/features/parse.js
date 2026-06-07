// POST /api/parse-log  { transcript, childAgeDays?, language? }
// Voice/typed quick-logging: turn a free-text sentence like
// "fed 10 minutes left side, then slept two hours" into a structured array of
// events the client can show in an EDITABLE confirmation sheet. This endpoint
// NEVER writes to the database — the client writes only after the parent confirms.
//
// Returns: { events: [ { type, ...fields }, ... ] }
//   feed:   { type:'feed', feed_type:'bottle'|'breast'|'formula'|'solid', amount_ml?, duration_minutes?, side?, food_name?, notes? }
//   sleep:  { type:'sleep', hours_slept?, quality?, notes? }
//   diaper: { type:'diaper', kind:'wet'|'dirty'|'both', notes? }
//   meds:   { type:'meds', name, dose?, notes? }
//
// Gating: free users get 5 voice parses/week (own ai_feature_usage bucket),
// premium unlimited. Rate-limited. Typed quick-logs & preset taps stay free and
// never hit this endpoint.

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { FAST_MODEL, corsOrigin } from '../models.js';
import { checkRateLimit, logUsage, isString, sanitizeText } from '../rateLimit.js';
import { isPremium } from '../premium.js';
import { consumeFeatureQuota } from '../featureQuota.js';
import { track } from '../posthog.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_WEEKLY_LIMIT = 5;
const MAX_TRANSCRIPT_CHARS = 500;
const MAX_EVENTS = 6;

const RATE_TIERS = [
  { limit: 6,  windowSec: 60,   message: 'Slow down — only 6 voice logs per minute.' },
  { limit: 50, windowSec: 3600, message: 'You\'ve reached 50 voice logs this hour.' },
];

const VALID_TYPES = new Set(['feed', 'sleep', 'diaper', 'meds']);
const VALID_FEED = new Set(['bottle', 'breast', 'formula', 'solid']);
const VALID_DIAPER = new Set(['wet', 'dirty', 'both']);
const VALID_SIDE = new Set(['left', 'right', 'both']);
const VALID_QUALITY = new Set(['excellent', 'good', 'okay', 'poor']);

function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

function parseEventsJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith('[') && !text.startsWith('{')) {
    const s = text.indexOf('[');
    const e = text.lastIndexOf(']');
    if (s === -1 || e <= s) return null;
    text = text.slice(s, e + 1);
  }
  let arr;
  try { arr = JSON.parse(text); } catch { return null; }
  if (!Array.isArray(arr)) arr = [arr];
  return arr;
}

// Whitelist + coerce each event so the client only ever receives clean shapes.
function sanitizeEvents(arr) {
  const out = [];
  for (const ev of arr.slice(0, MAX_EVENTS)) {
    if (!ev || !VALID_TYPES.has(ev.type)) continue;
    if (ev.type === 'feed') {
      const feed_type = VALID_FEED.has(ev.feed_type) ? ev.feed_type : 'bottle';
      out.push({
        type: 'feed',
        feed_type,
        amount_ml: clampNum(ev.amount_ml, 1, 500),
        duration_minutes: clampNum(ev.duration_minutes, 1, 240),
        side: VALID_SIDE.has(ev.side) ? ev.side : undefined,
        food_name: typeof ev.food_name === 'string' ? ev.food_name.slice(0, 80) : undefined,
        notes: typeof ev.notes === 'string' ? ev.notes.slice(0, 200) : undefined,
      });
    } else if (ev.type === 'sleep') {
      out.push({
        type: 'sleep',
        hours_slept: clampNum(ev.hours_slept, 0.1, 24),
        quality: VALID_QUALITY.has(ev.quality) ? ev.quality : undefined,
        notes: typeof ev.notes === 'string' ? ev.notes.slice(0, 200) : undefined,
      });
    } else if (ev.type === 'diaper') {
      out.push({
        type: 'diaper',
        kind: VALID_DIAPER.has(ev.kind) ? ev.kind : 'wet',
        notes: typeof ev.notes === 'string' ? ev.notes.slice(0, 200) : undefined,
      });
    } else if (ev.type === 'meds') {
      const name = typeof ev.name === 'string' ? ev.name.slice(0, 80).trim() : '';
      if (!name) continue;
      out.push({
        type: 'meds',
        name,
        dose: typeof ev.dose === 'string' ? ev.dose.slice(0, 40) : undefined,
        notes: typeof ev.notes === 'string' ? ev.notes.slice(0, 200) : undefined,
      });
    }
  }
  return out;
}

export default async function handler(req, res) {
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

  const { transcript, childAgeDays, language = 'en' } = req.body || {};
  if (!isString(transcript, { min: 1, max: MAX_TRANSCRIPT_CHARS })) {
    return res.status(400).json({ error: { message: `transcript must be 1–${MAX_TRANSCRIPT_CHARS} characters` } });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const limited = await checkRateLimit(supabase, user.id, 'parse-log', RATE_TIERS);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: { message: limited.message } });
  }
  logUsage(supabase, user.id, 'parse-log');

  const premium = await isPremium(user.id);
  if (!premium) {
    const quota = await consumeFeatureQuota(user.id, 'voice_parse', FREE_WEEKLY_LIMIT);
    if (!quota.allowed) {
      return res.status(402).json({
        error: { message: `You've used your ${quota.limit} free voice logs this week.` },
        upgrade: true,
        limit: quota.limit,
      });
    }
  }

  const safeTranscript = sanitizeText(transcript, { maxLen: MAX_TRANSCRIPT_CHARS });
  const ageNote = Number.isFinite(Number(childAgeDays))
    ? `The child is about ${Math.floor(Number(childAgeDays) / 30.44)} months old — use that to judge plausibility.`
    : '';

  const systemPrompt = `You convert a parent's spoken note about their baby into structured log events. Extract ONLY what was actually said — never invent amounts, durations or medications.

${ageNote}

Output a JSON array (0 or more events). Each event is one of:
- {"type":"feed","feed_type":"bottle|breast|formula|solid","amount_ml":<number, bottle/formula only>,"duration_minutes":<number>,"side":"left|right|both","food_name":"<solid food>"}
- {"type":"sleep","hours_slept":<number>,"quality":"excellent|good|okay|poor"}
- {"type":"diaper","kind":"wet|dirty|both"}
- {"type":"meds","name":"<medicine name>","dose":"<as said, e.g. 2.5ml>"}

RULES
- Include a field ONLY if the parent stated or clearly implied it. Omit unknown fields entirely.
- "two hours" → hours_slept 2. "ten minutes left side" → feed_type breast, duration_minutes 10, side left.
- Multiple events in one sentence → multiple array items, in the order spoken.
- If nothing loggable was said, return [].
- Return ONLY the JSON array — no prose, no code fences.`;

  try {
    const completion = await anthropic.messages.create({
      model: FAST_MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: safeTranscript }],
    });

    const raw = completion?.content?.[0]?.type === 'text' ? completion.content[0].text : '';
    const parsed = parseEventsJson(raw);
    if (!parsed) {
      track(user.id, 'voice_parse_failed', { reason: 'unparseable', language });
      return res.status(200).json({ events: [] });
    }

    const events = sanitizeEvents(parsed);
    track(user.id, 'voice_parsed', { count: events.length, is_premium: premium, language });
    return res.status(200).json({ events });
  } catch (err) {
    console.error('parse-log error:', err?.status, err?.message);
    return res.status(502).json({ error: { message: 'Could not understand that just now. Please try again or type it.' } });
  }
}
