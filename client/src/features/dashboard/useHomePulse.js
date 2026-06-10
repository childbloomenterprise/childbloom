// useHomePulse — the data behind Home's living tiles.
// Reuses the exact query keys TodayHub (Timeline) and GrowthPage already use,
// so when both screens are visited the cache stays warm and Home costs zero
// extra network round-trips.

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import {
  timeAgoShort, computeLogStreak, logDaySet, readNapTimer, predictNextFeed,
} from '../../lib/homePulse';

export default function useHomePulse(childId) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Minute tick so "2h ago", the nap timer and the feed prediction stay live
  // while the screen is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId).eq('logged_date', todayStr)
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId).eq('logged_date', todayStr)
        .order('created_at', { ascending: false }).limit(1);
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: growthRecords = [] } = useQuery({
    queryKey: ['growth-records', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_records').select('*')
        .eq('child_id', childId)
        .order('record_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: foodLogs7d = [] } = useQuery({
    queryKey: ['food-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId).gte('logged_at', sevenAgo)
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sleepLogs7d = [] } = useQuery({
    queryKey: ['sleep-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId).gte('logged_date', sevenAgo)
        .order('logged_date', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived ──
  const lastFeed = foodLogs[0] || null;
  const lastFeedAgo = lastFeed ? timeAgoShort(lastFeed.logged_at) : null;
  const feedsToday = foodLogs.length;

  const sleepHoursToday = sleepLogs[0]?.hours_slept ?? null;

  const latestGrowth = growthRecords.length ? growthRecords[growthRecords.length - 1] : null;
  const latestWeightKg = latestGrowth?.weight_kg ?? null;

  const streak = computeLogStreak(logDaySet(foodLogs7d, sleepLogs7d));

  const napElapsedMin = readNapTimer(childId);
  const nextFeed = predictNextFeed(foodLogs7d);

  return {
    lastFeedAgo,
    feedsToday,
    sleepHoursToday,
    latestWeightKg,
    streak,
    napElapsedMin,
    nextFeed,
  };
}
