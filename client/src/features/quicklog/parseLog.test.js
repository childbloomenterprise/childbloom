import { describe, it, expect } from 'vitest';
import { eventToRow, buildFeedNotes, writeEvents } from './parseLog';

const ctx = { childId: 'c-1', userId: 'u-1', now: new Date(Date.UTC(2026, 5, 4, 8, 30, 0)) };

describe('buildFeedNotes', () => {
  it('encodes ml + side in the format feedLearning can read back', () => {
    expect(buildFeedNotes({ amount_ml: 90, side: 'left' })).toBe('90ml · side:L');
    expect(buildFeedNotes({ amount_ml: 120 })).toBe('120ml');
    expect(buildFeedNotes({ side: 'right' })).toBe('side:R');
    expect(buildFeedNotes({ side: 'both' })).toBe('both sides');
    expect(buildFeedNotes({})).toBeNull();
  });
});

describe('eventToRow', () => {
  it('maps a feed to food_logs with feed type mirrored into food_name/food_type', () => {
    const out = eventToRow({ type: 'feed', feed_type: 'bottle', amount_ml: 90, duration_minutes: 12 }, ctx);
    expect(out.table).toBe('food_logs');
    expect(out.row.food_type).toBe('bottle');
    expect(out.row.food_name).toBe('bottle');
    expect(out.row.duration_minutes).toBe(12);
    expect(out.row.notes).toBe('90ml');
    expect(out.invalidate).toContainEqual(['food-logs-today', 'c-1']);
  });

  it('maps a sleep to sleep_logs and never writes hours_slept <= 0 (NOT NULL column)', () => {
    const ok = eventToRow({ type: 'sleep', hours_slept: 2, quality: 'good' }, ctx);
    expect(ok.table).toBe('sleep_logs');
    expect(ok.row.hours_slept).toBe(2);
    expect(ok.row.notes).toBe('quality: good');

    const missing = eventToRow({ type: 'sleep' }, ctx);
    expect(missing.row.hours_slept).toBe(1); // safe default, satisfies NOT NULL
  });

  it('maps diaper + meds into quick_logs with a jsonb payload', () => {
    const diaper = eventToRow({ type: 'diaper', kind: 'dirty' }, ctx);
    expect(diaper.table).toBe('quick_logs');
    expect(diaper.row.type).toBe('diaper');
    expect(diaper.row.data).toEqual({ kind: 'dirty' });

    const meds = eventToRow({ type: 'meds', name: 'Paracetamol', dose: '2.5ml' }, ctx);
    expect(meds.table).toBe('quick_logs');
    expect(meds.row.data).toEqual({ name: 'Paracetamol', dose: '2.5ml' });
  });

  it('drops a meds event with no name, and unknown types', () => {
    expect(eventToRow({ type: 'meds', name: '   ' }, ctx)).toBeNull();
    expect(eventToRow({ type: 'bogus' }, ctx)).toBeNull();
  });
});

describe('writeEvents', () => {
  it('inserts each event into the right table and de-dupes invalidate keys', async () => {
    const inserts = [];
    const supabase = {
      from(table) {
        return { insert: async (row) => { inserts.push({ table, row }); return { error: null }; } };
      },
    };
    const events = [
      { type: 'feed', feed_type: 'breast', duration_minutes: 10, side: 'left' },
      { type: 'diaper', kind: 'wet' },
      { type: 'meds', name: 'Crocin' },
    ];
    const { saved, invalidateKeys } = await writeEvents(events, { supabase, childId: 'c-1', userId: 'u-1' });
    expect(saved).toBe(3);
    expect(inserts.map((i) => i.table)).toEqual(['food_logs', 'quick_logs', 'quick_logs']);
    // quick-logs-today appears once despite two quick_logs inserts
    const keyStrings = invalidateKeys.map((k) => JSON.stringify(k));
    expect(keyStrings.filter((k) => k.includes('quick-logs-today'))).toHaveLength(1);
  });

  it('throws if Supabase returns an error', async () => {
    const supabase = { from: () => ({ insert: async () => ({ error: new Error('boom') }) }) };
    await expect(
      writeEvents([{ type: 'diaper', kind: 'wet' }], { supabase, childId: 'c-1', userId: 'u-1' })
    ).rejects.toThrow('boom');
  });
});
