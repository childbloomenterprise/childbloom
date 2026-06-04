import { describe, it, expect } from 'vitest';
import { buildTriage } from './data/triage';

const byKey = (tiles) => Object.fromEntries(tiles.map((t) => [t.key, t]));

describe('buildTriage', () => {
  it('routes "not breathing" and "choking" to infant protocols under 12 months', () => {
    const k = byKey(buildTriage({ date_of_birth: '2026-01-01' }, { ageInMonths: 4 }));
    expect(k['not-breathing'].topicId).toBe('infant-cpr');
    expect(k['choking'].topicId).toBe('choking-infant');
  });

  it('routes to child protocols at 12 months and older', () => {
    const k = byKey(buildTriage({}, { ageInMonths: 18 }));
    expect(k['not-breathing'].topicId).toBe('child-cpr');
    expect(k['choking'].topicId).toBe('choking-child');
  });

  it('defaults to child protocols when the age is unknown', () => {
    const k = byKey(buildTriage(null));
    expect(k['not-breathing'].topicId).toBe('child-cpr');
    expect(k['choking'].topicId).toBe('choking-child');
  });

  it('pins the allergy tile to the very top when the child has known allergies', () => {
    const tiles = buildTriage({ known_allergies: ['peanuts'] }, { ageInMonths: 24 });
    expect(tiles[0].key).toBe('allergy');
    expect(tiles[0].pinned).toBe(true);
    expect(tiles[0].topicId).toBe('allergic-reaction');
  });

  it('does not pin the allergy tile without known allergies', () => {
    const tiles = buildTriage({ known_allergies: [] }, { ageInMonths: 24 });
    expect(tiles[0].key).not.toBe('allergy');
    expect(tiles.find((t) => t.key === 'allergy').pinned).toBe(false);
  });

  it('gives every tile a real protocol id, label and severity', () => {
    buildTriage({}, { ageInMonths: 6 }).forEach((t) => {
      expect(typeof t.topicId).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
      expect(['critical', 'urgent']).toContain(t.severity);
    });
  });
});
