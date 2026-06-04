import { describe, it, expect } from 'vitest';
import {
  getEmergencyNumber,
  regionFromLocale,
  regionFromTimeZone,
  numberForRegion,
} from './emergencyNumber';

describe('regionFromLocale', () => {
  it('extracts the region subtag', () => {
    expect(regionFromLocale('en-US')).toBe('US');
    expect(regionFromLocale('en-IN')).toBe('IN');
    expect(regionFromLocale('en_GB')).toBe('GB');
    expect(regionFromLocale('zh-Hans-CN')).toBe('CN');
  });
  it('returns null without a region', () => {
    expect(regionFromLocale('en')).toBeNull();
    expect(regionFromLocale('')).toBeNull();
    expect(regionFromLocale(null)).toBeNull();
  });
});

describe('regionFromTimeZone', () => {
  it('maps exact and prefix zones', () => {
    expect(regionFromTimeZone('Asia/Kolkata')).toBe('IN');
    expect(regionFromTimeZone('America/New_York')).toBe('US');
    expect(regionFromTimeZone('Australia/Sydney')).toBe('AU');
    expect(regionFromTimeZone('Europe/London')).toBe('GB');
  });
  it('returns null for unknown zones', () => {
    expect(regionFromTimeZone('Antarctica/Troll')).toBeNull();
    expect(regionFromTimeZone(null)).toBeNull();
  });
});

describe('numberForRegion', () => {
  it('uses the regional number or falls back to 112', () => {
    expect(numberForRegion('US')).toBe('911');
    expect(numberForRegion('GB')).toBe('999');
    expect(numberForRegion('AU')).toBe('000');
    expect(numberForRegion('IN')).toBe('112');   // India + EU default
    expect(numberForRegion('ZZ')).toBe('112');
    expect(numberForRegion(null)).toBe('112');
  });
});

describe('getEmergencyNumber', () => {
  it('prefers the locale region', () => {
    expect(getEmergencyNumber({ language: 'en-US' })).toEqual({ number: '911', region: 'US' });
    expect(getEmergencyNumber({ language: 'en-IN' })).toEqual({ number: '112', region: 'IN' });
    expect(getEmergencyNumber({ language: 'en-GB' })).toEqual({ number: '999', region: 'GB' });
  });
  it('falls back to timezone when the locale has no region', () => {
    expect(getEmergencyNumber({ language: 'en', timeZone: 'America/Chicago' }))
      .toEqual({ number: '911', region: 'US' });
  });
  it('falls back to 112 when nothing is known', () => {
    expect(getEmergencyNumber({ language: 'en', timeZone: 'Mars/Olympus' }))
      .toEqual({ number: '112', region: null });
  });
});
