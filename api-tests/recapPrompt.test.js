import { describe, it, expect } from 'vitest';
import { buildRecapPrompt, parseRecapJson } from '../api/_lib/recapPrompt.js';

const stats = {
  feeds: 18, sleepHours: 52.5, sleepSessions: 9, diapers: 12,
  daysLogged: 6, streakEnd: 6, growthLogged: true,
};

describe('buildRecapPrompt', () => {
  it('embeds the real numbers and the child name', () => {
    const p = buildRecapPrompt(stats, { name: 'Aarav' }, 'en');
    expect(p).toContain('Aarav');
    expect(p).toContain('Feeds logged: 18');
    expect(p).toContain('52.5 hours across 9 sessions');
    expect(p).toContain('6 of 7');
    expect(p).toContain('Write every field in English.');
  });

  it('switches the language instruction', () => {
    expect(buildRecapPrompt(stats, { name: 'X' }, 'ml')).toContain('Malayalam');
    expect(buildRecapPrompt(stats, { name: 'X' }, 'pa')).toContain('Punjabi');
    expect(buildRecapPrompt(stats, { name: 'X' }, 'xx')).toContain('English');
  });

  it('tolerates missing stats and name', () => {
    const p = buildRecapPrompt({}, {}, 'en');
    expect(p).toContain('Feeds logged: 0');
    expect(p).toContain('your little one');
  });
});

describe('parseRecapJson', () => {
  it('parses clean JSON', () => {
    expect(parseRecapJson('{"highlight":"A lovely week with Aarav."}')).toBe('A lovely week with Aarav.');
  });

  it('strips code fences', () => {
    expect(parseRecapJson('```json\n{"highlight":"Six days of care."}\n```')).toBe('Six days of care.');
  });

  it('extracts the object from surrounding prose', () => {
    expect(parseRecapJson('Here you go: {"highlight":"Steady rhythm."} hope it helps')).toBe('Steady rhythm.');
  });

  it('returns null for garbage / missing field / empty', () => {
    expect(parseRecapJson('not json at all')).toBeNull();
    expect(parseRecapJson('{"title":"wrong shape"}')).toBeNull();
    expect(parseRecapJson('{"highlight":""}')).toBeNull();
    expect(parseRecapJson(null)).toBeNull();
  });

  it('caps absurdly long output', () => {
    const long = parseRecapJson(`{"highlight":"${'x'.repeat(500)}"}`);
    expect(long.length).toBe(300);
  });
});
