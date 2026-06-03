import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { FAST_MODEL, corsOrigin } from '../lib/models.js';
import { checkRateLimit, logUsage, isString, isUuid, sanitizeText } from '../lib/rateLimit.js';
import { isPremium, consumeFreeQuota } from '../lib/premium.js';
import {
  isEmergency,
  getEmergencyResponse,
  detectIntent,
  buildChildProfileFolder,
  buildDrBloomSystemPrompt,
  isMedicalTopic,
  getSuggestedQuestions,
  getAgePrecision,
} from '../lib/drBloomPrompt.js';
import { track } from '../lib/posthog.js';

const ASK_RATE_TIERS = [
  { limit: 3,   windowSec: 60,    message: 'Slow down — only 3 questions per minute. Take a breath and try again in a moment.' },
  { limit: 30,  windowSec: 3600,  message: 'You\'ve reached 30 questions this hour. Please try again in a bit.' },
  { limit: 100, windowSec: 86400, message: 'You\'ve reached 100 questions today. Please come back tomorrow.' },
];

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEM_CHARS = 2000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  // User-scoped Supabase — RLS enforced automatically
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${userToken}` } } }
  );

  const { message, childId, language = 'en', conversationHistory = [] } = req.body || {};

  // ── Input validation ──
  if (!isString(message, { min: 1, max: MAX_MESSAGE_CHARS })) {
    return res.status(400).json({ error: { message: `message must be 1–${MAX_MESSAGE_CHARS} characters` } });
  }
  if (!isUuid(childId)) {
    return res.status(400).json({ error: { message: 'childId must be a valid UUID' } });
  }
  if (typeof language !== 'string' || language.length > 8) {
    return res.status(400).json({ error: { message: 'invalid language' } });
  }
  if (!Array.isArray(conversationHistory)) {
    return res.status(400).json({ error: { message: 'conversationHistory must be an array' } });
  }

  // Truncate + sanitize conversation history before it ever reaches Anthropic.
  const safeHistory = conversationHistory
    .slice(-MAX_HISTORY_ITEMS)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: sanitizeText(m.content, { maxLen: MAX_HISTORY_ITEM_CHARS }) }));

  const safeMessage = sanitizeText(message, { maxLen: MAX_MESSAGE_CHARS });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  // ── Multi-tier rate limit: 3/min, 30/hour, 100/day ──
  const limited = await checkRateLimit(supabase, user.id, 'ask', ASK_RATE_TIERS);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: { message: limited.message } });
  }

  // Log this request (fire-and-forget — don't block the response)
  logUsage(supabase, user.id, 'ask');

  // ── Emergency check — runs before anything else, bypasses AI ──
  if (isEmergency(safeMessage)) {
    const { data: child } = await supabase
      .from('children')
      .select('name')
      .eq('id', childId)
      .single();

    track(user.id, 'dr_bloom_message_sent', { language, is_emergency: true, is_premium: false });

    return res.status(200).json({
      type: 'emergency',
      content: getEmergencyResponse(child?.name || 'your child', language),
      showDisclaimerCard: true,
      isEmergency: true,
    });
  }

  // ── Premium gate: premium = unlimited; free = 5 Dr. Bloom chats/week ──
  const premium = await isPremium(user.id);
  if (!premium) {
    const quota = await consumeFreeQuota(user.id);
    if (!quota.allowed) {
      return res.status(402).json({
        error: { message: `You've used your ${quota.limit} free Dr. Bloom chats this week.` },
        upgrade: true,
        limit: quota.limit,
      });
    }
  }

  // ── Fetch all child data in one parallel round-trip ──
  // children: try with new columns first, fall back to base columns if migration 002 not run yet
  const childPromise = supabase
    .from('children')
    .select('id, name, date_of_birth, due_date, is_pregnant, gender, birth_weight_grams, is_premature, gestational_age_at_birth, blood_group, known_allergies')
    .eq('id', childId)
    .single()
    .then(res => {
      if (res.error?.message?.includes('column')) {
        return supabase
          .from('children')
          .select('id, name, date_of_birth, due_date, is_pregnant, gender')
          .eq('id', childId)
          .single();
      }
      return res;
    });

  const [
    { data: child },
    { data: growthRecords },
    { data: foodLogs },
    { data: healthRecords },
    { data: weeklyUpdates },
  ] = await Promise.all([
    childPromise,

    supabase
      .from('growth_records')
      .select('record_date, weight_kg, height_cm, head_circumference_cm')
      .eq('child_id', childId)
      .order('record_date', { ascending: false })
      .limit(5),

    supabase
      .from('food_logs')
      .select('logged_date, meal_type, food_name, quantity, notes, food_type')
      .eq('child_id', childId)
      .order('logged_date', { ascending: false })
      .limit(7),

    supabase
      .from('health_records')
      .select('record_date, record_type, title, description, doctor_name')
      .eq('child_id', childId)
      .order('record_date', { ascending: false })
      .limit(3),

    supabase
      .from('weekly_updates')
      .select('week_date, mood, sleep_hours, sleep_quality, motor_milestone, new_skills, feeding_notes, concerns')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  // vaccinations fetched separately — table may not exist if migration 002 hasn't run yet
  let vaccinations = [];
  try {
    const { data: vacData } = await supabase
      .from('vaccinations')
      .select('vaccine_name, date_given, next_due')
      .eq('child_id', childId)
      .order('next_due', { ascending: true });
    vaccinations = vacData || [];
  } catch {
    // table not yet created — safe to ignore, Dr. Bloom works without it
  }

  if (!child) {
    return res.status(404).json({ error: { message: 'Child not found' } });
  }

  // ── Build context ──
  const profileFolder = buildChildProfileFolder({
    child,
    growthRecords: growthRecords || [],
    foodLogs: foodLogs || [],
    healthRecords: healthRecords || [],
    weeklyUpdate: weeklyUpdates?.[0] || null,
    vaccinations: vaccinations || [],
  });

  const intent = detectIntent(safeMessage);
  const ageInfo = getAgePrecision(child.date_of_birth, child.due_date, child.is_pregnant);
  const showDisclaimerCard = isMedicalTopic(safeMessage);
  const suggestedQuestions = getSuggestedQuestions(ageInfo.developmentalStage, child.name);
  const systemPrompt = buildDrBloomSystemPrompt(profileFolder, intent, language);

  // ── Stream via SSE ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  track(user.id, 'dr_bloom_message_sent', {
    language,
    intent,
    is_premium: premium,
    is_emergency: false,
    is_medical_topic: showDisclaimerCard,
    has_history: safeHistory.length > 0,
  });

  // Send metadata first
  res.write(`data: ${JSON.stringify({
    type: 'metadata',
    childName: child.name,
    intent,
    showDisclaimerCard,
    suggestedQuestions,
    ageDisplay: ageInfo.displayAge,
    developmentalStage: ageInfo.developmentalStage,
  })}\n\n`);

  const messages = [
    ...safeHistory,
    { role: 'user', content: safeMessage },
  ];

  try {
    const stream = anthropic.messages.stream({
      model: FAST_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done', suggestedQuestions })}\n\n`);
    res.end();
  } catch (err) {
    // Log full error details so Vercel logs show the root cause
    console.error('Dr. Bloom stream error:', err?.status, err?.message, JSON.stringify(err?.error ?? {}));
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Dr. Bloom is unavailable right now. Please try again in a moment.' })}\n\n`);
    res.end();
  }
}
