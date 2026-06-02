// Bloom moments — parent's free-text notes.
// Returns { moments, momentsByArea, isLoading, add, remove }

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

export function useBloomMoments(childId) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['bloom-moments', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloom_moments')
        .select('*')
        .eq('child_id', childId)
        .order('noticed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
    staleTime: 60_000,
  });

  // Index by area for quick filtering on the garden screen.
  const momentsByArea = useMemo(() => {
    const map = {};
    for (const m of moments) {
      if (!m.area) continue;
      map[m.area] = (map[m.area] || 0) + 1;
    }
    return map;
  }, [moments]);

  const add = useMutation({
    mutationFn: async ({ note, area }) => {
      if (!user) throw new Error('not_authed');
      const { data, error } = await supabase
        .from('bloom_moments')
        .insert({
          user_id: user.id,
          child_id: childId,
          note: note.trim(),
          area: area || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.setQueryData(['bloom-moments', childId], (old = []) => [row, ...(old || [])]);
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('bloom_moments').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData(['bloom-moments', childId], (old = []) => (old || []).filter(m => m.id !== id));
    },
  });

  return {
    moments,
    momentsByArea,
    isLoading,
    add: (payload) => add.mutate(payload),
    addAsync: (payload) => add.mutateAsync(payload),
    isAdding: add.isPending,
    remove: (id) => remove.mutate(id),
  };
}
