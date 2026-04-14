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
  const ageMonths = data.age_in_days ? Math.floor(data.age_in_days / 30) : null;
  return `You are Dr. Bloom, an experienced Indian pediatrician reviewing this child's weekly check-in. Based on WHO and IAP guidelines, provide a personalised, clinically-grounded weekly insight.

Child: ${data.child_name || 'Child'}, ${ageMonths ? `${ageMonths} months old` : 'age unknown'}
Weight: ${data.weight_kg || 'not recorded'} kg | Height: ${data.height_cm || 'not recorded'} cm
Mood: ${data.mood || 'not recorded'} | Sleep: ${data.sleep_hours || '?'} hrs (${data.sleep_quality || 'unknown'})
Milestones: ${data.motor_milestone || 'none noted'} | New skills: ${data.new_skills || 'none'}
Feeding: ${data.feeding_notes || 'not recorded'}
Concerns: ${data.concerns || 'none'}

Write 3 focused paragraphs (~120 words total):
1. A specific, clinical observation about the child's development at this age — reference developmental milestones expected at this exact age
2. One concrete, practical suggestion using Indian foods, routines, or customs appropriate for this age (e.g. ragi porridge, dal water, oil massage, outdoor play)
3. Address any concerns directly with honest guidance; if everything looks healthy, give one proactive tip for the week ahead

Tone: warm but clinically confident — like a trusted family doctor, not a generic wellness app.`;
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
