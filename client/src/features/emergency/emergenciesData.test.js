import { describe, it, expect } from 'vitest';
import { EMERGENCIES, getEmergency, resolveStep } from './data/emergencies';
import { clampBpm } from '../../hooks/useMetronome';

describe('emergency data integrity', () => {
  it('has unique ids and the required protocol fields', () => {
    const ids = new Set();
    EMERGENCIES.forEach((e) => {
      expect(e.id).toBeTruthy();
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(['critical', 'urgent', 'manageable']).toContain(e.severity);
      expect(e.source).toBeTruthy();
      expect(e.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(e.steps)).toBe(true);
      expect(e.steps.length).toBeGreaterThan(0);
    });
  });

  it('resolves every step to a non-empty action and voice', () => {
    EMERGENCIES.forEach((e) => e.steps.forEach((s) => {
      const r = resolveStep(s);
      expect(r.action.length).toBeGreaterThan(0);
      expect(r.voice.length).toBeGreaterThan(0);
    }));
  });

  it('keeps every metronome bpm inside the safe CPR range (100–120)', () => {
    EMERGENCIES.forEach((e) => e.steps.forEach((s) => {
      if (s.metronome) {
        expect(s.metronome.bpm).toBeGreaterThanOrEqual(100);
        expect(s.metronome.bpm).toBeLessThanOrEqual(120);
        expect(clampBpm(s.metronome.bpm)).toBe(s.metronome.bpm); // no clamping needed
      }
    }));
  });

  it('gives both CPR protocols a metronome step', () => {
    ['infant-cpr', 'child-cpr'].forEach((id) => {
      const e = getEmergency(id);
      expect(e.steps.some((s) => s.metronome)).toBe(true);
    });
  });

  it('models the EpiPen flow as 10 guided steps with the key timers', () => {
    const epi = getEmergency('allergic-reaction');
    expect(epi.steps.length).toBe(10);
    const secs = epi.steps.map((s) => s.seconds).filter(Boolean);
    expect(secs).toContain(3);    // 3-second hold
    expect(secs).toContain(10);   // 10-second rub
    expect(secs).toContain(300);  // 5-minute second-dose wait
    expect(epi.steps.find((s) => s.seconds === 3).autoAdvance).toBe(true);
    expect(epi.steps.find((s) => s.seconds === 10).autoAdvance).toBe(true);
  });

  it('returns null for an unknown id', () => {
    expect(getEmergency('not-a-real-id')).toBeNull();
  });
});
