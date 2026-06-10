import { describe, it, expect } from 'vitest';
import { buildDailyBriefPrompt, parseBriefJson } from '../api/lib/dailyBriefPrompt.js';

function sampleData(overrides = {}) {
  // ~5 months old
  const dob = new Date(Date.now() - 150 * 86400000).toISOString().slice(0, 10);
  return {
    child: { name: 'Aanya', date_of_birth: dob, gender: 'female', known_allergies: [] },
    growthRecords: [],
    foodLogs: [],
    healthRecords: [],
    weeklyUpdate: null,
    vaccinations: [],
    ...overrides,
  };
}

describe('buildDailyBriefPrompt', () => {
  it('includes the child name, the JSON contract and all four fields', () => {
    const p = buildDailyBriefPrompt(sampleData(), 'en');
    expect(p).toContain('Aanya');
    expect(p).toContain('JSON');
    expect(p).toContain('"title"');
    expect(p).toContain('"expect_this_week"');
    expect(p).toContain('"tip"');
    expect(p).toContain('"reassurance"');
  });

  it('embeds the Child Profile Folder context and an age', () => {
    const p = buildDailyBriefPrompt(sampleData(), 'en');
    expect(p).toContain('CHILD PROFILE FOLDER');
    expect(p).toMatch(/months/); // age precision rendered
  });

  it('switches the language instruction per language', () => {
    expect(buildDailyBriefPrompt(sampleData(), 'hi')).toMatch(/Hindi/);
    expect(buildDailyBriefPrompt(sampleData(), 'ml')).toMatch(/Malayalam/);
    // unknown lang falls back to English
    expect(buildDailyBriefPrompt(sampleData(), 'zz')).toMatch(/English/);
  });

  it('keeps the India-first safety rules', () => {
    const p = buildDailyBriefPrompt(sampleData(), 'en');
    expect(p.toLowerCase()).toContain('honey');
    expect(p.toLowerCase()).toContain('kajal');
  });
});

describe('parseBriefJson', () => {
  it('parses a clean minified object', () => {
    const out = parseBriefJson('{"title":"Hi Aanya","expect_this_week":"a","tip":"b","reassurance":"c"}');
    expect(out).toEqual({ title: 'Hi Aanya', expect_this_week: 'a', tip: 'b', reassurance: 'c' });
  });

  it('tolerates code fences and surrounding prose', () => {
    const fenced = '```json\n{"title":"T","tip":"x"}\n```';
    expect(parseBriefJson(fenced)?.title).toBe('T');
    const noisy = 'Here you go: {"title":"T2"} hope that helps';
    expect(parseBriefJson(noisy)?.title).toBe('T2');
  });

  it('defaults missing optional fields to empty strings', () => {
    const out = parseBriefJson('{"title":"Only title"}');
    expect(out).toEqual({ title: 'Only title', expect_this_week: '', tip: '', reassurance: '' });
  });

  it('returns null for missing title, bad JSON or non-strings', () => {
    expect(parseBriefJson('{"tip":"no title"}')).toBeNull();
    expect(parseBriefJson('not json at all')).toBeNull();
    expect(parseBriefJson('{"title":"  "}')).toBeNull();
    expect(parseBriefJson(null)).toBeNull();
    expect(parseBriefJson(42)).toBeNull();
  });
});
