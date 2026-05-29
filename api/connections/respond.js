// POST /api/connections/respond
// Parent approves or declines a doctor connection request.
//
// Body: { connectionId: string, action: 'approve' | 'decline' }
//
// Auth: Bearer token (Supabase JWT for the parent).
// Security: only updates connections where the child's parent_id matches auth.uid().

import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN || 'https://childbloom-pi.vercel.app',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify the caller is an authenticated ChildBloom parent
  const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { connectionId, action } = req.body || {};
  if (!connectionId || !['approve', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'connectionId and action (approve|decline) required' });
  }

  const newStatus = action === 'approve' ? 'active' : 'declined';

  // Use service role to update — RLS would also allow this, but service role
  // lets us verify ownership server-side and gives clearer error messages.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the connection belongs to one of this parent's children
  const { data: conn, error: fetchErr } = await admin
    .from('doctor_child_connections')
    .select('id, status, child_id')
    .eq('id', connectionId)
    .single();

  if (fetchErr || !conn) return res.status(404).json({ error: 'Connection not found' });
  if (conn.status !== 'pending') {
    return res.status(400).json({ error: `Connection is already ${conn.status}` });
  }

  // Verify ownership
  const { data: child } = await admin
    .from('children')
    .select('id')
    .eq('id', conn.child_id)
    .eq('parent_id', user.id)
    .single();

  if (!child) return res.status(403).json({ error: 'Forbidden' });

  const { error: updateErr } = await admin
    .from('doctor_child_connections')
    .update({
      status:     newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'active' ? { consent_signed_at: new Date().toISOString() } : {}),
    })
    .eq('id', connectionId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // Mark the related notification as read
  await admin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('type', 'connection_request')
    .contains('data', { child_id: conn.child_id });

  return res.status(200).json({ ok: true, status: newStatus });
}
