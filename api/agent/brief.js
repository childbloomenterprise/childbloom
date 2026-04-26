/**
 * GET /api/agent/brief
 * Returns today's ChildBloom daily brief — stats + posts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data: logs, error } = await supabase
    .from('agent_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });

  const brief = logs?.find(l => l.type === 'daily_brief');
  const posts = logs?.filter(l => l.type?.startsWith('post_')) ?? [];

  return res.status(200).json({
    brief: brief?.data ?? null,
    recentPosts: posts.map(p => ({
      slot: p.data.slot,
      topic: p.data.topic,
      post: p.data.post,
      postedAt: p.created_at
    })),
    generatedAt: new Date().toISOString()
  });
}
