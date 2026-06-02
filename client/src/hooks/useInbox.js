import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export function useInbox() {
  const user = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState([]);
  const [doctorMessages, setDoctorMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const childIds = await getChildIds(user.id);

      // Load ALL connection requests + doctor messages in parallel
      const [connRes, msgRes] = await Promise.all([
        supabase
          .from('doctor_child_connections')
          .select(`
            id, status, initiated_by, request_message,
            doctor_display_name, doctor_specialty, doctor_id, child_id,
            pre_visit_notes, pre_visit_notes_updated_at,
            created_at, updated_at, consent_signed_at
          `)
          .in('child_id', childIds)
          .order('created_at', { ascending: false }),

        supabase
          .from('notifications')
          .select('id, type, title, body, data, sender_name, created_at, is_read')
          .eq('recipient_id', user.id)
          .eq('type', 'doctor_message')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (connRes.error) throw connRes.error;
      setRequests(connRes.data ?? []);
      setDoctorMessages(msgRes.data ?? []);
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

  const saveNotes = useCallback(async (connectionId, notes) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/api/connections/notes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ connectionId, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save notes');

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === connectionId
          ? { ...r, pre_visit_notes: notes, pre_visit_notes_updated_at: new Date().toISOString() }
          : r
      )
    );
    return json;
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return { requests, doctorMessages, loading, error, pendingCount, respond, saveNotes, refetch: fetchRequests };
}

async function getChildIds(userId) {
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('parent_id', userId);
  return (data ?? []).map((c) => c.id);
}
