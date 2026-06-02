// Sub-5-second sleep log: clones the most recent sleep entry to today.
// Mirrors useRepeatLastFeed so the dashboard pattern is consistent.

import { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import useAuthStore from '../stores/authStore';

export function useRepeatLastSleep(childId) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [justSaved, setJustSaved] = useState(null);
  const undoTimeout = useRef(null);

  const { data: recent = [] } = useQuery({
    queryKey: ['sleep-logs-recent', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('child_id', childId)
        .order('logged_date', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!childId,
  });

  // Pull the previous day's sleep (not today's, so "repeat" feels right)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const lastSleep = recent.find(s => s.logged_date !== todayStr) || null;

  const repeat = useMutation({
    mutationFn: async () => {
      if (!lastSleep || !user) throw new Error('No sleep to repeat');
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({
          child_id: childId,
          user_id: user.id,
          logged_date: todayStr,
          hours_slept: lastSleep.hours_slept,
          notes: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newLog) => {
      qc.setQueryData(['sleep-logs-today', childId], (old = []) => [newLog, ...(old || [])]);
      qc.setQueryData(['sleep-logs-recent', childId], (old = []) => [newLog, ...(old || []).slice(0, 4)]);
      qc.invalidateQueries({ queryKey: ['sleep-logs-7d', childId] });
      setJustSaved({ id: newLog.id });
      clearTimeout(undoTimeout.current);
      undoTimeout.current = setTimeout(() => setJustSaved(null), 4000);
    },
  });

  const undo = async () => {
    if (!justSaved?.id) return;
    clearTimeout(undoTimeout.current);
    const id = justSaved.id;
    setJustSaved(null);
    qc.setQueryData(['sleep-logs-today', childId], (old = []) => (old || []).filter(s => s.id !== id));
    qc.setQueryData(['sleep-logs-recent', childId], (old = []) => (old || []).filter(s => s.id !== id));
    await supabase.from('sleep_logs').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['sleep-logs-7d', childId] });
  };

  return {
    lastSleep,
    repeat: () => repeat.mutate(),
    isRepeating: repeat.isPending,
    justSaved,
    undo,
  };
}
