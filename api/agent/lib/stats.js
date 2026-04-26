import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Pulls ChildBloom stats for the daily brief
 */
export async function getDailyStats() {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const since = yesterday.toISOString();

  // New users in last 24h
  const { data: newUsers, error: newUsersErr } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .gte('created_at', since);

  // Total users ever
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Total children tracked
  const { count: totalChildren } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true });

  // New children added in last 24h (proxy for engagement)
  const { data: newChildren } = await supabase
    .from('children')
    .select('id, created_at')
    .gte('created_at', since);

  if (newUsersErr) {
    console.error('Stats fetch error:', newUsersErr);
  }

  return {
    newUsers: newUsers?.length ?? 0,
    totalUsers: totalUsers ?? 0,
    newChildren: newChildren?.length ?? 0,
    totalChildren: totalChildren ?? 0,
    // Revenue: add Stripe integration here when ready
    revenue24h: null,
    generatedAt: new Date().toISOString()
  };
}
