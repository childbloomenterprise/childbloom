import { describe, it, expect } from 'vitest';
import { resolveStep } from './data/emergencies';

describe('resolveStep', () => {
  it('falls back action → title', () => {
    expect(resolveStep({ title: 'Do the thing' }).action).toBe('Do the thing');
  });

  it('prefers an explicit action over the title', () => {
    expect(resolveStep({ title: 'T', action: 'A' }).action).toBe('A');
  });

  it('builds the spoken line from action + detail when no voice is given', () => {
    const r = resolveStep({ action: 'Push hard', body: 'In the centre of the chest' });
    expect(r.voice).toBe('Push hard. In the centre of the chest');
  });

  it('prefers an explicit voice line', () => {
    expect(resolveStep({ action: 'A', body: 'B', voice: 'the spoken version' }).voice).toBe('the spoken version');
  });

  it('normalises the optional guided fields', () => {
    const r = resolveStep({ title: 'X' });
    expect(r.seconds).toBeNull();
    expect(r.metronome).toBeNull();
    expect(r.autoAdvance).toBe(false);
    expect(r.reassure).toBeNull();
  });

  it('handles empty/missing input safely', () => {
    expect(resolveStep(null)).toEqual({ action: '', detail: '', voice: '' });
    expect(resolveStep(undefined)).toEqual({ action: '', detail: '', voice: '' });
  });
});
