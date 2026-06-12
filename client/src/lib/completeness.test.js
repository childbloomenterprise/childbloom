import { describe, it, expect } from 'vitest';
import { computeCompleteness } from './completeness';

describe('computeCompleteness', () => {
  it('scores a perfect week at 100, doctor-ready, no gaps', () => {
    const r = computeCompleteness({ daysLogged: 7, growthLogged: true, diapers: 5 });
    expect(r.score).toBe(100);
    expect(r.label).toBe('doctorReady');
    expect(r.gaps).toEqual([]);
  });

  it('scores an empty week at 0 with every gap', () => {
    const r = computeCompleteness({});
    expect(r.score).toBe(0);
    expect(r.label).toBe('justStarting');
    expect(r.gaps).toEqual(['coverage', 'growth', 'care']);
  });

  it('weights day-coverage at 60%', () => {
    const r = computeCompleteness({ daysLogged: 7, growthLogged: false, diapers: 0 });
    expect(r.score).toBe(60);
    expect(r.gaps).toEqual(['growth', 'care']);
  });

  it('credits growth 25 and care 15', () => {
    expect(computeCompleteness({ daysLogged: 0, growthLogged: true, diapers: 0 }).score).toBe(25);
    expect(computeCompleteness({ daysLogged: 0, growthLogged: false, diapers: 3 }).score).toBe(15);
  });

  it('clamps absurd inputs', () => {
    const r = computeCompleteness({ daysLogged: 99, growthLogged: true, diapers: 1 });
    expect(r.score).toBe(100);
    expect(computeCompleteness({ daysLogged: -5 }).score).toBe(0);
  });

  it('label thresholds: 55 = takingShape, 85 = doctorReady', () => {
    // 4/7 days ≈ 34 + growth 25 = 59 → takingShape
    expect(computeCompleteness({ daysLogged: 4, growthLogged: true }).label).toBe('takingShape');
    // 7/7 + growth = 85 → doctorReady
    expect(computeCompleteness({ daysLogged: 7, growthLogged: true }).label).toBe('doctorReady');
    // 3/7 ≈ 26 → justStarting
    expect(computeCompleteness({ daysLogged: 3 }).label).toBe('justStarting');
  });
});
