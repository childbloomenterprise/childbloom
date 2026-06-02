import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useAchievementStore from '../stores/achievementStore';
import { ACHIEVEMENTS } from '../lib/achievementDefs';

export function useAchievements() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const queryClient = useQueryClient();
  const showCelebration = useAchievementStore((s) => s.showCelebration);

  // All unlocked achievements for this user
  const { data: unlocked = [] } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('achievements')
        .select('achievement_key, unlocked_at')
        .eq('user_id', userId);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Dr. Bloom usage stats
  const { data: bloomStats } = useQuery({
    queryKey: ['bloom-stats', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bloom_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
    staleTime: 10_000,
  });

  const unlockedKeys = new Set(unlocked.map((a) => a.achievement_key));

  // Unlock a single achievement — no-op if already unlocked
  const tryUnlock = useCallback(
    async (key) => {
      if (!userId || unlockedKeys.has(key)) return;
      const { error } = await supabase
        .from('achievements')
        .insert({ user_id: userId, achievement_key: key });
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
        const def = ACHIEVEMENTS.find((a) => a.key === key);
        if (def) showCelebration(def);
      }
    },
    [userId, unlockedKeys, queryClient, showCelebration],
  );

  // Increment Dr. Bloom question count and return the new total
  const incrementBloomQuestions = useCallback(async () => {
    if (!userId) return 0;
    const { data, error } = await supabase.rpc('increment_bloom_questions', {
      p_user_id: userId,
    });
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['bloom-stats', userId] });
      return data ?? 1;
    }
    return (bloomStats?.questions_asked ?? 0) + 1;
  }, [userId, bloomStats, queryClient]);

  return {
    unlocked,
    unlockedKeys,
    bloomStats,
    allAchievements: ACHIEVEMENTS,
    tryUnlock,
    incrementBloomQuestions,
  };
}
