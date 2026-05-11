/**
 * ChildBloom Social Media Agent
 * ─────────────────────────────
 * Runs twice daily via Vercel Cron:
 *   Morning  → 8:00 AM IST  (2:30 AM UTC)  — posts morning tweet
 *   Evening  → 6:00 PM IST  (12:30 PM UTC) — posts evening tweet + sends daily brief
 *
 * Secured with CRON_SECRET so only Vercel can trigger it.
 *
 * NOTE: lib helpers are inlined here (not in api/agent/lib/) to stay
 * within Vercel Hobby plan's 12-function limit.
 */

import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MODEL } from '../lib/models.js';

// Cron slot detection: morning slot fires at 02:30 UTC, evening at 12:30 UTC.
// 10 sits cleanly between them — see vercel.json.
const MORNING_CUTOFF_HOUR = 10;

async function logAgent(type, data) {
  const { error } = await supabase
    .from('agent_logs')
    .insert({ type, data, created_at: new Date().toISOString() });
  if (error) console.error(`[agent_logs] insert failed (type=${type}):`, error);
}

// ── SUPABASE ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── ANTHROPIC ─────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── RESEARCH ──────────────────────────────────────────────────────────────────
async function researchTrendingTopic() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
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

// ── CONTENT GENERATION ────────────────────────────────────────────────────────
async function generatePost(research, slot = 'morning') {
  const toneGuide = slot === 'morning'
    ? 'energizing and motivating — sets a positive tone for the day'
    : 'reflective and reassuring — winds down the day with warmth';

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
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

// ── TWITTER ───────────────────────────────────────────────────────────────────
async function postTweet(text) {
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!accessToken || !accessSecret) {
    console.warn('[Twitter] Access token missing — logging post instead of tweeting');
    console.log('[Twitter] Would have posted:', text);
    return { simulated: true, text };
  }

  const client = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken,
    accessSecret
  });

  try {
    const tweet = await client.v2.tweet(text);
    console.log('[Twitter] Posted tweet:', tweet.data.id);
    return { success: true, tweetId: tweet.data.id, text };
  } catch (err) {
    console.error('[Twitter] post failed:', err?.code, err?.message);
    return { success: false, error: err?.message || String(err), text };
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────────
async function getDailyStats() {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const since = yesterday.toISOString();

  const { data: newUsers, error: newUsersErr } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .gte('created_at', since);
  if (newUsersErr) {
    console.error('[Stats] newUsers query failed:', newUsersErr);
    return null;
  }

  const { count: totalUsers, error: totalUsersErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (totalUsersErr) {
    console.error('[Stats] totalUsers query failed:', totalUsersErr);
    return null;
  }

  const { count: totalChildren, error: totalChildrenErr } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true });
  if (totalChildrenErr) {
    console.error('[Stats] totalChildren query failed:', totalChildrenErr);
    return null;
  }

  const { data: newChildren, error: newChildrenErr } = await supabase
    .from('children')
    .select('id, created_at')
    .gte('created_at', since);
  if (newChildrenErr) {
    console.error('[Stats] newChildren query failed:', newChildrenErr);
    return null;
  }

  return {
    newUsers: newUsers?.length ?? 0,
    totalUsers: totalUsers ?? 0,
    newChildren: newChildren?.length ?? 0,
    totalChildren: totalChildren ?? 0,
    revenue24h: null,
    generatedAt: new Date().toISOString()
  };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const utcHour = new Date().getUTCHours();
  const slot = utcHour < MORNING_CUTOFF_HOUR ? 'morning' : 'evening';

  console.log(`[Agent] Running ${slot} cron at ${new Date().toISOString()}`);

  try {
    console.log('[Agent] Researching trending topic...');
    const research = await researchTrendingTopic();
    console.log('[Agent] Topic:', research.topic);

    console.log(`[Agent] Generating ${slot} post...`);
    const postText = await generatePost(research, slot);
    console.log('[Agent] Generated:', postText);

    const tweetResult = await postTweet(postText);

    let stats = null;
    if (slot === 'evening') {
      console.log('[Agent] Fetching daily stats for brief...');
      stats = await getDailyStats();
      console.log('[Agent] Stats:', stats);

      await logAgent('daily_brief', {
        stats,
        topic: research.topic,
        posts: { morning: null, evening: postText }
      });
    }

    await logAgent(`post_${slot}`, {
      topic: research.topic,
      post: postText,
      tweet: tweetResult,
      slot
    });

    return res.status(200).json({
      success: true, slot, topic: research.topic, post: postText, tweet: tweetResult,
      ...(stats ? { stats } : {})
    });

  } catch (error) {
    console.error('[Agent] Error:', error);
    await logAgent('error', { error: error.message, slot });
    return res.status(500).json({ error: error.message });
  }
}
