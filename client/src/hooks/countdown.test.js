import { describe, it, expect } from 'vitest';
import { formatCountdown, secondsRemaining } from './useCountdown';

describe('formatCountdown', () => {
  it('shows bare seconds under a minute', () => {
    expect(formatCountdown(9)).toBe('9');
    expect(formatCountdown(0)).toBe('0');
    expect(formatCountdown(59)).toBe('59');
  });
  it('rounds up partial seconds (so a 3 s hold shows 3, not 2)', () => {
    expect(formatCountdown(2.2)).toBe('3');
    expect(formatCountdown(0.1)).toBe('1');
  });
  it('shows m:ss at a minute or more', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(125)).toBe('2:05');
    expect(formatCountdown(300)).toBe('5:00');
  });
  it('never goes negative', () => {
    expect(formatCountdown(-5)).toBe('0');
  });
});

describe('secondsRemaining', () => {
  it('counts down from a start timestamp', () => {
    expect(secondsRemaining(1000, 10, 1000)).toBe(10);
    expect(secondsRemaining(1000, 10, 4000)).toBe(7);
  });
  it('clamps to zero at and past the end', () => {
    expect(secondsRemaining(1000, 10, 11000)).toBe(0);
    expect(secondsRemaining(1000, 10, 50000)).toBe(0);
  });
});
