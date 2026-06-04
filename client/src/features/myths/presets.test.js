import { describe, it, expect } from 'vitest';
import { MYTH_PRESETS, VERDICTS, getPreset } from './presets';

const VALID = new Set(['safe', 'caution', 'avoid']);

describe('myth presets', () => {
  it('ships the expected 10 audited examples', () => {
    expect(MYTH_PRESETS).toHaveLength(10);
  });

  it('has unique keys', () => {
    const keys = MYTH_PRESETS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every preset has a valid verdict and non-empty copy', () => {
    for (const p of MYTH_PRESETS) {
      expect(VALID.has(p.verdict)).toBe(true);
      expect(p.advice.trim().length).toBeGreaterThan(0);
      expect(p.reason.trim().length).toBeGreaterThan(0);
      expect(p.alternative.trim().length).toBeGreaterThan(0);
    }
  });

  it('encodes the known-dangerous ones as "avoid"', () => {
    for (const key of ['kajal', 'honey', 'cowMilk', 'earlySolids', 'earlyWater']) {
      expect(getPreset(key)?.verdict).toBe('avoid');
    }
  });

  it('exposes a verdict style for each verdict', () => {
    for (const v of VALID) {
      expect(VERDICTS[v]).toBeTruthy();
      expect(VERDICTS[v].tone).toMatch(/^#/);
    }
  });

  it('getPreset returns null for an unknown key', () => {
    expect(getPreset('nope')).toBeNull();
  });
});
