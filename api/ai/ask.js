import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DR_BLOOM_SYSTEM_PROMPT } from '../lib/drBloomPrompt.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.split(' ')[1]);
  if (error || !user) return null;
  return user;
}

// Fetch this child's recent records to give Dr. Bloom real context
async function fetchChildRecords(userId, childId) {
  // Verify child belongs to this user
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .eq('user_id', userId)
    .single();

  if (!child) return null;

  const [growthRes, foodRes, healthRes, weeklyRes] = await Promise.all([
    supabase.from('growth_records').select('*').eq('child_id', childId).order('record_date', { ascending: false }).limit(1),
    supabase.from('food_logs').select('*').eq('child_id', childId).order('log_date', { ascending: false }).limit(7),
    supabase.from('health_records').select('*').eq('child_id', childId).order('record_date', { ascending: false }).limit(3),
    supabase.from('weekly_updates').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1),
  ]);

  const latestGrowth = growthRes.data?.[0];
  const recentFoods  = foodRes.data  || [];
  const recentHealth = healthRes.data || [];
  const latestWeekly = weeklyRes.data?.[0];

  const lines = [];

  if (latestGrowth) {
    lines.push(`Latest measurements (${latestGrowth.record_date}): weight ${latestGrowth.weight_kg ?? 'unknown'}kg, height ${latestGrowth.height_cm ?? 'unknown'}cm${latestGrowth.head_circumference_cm ? `, head circumference ${latestGrowth.head_circumference_cm}cm` : ''}.`);
  }

  if (recentFoods.length > 0) {
    const foodList = recentFoods.map(f => `${f.food_name} (${f.meal_type})`).join(', ');
    lines.push(`Recently eaten: ${foodList}.`);
    const reactions = recentFoods.filter(f => f.reaction).map(f => `${f.food_name}: ${f.reaction}`);
    if (reactions.length > 0) lines.push(`Food reactions noted: ${reactions.join('; ')}.`);
  }

  if (recentHealth.length > 0) {
    const healthList = recentHealth.map(h => `${h.record_type} — ${h.title} (${h.record_date})`).join('; ');
    lines.push(`Recent health records: ${healthList}.`);
  }

  if (latestWeekly) {
    const w = latestWeekly;
    const parts = [];
    if (w.weight_kg)      parts.push(`weight ${w.weight_kg}kg`);
    if (w.mood)           parts.push(`mood: ${w.mood}`);
    if (w.sleep_hours)    parts.push(`sleep: ${w.sleep_hours}hrs (${w.sleep_quality || 'unknown quality'})`);
    if (w.motor_milestone) parts.push(`motor milestone: ${w.motor_milestone}`);
    if (w.new_skills)     parts.push(`new skills: ${w.new_skills}`);
    if (w.feeding_notes)  parts.push(`feeding: ${w.feeding_notes}`);
    if (w.concerns)       parts.push(`parent's concern: ${w.concerns}`);
    if (parts.length > 0) lines.push(`Most recent weekly check-in: ${parts.join(', ')}.`);
  }

  return lines.length > 0 ? lines.join('\n') : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });

  try {
    const { question, child_name, child_id, age_in_days, gender, language = 'en' } = req.body;
    if (!question) return res.status(400).json({ error: { message: 'Question is required' } });

    const langMap = { en: 'English', ml: 'Malayalam', ta: 'Tamil', hi: 'Hindi', kn: 'Kannada', te: 'Telugu' };
    const langName = langMap[language] || 'English';

    const ageMonths = age_in_days ? Math.floor(age_in_days / 30) : null;
    const childContext = child_name
      ? `The parent is asking about their child "${child_name}"${ageMonths != null ? ` who is ${ageMonths} months old` : ''}${gender ? ` (${gender})` : ''}.`
      : 'The parent is asking a general child development question.';

    // Fetch real records if we have a child_id
    let recordsContext = '';
    if (child_id) {
      const records = await fetchChildRecords(user.id, child_id);
      if (records) {
        recordsContext = `\n\nThis child's actual recorded data:\n${records}`;
      }
    }

    const prompt = `IMPORTANT: Respond ENTIRELY in ${langName}. Do not use any other language.\n\n${childContext}${recordsContext}\n\nParent's question: ${question}`;

    // Stream via Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: DR_BLOOM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('AI stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Failed to generate response' } });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}
