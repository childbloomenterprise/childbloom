// useLogReward — the single post-save reward path for every log write.
// Petals always fire (the baseline reward); achievements and the once-a-day
// "garden watered" moment layer on top. Wire this into every place a
// feed/sleep/diaper/meds log is saved so the loop feels identical everywhere.
//
//   const { reward } = useLogReward(childId);
//   ...on save success: reward({ source: 'voice', types: ['feed'], count: 2 });

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useUiStore from '../stores/uiStore';
import { useAchievements } from './useAchievements';
import { celebrate } from '../lib/bloomBurst';
import { track } from '../lib/analytics';
import { computeLogStreak, logDaySet } from '../lib/homePulse';
import { gardenDaySet, markWateredCelebrated } from '../lib/gardenVitality';
import { evaluateLoggingAchievements } from '../lib/loggingAchievements';

// Lifetime log count across the three log tables (head-only counts, cheap).
async function fetchTotalLogs(userId) {
  const tables = ['food_logs', 'sleep_logs', 'quick_logs'];
  let total = 0;
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    total += count || 0;
  }
  return total;
}

export function useLogReward(childId) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const addToast = useUiStore((s) => s.addToast);
  const { unlockedKeys, tryUnlock } = useAchievements();
  const totalLogsRef = useRef(null); // null = not fetched yet

  const reward = useCallback(async ({ source = 'tap', types = [], count = 1, position } = {}) => {
    const now = new Date();

    // 1. Baseline reward — always, instantly, before any awaits.
    celebrate(position);
    types.forEach((type) => track('log_saved', { type, source }));

    if (!user?.id || !childId) return;

    // 2. Once-per-day garden moment.
    if (markWateredCelebrated(childId, now)) {
      addToast({ type: 'info', message: t('garden.wateredToast', 'The garden is watered for today 🌱'), duration: 4000 });
    }

    // 3. Achievements — lifetime count (lazy fetch once, then local increment).
    try {
      if (totalLogsRef.current == null) {
        totalLogsRef.current = await fetchTotalLogs(user.id);
      } else {
        totalLogsRef.current += count;
      }

      // Streak + today's types from the warm cache; the log just saved may not
      // be refetched yet, so fold it in manually.
      const food7d = qc.getQueryData(['food-logs-7d', childId]) || [];
      const sleep7d = qc.getQueryData(['sleep-logs-7d', childId]) || [];
      const days = logDaySet(food7d, sleep7d);
      gardenDaySet(qc.getQueryData(['quick-logs-today', childId]) || []).forEach((d) => days.add(d));
      days.add(format(now, 'yyyy-MM-dd'));
      const streak = computeLogStreak(days, now);

      const todayStr = format(now, 'yyyy-MM-dd');
      const todayTypes = new Set(types);
      const foodToday = qc.getQueryData(['food-logs-today', childId]) || [];
      if (foodToday.length) todayTypes.add('feed');
      const sleepToday = qc.getQueryData(['sleep-logs-today', childId]) || [];
      if (sleepToday.length) todayTypes.add('sleep');
      for (const q of qc.getQueryData(['quick-logs-today', childId]) || []) {
        if (q?.logged_date === todayStr && q?.type) todayTypes.add(q.type);
      }

      const keys = evaluateLoggingAchievements({
        totalLogs: totalLogsRef.current,
        streak,
        source,
        hour: now.getHours(),
        todayTypes,
        unlockedKeys,
      });
      for (const key of keys) await tryUnlock(key);
    } catch {
      // Rewards must never break the save path.
    }
  }, [childId, user?.id, qc, t, addToast, unlockedKeys, tryUnlock]);

  return { reward };
}
