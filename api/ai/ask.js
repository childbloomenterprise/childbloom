import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  const { message, childId, language = 'en', conversationHistory = [] } = req.body;

  if (!message || !childId) {
    return res.status(400).json({ error: { message: 'message and childId are required' } });
  }

  // ── Emergency check — runs before anything else, bypasses AI ──
  if (isEmergency(message)) {
    const { data: child } = await supabase
      .from('children')
      .select('name')
      .eq('id', childId)
      .single();

    return res.status(200).json({
      type: 'emergency',
      content: getEmergencyResponse(child?.name || 'your child', language),
      showDisclaimerCard: true,
      isEmergency: true,
    });
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
      .select('log_date, meal_type, food_name, reaction')
      .eq('child_id', childId)
      .order('log_date', { ascending: false })
      .limit(7),

    supabase
      .from('health_records')
      .select('record_date, record_type, title, notes')
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

  const intent = detectIntent(message);
  const ageInfo = getAgePrecision(child.date_of_birth, child.due_date, child.is_pregnant);
  const showDisclaimerCard = isMedicalTopic(message);
  const suggestedQuestions = getSuggestedQuestions(ageInfo.developmentalStage, child.name);
  const systemPrompt = buildDrBloomSystemPrompt(profileFolder, intent, language);

  // ── Stream via SSE ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

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
    ...conversationHistory.slice(-10),
    { role: 'user', content: message },
  ];

  try {
    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
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
    console.error('Dr. Bloom stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Dr. Bloom is unavailable right now. Please try again in a moment.' })}\n\n`);
    res.end();
  }
}
