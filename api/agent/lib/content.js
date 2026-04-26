import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generates a social media post based on research
 * @param {Object} research - from researchTrendingTopic()
 * @param {'morning' | 'evening'} slot - which posting slot
 */
export async function generatePost(research, slot = 'morning') {

  const toneGuide = slot === 'morning'
    ? 'energizing and motivating — sets a positive tone for the day'
    : 'reflective and reassuring — winds down the day with warmth';

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are the social media voice for ChildBloom — an AI-powered pediatrician app that tracks child development for parents.

Brand voice: Inspirational yet professional. Warm, trustworthy, science-backed. Like a best friend who's also a pediatrician.
Audience: Parents of children 0–5 years old.
Tone for this post: ${toneGuide}

Topic to write about:
- Topic: ${research.topic}
- Insight: ${research.insight}
- ChildBloom angle: ${research.angle}
- Hashtags to use: ${research.hashtags.join(' ')}

Write ONE X (Twitter) post. Rules:
- Maximum 240 characters (leave room for link)
- NO generic opener like "Hey parents!" or "Did you know?"
- Lead with the insight or a powerful statement
- End with a subtle nod to ChildBloom or a CTA
- Include 2-3 of the provided hashtags at the end
- Sound human, not corporate

Return ONLY the tweet text, nothing else.`
    }]
  });

  return response.content[0].text.trim();
}

/**
 * Generates both morning and evening posts for the day
 */
export async function generateDailyPosts(research) {
  const [morning, evening] = await Promise.all([
    generatePost(research, 'morning'),
    generatePost(research, 'evening')
  ]);
  return { morning, evening };
}
