import { describe, it, expect } from 'vitest';
import { evaluateLoggingAchievements } from './loggingAchievements';

const base = {
  totalLogs: 10,
  streak: 0,
  source: 'tap',
  hour: 12,
  todayTypes: new Set(['feed']),
  unlockedKeys: new Set(['first_log']),
};

describe('evaluateLoggingAchievements', () => {
  it('unlocks first_log on the very first log', () => {
    const keys = evaluateLoggingAchievements({ ...base, totalLogs: 1, unlockedKeys: new Set() });
    expect(keys).toContain('first_log');
  });

  it('never re-awards an unlocked key', () => {
    const keys = evaluateLoggingAchievements({ ...base, totalLogs: 1 });
    expect(keys).not.toContain('first_log');
  });

  it('unlocks first_voice_log only for the voice path', () => {
    expect(evaluateLoggingAchievements({ ...base, source: 'voice' })).toContain('first_voice_log');
    expect(evaluateLoggingAchievements({ ...base, source: 'repeat' })).not.toContain('first_voice_log');
  });

  it('unlocks night_hero between midnight and 5am only', () => {
    expect(evaluateLoggingAchievements({ ...base, hour: 0 })).toContain('night_hero');
    expect(evaluateLoggingAchievements({ ...base, hour: 3 })).toContain('night_hero');
    expect(evaluateLoggingAchievements({ ...base, hour: 4 })).toContain('night_hero');
    expect(evaluateLoggingAchievements({ ...base, hour: 5 })).not.toContain('night_hero');
    expect(evaluateLoggingAchievements({ ...base, hour: 23 })).not.toContain('night_hero');
  });

  it('unlocks full_picture only when feed + sleep + diaper all logged today', () => {
    expect(evaluateLoggingAchievements({ ...base, todayTypes: new Set(['feed', 'sleep']) }))
      .not.toContain('full_picture');
    expect(evaluateLoggingAchievements({ ...base, todayTypes: new Set(['feed', 'sleep', 'diaper']) }))
      .toContain('full_picture');
    expect(evaluateLoggingAchievements({ ...base, todayTypes: new Set(['feed', 'sleep', 'meds']) }))
      .not.toContain('full_picture');
  });

  it('unlocks every streak milestone the streak has passed', () => {
    const keys = evaluateLoggingAchievements({ ...base, streak: 14 });
    expect(keys).toEqual(expect.arrayContaining(['streak_3', 'streak_7', 'streak_14']));
    expect(keys).not.toContain('streak_30');
  });

  it('skips streak keys already unlocked', () => {
    const keys = evaluateLoggingAchievements({
      ...base, streak: 7, unlockedKeys: new Set(['first_log', 'streak_3']),
    });
    expect(keys).toEqual(['streak_7']);
  });

  it('unlocks logs_100 at exactly 100 lifetime logs', () => {
    expect(evaluateLoggingAchievements({ ...base, totalLogs: 99 })).not.toContain('logs_100');
    expect(evaluateLoggingAchievements({ ...base, totalLogs: 100 })).toContain('logs_100');
  });

  it('returns empty for default/garbage input', () => {
    expect(evaluateLoggingAchievements()).toEqual([]);
    expect(evaluateLoggingAchievements({ totalLogs: 0, unlockedKeys: new Set(['first_log']) })).toEqual([]);
  });

  it('can stack multiple unlocks from one log (3am voice log on day 3)', () => {
    const keys = evaluateLoggingAchievements({
      totalLogs: 12, streak: 3, source: 'voice', hour: 3,
      todayTypes: new Set(['feed']), unlockedKeys: new Set(['first_log']),
    });
    expect(keys).toEqual(expect.arrayContaining(['first_voice_log', 'night_hero', 'streak_3']));
  });
});
