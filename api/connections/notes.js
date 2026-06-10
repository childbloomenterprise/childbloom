// POST /api/connections/notes
// Parent saves pre-visit notes on an active doctor connection.
// The doctor sees these in their patient profile immediately on next load.
//
// Body: { connectionId: string, notes: string }
// Auth: Bearer token (Supabase JWT for the parent).

import { createClient } from '@supabase/supabase-js';
import { isUuid } from '../_lib/rateLimit.js';

const MAX_NOTES_CHARS = 4000;

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
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server configuration error' });

  // Verify caller
  const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { connectionId, notes } = req.body || {};
  if (!isUuid(connectionId)) return res.status(400).json({ error: 'connectionId must be a valid UUID' });
  if (notes != null && (typeof notes !== 'string' || notes.length > MAX_NOTES_CHARS)) {
    return res.status(400).json({ error: `notes must be a string of at most ${MAX_NOTES_CHARS} characters` });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the connection belongs to one of this parent's children
  const { data: conn } = await admin
    .from('doctor_child_connections')
    .select('id, child_id, status')
    .eq('id', connectionId)
    .single();

  if (!conn || conn.status !== 'active') return res.status(404).json({ error: 'Active connection not found' });

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
      pre_visit_notes:            (notes ?? '').trim() || null,
      pre_visit_notes_updated_at: new Date().toISOString(),
      updated_at:                 new Date().toISOString(),
    })
    .eq('id', connectionId);

  if (updateErr) {
    console.error('[connections/notes] update failed:', updateErr.message);
    return res.status(500).json({ error: 'Could not save notes. Please try again.' });
  }
  return res.status(200).json({ ok: true });
}
