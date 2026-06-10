import { describe, it, expect } from 'vitest';
import { consumeFeatureQuota, weekStart } from '../api/_lib/featureQuota.js';

// Minimal in-memory stand-in for the Supabase service client. Models the two
// calls consumeFeatureQuota makes: a filtered .select(...).maybeSingle() read
// and an .upsert() write into ai_feature_usage.
function makeFakeDb() {
  const store = new Map(); // key: `${user}|${feature}|${week}` -> count
  const keyOf = (f) => `${f.user_id}|${f.feature}|${f.week_start}`;
  return {
    store,
    from() {
      const filter = {};
      const api = {
        select() { return api; },
        eq(col, val) { filter[col] = val; return api; },
        async maybeSingle() {
          const k = `${filter.user_id}|${filter.feature}|${filter.week_start}`;
          return { data: store.has(k) ? { count: store.get(k) } : null };
        },
        async upsert(row) {
          store.set(keyOf(row), row.count);
          return { error: null };
        },
      };
      return api;
    },
  };
}

describe('weekStart', () => {
  it('returns a Monday-based ISO date string (UTC)', () => {
    // 2026-06-04 is a Thursday â†’ week start Monday 2026-06-01
    expect(weekStart(new Date('2026-06-04T10:00:00Z'))).toBe('2026-06-01');
    // Monday maps to itself
    expect(weekStart(new Date('2026-06-01T00:00:00Z'))).toBe('2026-06-01');
    // Sunday maps back to the prior Monday
    expect(weekStart(new Date('2026-06-07T23:59:00Z'))).toBe('2026-06-01');
  });
});

describe('consumeFeatureQuota', () => {
  it('allows up to the limit then blocks', async () => {
    const db = makeFakeDb();
    const r1 = await consumeFeatureQuota('u1', 'myth_check', 3, db);
    const r2 = await consumeFeatureQuota('u1', 'myth_check', 3, db);
    const r3 = await consumeFeatureQuota('u1', 'myth_check', 3, db);
    const r4 = await consumeFeatureQuota('u1', 'myth_check', 3, db);
    expect([r1.used, r2.used, r3.used]).toEqual([1, 2, 3]);
    expect(r1.allowed && r2.allowed && r3.allowed).toBe(true);
    expect(r4.allowed).toBe(false);
    expect(r4.used).toBe(3);
    expect(r4.limit).toBe(3);
  });

  it('keeps each feature on an independent counter', async () => {
    const db = makeFakeDb();
    await consumeFeatureQuota('u1', 'myth_check', 3, db);
    await consumeFeatureQuota('u1', 'myth_check', 3, db);
    // voice_parse is untouched by myth_check usage
    const v = await consumeFeatureQuota('u1', 'voice_parse', 5, db);
    expect(v.allowed).toBe(true);
    expect(v.used).toBe(1);
  });

  it('keeps each user separate', async () => {
    const db = makeFakeDb();
    await consumeFeatureQuota('u1', 'voice_parse', 1, db);
    const blockedForU1 = await consumeFeatureQuota('u1', 'voice_parse', 1, db);
    const freshForU2 = await consumeFeatureQuota('u2', 'voice_parse', 1, db);
    expect(blockedForU1.allowed).toBe(false);
    expect(freshForU2.allowed).toBe(true);
  });
});
