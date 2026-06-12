// Sub-5-second feed log: clones the last feed at "now".
// Returns { lastFeed, repeat, isRepeating, undo, justSaved }
//
// Optimistic insert into React Query cache → instant feedback.
// Undo window: 4 seconds via a soft-delete (we actually delete the row from
// DB if undo is tapped within the window).

import { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import useAuthStore from '../stores/authStore';
import { useLogReward } from './useLogReward';

export function useRepeatLastFeed(childId) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { reward } = useLogReward(childId);
  const [justSaved, setJustSaved] = useState(null); // { id } | null
  const undoTimeout = useRef(null);

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['food-logs-recent', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('child_id', childId)
        .order('logged_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!childId,
  });

  const lastFeed = recentLogs[0] || null;

  const repeat = useMutation({
    mutationFn: async () => {
      if (!lastFeed || !user) throw new Error('No feed to repeat');
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();
      const payload = {
        child_id: childId,
        user_id: user.id,
        logged_date: today,
        logged_at: now,
        food_name: lastFeed.food_name || lastFeed.food_type,
        food_type: lastFeed.food_type,
        duration_minutes: lastFeed.duration_minutes,
        notes: null,
      };
      const { data, error } = await supabase
        .from('food_logs')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newLog) => {
      qc.setQueryData(['food-logs', childId], (old = []) => [newLog, ...(old || [])]);
      qc.setQueryData(['food-logs-recent', childId], (old = []) => [newLog, ...(old || []).slice(0, 4)]);
      qc.invalidateQueries({ queryKey: ['food-logs-today', childId] });
      reward({ source: 'repeat', types: ['feed'] });
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
    qc.setQueryData(['food-logs', childId], (old = []) => (old || []).filter(f => f.id !== id));
    qc.setQueryData(['food-logs-recent', childId], (old = []) => (old || []).filter(f => f.id !== id));
    await supabase.from('food_logs').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['food-logs-today', childId] });
  };

  return {
    lastFeed,
    repeat: () => repeat.mutate(),
    isRepeating: repeat.isPending,
    undo,
    justSaved,
  };
}
