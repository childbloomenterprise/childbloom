// loggingAchievements — pure decision logic for which rhythm achievements a
// just-saved log unlocks. The hook (useLogReward) feeds it state and calls
// tryUnlock for each returned key; this module never touches React/Supabase.

export const STREAK_KEYS = { 3: 'streak_3', 7: 'streak_7', 14: 'streak_14', 30: 'streak_30' };

// args:
//   totalLogs    — lifetime log count INCLUDING the log just saved
//   streak       — current consecutive-day streak (computeLogStreak)
//   source       — 'voice' | 'tap' | 'repeat' | 'nudge' | 'timer'
//   hour         — local hour (0–23) the log was saved
//   todayTypes   — Set of types logged today INCLUDING this one ('feed'|'sleep'|'diaper'|'meds')
//   unlockedKeys — Set of already-unlocked achievement keys
export function evaluateLoggingAchievements({
  totalLogs = 0,
  streak = 0,
  source = 'tap',
  hour = 12,
  todayTypes = new Set(),
  unlockedKeys = new Set(),
} = {}) {
  const keys = [];
  const want = (key, cond) => { if (cond && !unlockedKeys.has(key)) keys.push(key); };

  want('first_log', totalLogs >= 1);
  want('first_voice_log', source === 'voice');
  want('night_hero', hour >= 0 && hour < 5);
  want('full_picture', todayTypes.has('feed') && todayTypes.has('sleep') && todayTypes.has('diaper'));

  for (const [threshold, key] of Object.entries(STREAK_KEYS)) {
    want(key, streak >= Number(threshold));
  }

  want('logs_100', totalLogs >= 100);

  return keys;
}
