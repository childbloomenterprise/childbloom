/**
 * ChildBloom Social Media Agent
 * ─────────────────────────────
 * Runs twice daily via Vercel Cron:
 *   Morning  → 8:00 AM IST  (2:30 AM UTC)  — posts morning tweet
 *   Evening  → 6:00 PM IST  (12:30 PM UTC) — posts evening tweet + sends daily brief
 *
 * Secured with CRON_SECRET so only Vercel can trigger it.
 */

import { researchTrendingTopic } from './lib/research.js';
import { generatePost } from './lib/content.js';
import { postTweet } from './lib/twitter.js';
import { getDailyStats } from './lib/stats.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Security: only allow Vercel Cron calls (or manual calls with secret)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Determine slot: morning (before noon UTC) or evening
  const utcHour = new Date().getUTCHours();
  const slot = utcHour < 10 ? 'morning' : 'evening';

  console.log(`[Agent] Running ${slot} cron at ${new Date().toISOString()}`);

  try {
    // ── 1. MARKET RESEARCH ──────────────────────────────────────────────────
    console.log('[Agent] Researching trending topic...');
    const research = await researchTrendingTopic();
    console.log('[Agent] Topic:', research.topic);

    // ── 2. GENERATE POST ────────────────────────────────────────────────────
    console.log(`[Agent] Generating ${slot} post...`);
    const postText = await generatePost(research, slot);
    console.log('[Agent] Generated:', postText);

    // ── 3. POST TO X ────────────────────────────────────────────────────────
    const tweetResult = await postTweet(postText);

    // ── 4. DAILY BRIEF (evening run only) ───────────────────────────────────
    let stats = null;
    if (slot === 'evening') {
      console.log('[Agent] Fetching daily stats for brief...');
      stats = await getDailyStats();
      console.log('[Agent] Stats:', stats);

      // Log brief to Supabase for easy retrieval
      await supabase.from('agent_logs').insert({
        type: 'daily_brief',
        data: {
          stats,
          topic: research.topic,
          posts: { morning: null, evening: postText }
        },
        created_at: new Date().toISOString()
      });
    }

    // ── 5. LOG THIS RUN ─────────────────────────────────────────────────────
    await supabase.from('agent_logs').insert({
      type: `post_${slot}`,
      data: {
        topic: research.topic,
        post: postText,
        tweet: tweetResult,
        slot
      },
      created_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      slot,
      topic: research.topic,
      post: postText,
      tweet: tweetResult,
      ...(stats ? { stats } : {})
    });

  } catch (error) {
    console.error('[Agent] Error:', error);

    // Log the error to Supabase
    await supabase.from('agent_logs').insert({
      type: 'error',
      data: { error: error.message, slot },
      created_at: new Date().toISOString()
    }).catch(() => {});

    return res.status(500).json({ error: error.message });
  }
}
