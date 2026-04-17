import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { buildWeeklyInsightPrompt, DR_BLOOM_SYSTEM_PROMPT, WEEKLY_INSIGHT_ADDENDUM } from '../prompts/weeklyInsight.js';

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

export async function generateWeeklyInsight(data) {
  const prompt = buildWeeklyInsightPrompt(data);

  const message = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 600,
    system: DR_BLOOM_SYSTEM_PROMPT + WEEKLY_INSIGHT_ADDENDUM,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}
