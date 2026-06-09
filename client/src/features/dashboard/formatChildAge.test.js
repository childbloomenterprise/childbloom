import { describe, it, expect } from 'vitest';
import { formatChildAge } from './DashboardPage';

// Build a date-of-birth `n` whole days before now.
const dobDaysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

describe('formatChildAge', () => {
  it('returns null when no date of birth', () => {
    expect(formatChildAge(null)).toBe(null);
    expect(formatChildAge(undefined)).toBe(null);
  });

  it('returns null for a future date of birth', () => {
    expect(formatChildAge(dobDaysAgo(-5))).toBe(null);
  });

  it('says "born today" on day zero', () => {
    expect(formatChildAge(dobDaysAgo(0))).toBe('born today');
  });

  it('counts days under a week (singular/plural)', () => {
    expect(formatChildAge(dobDaysAgo(1))).toBe('1 day old');
    expect(formatChildAge(dobDaysAgo(6))).toBe('6 days old');
  });

  it('switches to weeks from 7 to 55 days', () => {
    expect(formatChildAge(dobDaysAgo(7))).toBe('1 week old');
    expect(formatChildAge(dobDaysAgo(21))).toBe('3 weeks old');
  });

  it('switches to months from ~8 weeks to under 2 years', () => {
    expect(formatChildAge(dobDaysAgo(60))).toBe('2 months old');
    expect(formatChildAge(dobDaysAgo(365))).toBe('12 months old');
  });

  it('switches to years at 2+ years', () => {
    expect(formatChildAge(dobDaysAgo(Math.round(2 * 365.25)))).toBe('2 years old');
  });

  it('adds residual months for older children', () => {
    // ~2 years 6 months
    const out = formatChildAge(dobDaysAgo(Math.round(2 * 365.25 + 6 * 30.4375)));
    expect(out).toBe('2y 6m old');
  });
});
