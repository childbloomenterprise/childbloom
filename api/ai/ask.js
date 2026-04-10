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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });

  try {
    const { question, child_name, age_in_days, gender } = req.body;
    if (!question) return res.status(400).json({ error: { message: 'Question is required' } });

    const ageMonths = age_in_days ? Math.floor(age_in_days / 30) : null;
    const childContext = child_name
      ? `The parent is asking about their child "${child_name}"${ageMonths ? ` who is ${ageMonths} months old` : ''}${gender ? ` (${gender})` : ''}.`
      : 'The parent is asking a general child development question.';

    const prompt = `${childContext}\n\nParent's question: ${question}`;

    // Stream via Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
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
    // If headers not yet sent, return JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Failed to generate response' } });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}
