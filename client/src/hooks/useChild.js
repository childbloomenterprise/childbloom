import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useChildStore from '../stores/childStore';

export function useChildren() {
  const user = useAuthStore((s) => s.user);
  const { setChildren, setSelectedChildId, selectedChildId } = useChildStore();

  const query = useQuery({
    queryKey: ['children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (query.data) {
      setChildren(query.data);
      if (!selectedChildId && query.data.length > 0) {
        setSelectedChildId(query.data[0].id);
      }
    }
  }, [query.data]);

  return query;
}

export function useSelectedChild() {
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  const children = useChildStore((s) => s.children);
  return children.find(c => c.id === selectedChildId) || children[0] || null;
}

export function useChildById(childId) {
  return useQuery({
    queryKey: ['child', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!childId,
  });
}
