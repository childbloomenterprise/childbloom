import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export function useInbox() {
  const user = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Load ALL connection requests (pending + responded) for parent's children
      const { data, error: err } = await supabase
        .from('doctor_child_connections')
        .select(`
          id,
          status,
          initiated_by,
          request_message,
          doctor_display_name,
          doctor_specialty,
          doctor_id,
          child_id,
          created_at,
          updated_at,
          consent_signed_at
        `)
        .in('child_id', await getChildIds(user.id))
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequests(data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time: re-fetch when connections change for this parent's children
  useEffect(() => {
    if (!user?.id) return;
    fetchRequests();

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_child_connections',
        },
        () => { fetchRequests(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchRequests]);

  const respond = useCallback(async (connectionId, action) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/api/connections/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ connectionId, action }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to respond');

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === connectionId
          ? { ...r, status: action === 'approve' ? 'active' : 'declined' }
          : r
      )
    );
    return json;
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return { requests, loading, error, pendingCount, respond, refetch: fetchRequests };
}

async function getChildIds(userId) {
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('parent_id', userId);
  return (data ?? []).map((c) => c.id);
}
