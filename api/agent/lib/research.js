import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Researches trending topics in child development & parenting
 * Returns a topic + insight to build posts around
 */
export async function researchTrendingTopic() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a market research agent for ChildBloom — an AI-powered pediatrician app that tracks child development and gives parents real-time insights. The app's target audience is parents of children aged 0–5.

Today is ${today}. Research and identify ONE highly relevant, trending topic in child development or parenting right now. Consider:
- Seasonal health concerns (cold/flu, heat, allergies)
- Current child development milestones parents worry about
- Viral parenting conversations on social media
- New pediatric health guidance
- Back to school health prep, screen time, sleep regressions, feeding milestones, speech development, etc.

Return a JSON object with this exact structure:
{
  "topic": "Short topic name",
  "insight": "A specific, data-backed or expert-backed insight about this topic in 2 sentences",
  "angle": "How ChildBloom specifically helps with this topic",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4"]
}

Only return the JSON, nothing else.`
    }]
  });

  try {
    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return {
      topic: 'Child Development Tracking',
      insight: 'Every milestone matters. Early tracking of developmental markers helps parents and pediatricians catch concerns before they become problems.',
      angle: 'ChildBloom tracks your child\'s development daily, giving you AI-powered insights backed by pediatric science.',
      hashtags: ['#ChildDevelopment', '#Parenting', '#ChildBloom', '#AIHealth']
    };
  }
}
