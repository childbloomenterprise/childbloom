import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DR_BLOOM_SYSTEM_PROMPT, WEEKLY_INSIGHT_ADDENDUM } from '../lib/drBloomPrompt.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.split(' ')[1]);
  if (error || !user) return null;
  return user;
}

function buildPrompt(data) {
  const langMap = { en: 'English', ml: 'Malayalam', ta: 'Tamil', hi: 'Hindi', kn: 'Kannada', te: 'Telugu' };
  const langName = langMap[data.language] || 'English';
  const ageMonths = data.age_in_days ? Math.floor(data.age_in_days / 30) : null;
  const ageWeeks  = data.age_in_days ? Math.floor(data.age_in_days / 7)  : null;
  const parentName = data.parent_name || 'a loving parent';
  const childName  = data.child_name  || 'your child';

  return `IMPORTANT: Respond ENTIRELY in ${langName}. Do not use any other language.

You are Dr. Bloom writing a personal weekly letter to ${parentName} about their child ${childName}, who is ${ageWeeks ? `exactly ${ageWeeks} weeks` : ageMonths ? `${ageMonths} months` : 'an age unknown'} old.

This week's check-in data:
Weight: ${data.weight_kg || 'not recorded'} kg | Height: ${data.height_cm || 'not recorded'} cm
Mood: ${data.mood || 'not recorded'} | Sleep: ${data.sleep_hours || '?'} hrs (${data.sleep_quality || 'unknown'} quality)
Motor milestones: ${data.motor_milestone || 'none noted'} | New skills: ${data.new_skills || 'none'}
Feeding: ${data.feeding_notes || 'not recorded'}
Parent's concerns: ${data.concerns || 'none noted'}

FORMAT REQUIREMENTS — CRITICAL:
- Do NOT include "Dear ${parentName}" or "With warmth, Dr. Bloom" — the UI adds these
- Do NOT use bullet points or numbered lists — flowing paragraphs only
- Write EXACTLY 3 paragraphs, 150-180 words total

Paragraph 1: One remarkable and specific thing happening in ${childName}'s brain or body this exact week. Reference a WHO or AAP milestone naturally — not clinically. Use ${childName}'s name.

Paragraph 2: One practical activity the parent can do TODAY at home using common Indian household items. Reference Indian foods, oil massage, or traditional practices if appropriate for this age.

Paragraph 3: One honest, warm reassurance addressing the most common parental anxiety at this exact age. If the parent noted a concern ("${data.concerns || 'none'}"), address it by name. End with something that makes the parent feel seen.

Tone: Trusted family pediatrician writing a personal letter. Warm, never clinical. Cultural context: Indian family.`;
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
    const prompt = buildPrompt(req.body);
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 600,
      system: DR_BLOOM_SYSTEM_PROMPT + WEEKLY_INSIGHT_ADDENDUM,
      messages: [{ role: 'user', content: prompt }],
    });

    const insight = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    res.json({ insight });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: { message: 'Failed to generate insight' } });
  }
}
