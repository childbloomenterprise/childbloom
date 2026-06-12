// Vercel cron handler — runs at 02:30 and 12:30 UTC daily (see vercel.json).
//  • 02:30 UTC ≈ 08:00 IST (morning) → generates the Daily Bloom Brief.
//  • Both runs also flag weekly-summary-pending users.
//
// The two daily runs mean: the morning run writes most briefs; the second run
// is a safety net for children added after the morning run (or whose generation
// failed). One brief per child per IST day is guaranteed by the unique
// (child_id, brief_date) constraint plus the "no brief yet today" check.

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { FAST_MODEL } from '../_lib/models.js';
import { buildDailyBriefPrompt, parseBriefJson } from '../_lib/dailyBriefPrompt.js';
import { buildRecapPrompt, parseRecapJson } from '../_lib/recapPrompt.js';
import { insertNotification, alreadyNotifiedToday } from '../_lib/notify.js';
import {
  istDayStr, computeStreakFromDays, isEveningRunIST, shouldNudgeStreak,
  isMondayIST, lastWeekStartIST,
} from '../_lib/streak.js';
import { track } from '../_lib/posthog.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Keep each cron invocation well within the serverless time budget — Claude
// calls are sequential and fail-soft, so we cap how many briefs one run writes.
const BRIEF_BATCH_LIMIT = 12;
const SUPPORTED_LANGS = new Set(['en', 'hi', 'ml', 'ta', 'te', 'pa']);

// India Standard Time date (UTC+5:30) as YYYY-MM-DD — the brief's "today".
function istDateStr(d = new Date()) {
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  // CRON_SECRET guard — Vercel sends this automatically for cron invocations.
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const ranAt = new Date().toISOString();
  let pendingSummaries = 0;
  let briefsGenerated = 0;
  let streakNudges = 0;
  let recapsWritten = 0;

  // ── Weekly-summary pending detection (unchanged) ──────────────────────────
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: pending, error } = await supabase
      .from('weekly_updates')
      .select('child_id, user_id')
      .gte('created_at', sevenDaysAgo)
      .not('child_id', 'in',
        supabase
          .from('weekly_summaries')
          .select('child_id')
          .eq('week_start_date', weekStartStr)
      );

    if (error) {
      console.error('[cron] weekly-summary query error:', error);
    } else {
      pendingSummaries = (pending || []).length;
    }
  } catch (err) {
    console.error('[cron] weekly-summary step error:', err);
  }

  // ── Daily Bloom Brief generation ──────────────────────────────────────────
  try {
    briefsGenerated = await generateDailyBriefs(supabase);
  } catch (err) {
    console.error('[cron] daily-brief step error:', err);
  }

  // ── Streak-at-risk nudges (evening run only — parent can still log) ───────
  try {
    if (isEveningRunIST()) {
      streakNudges = await sendStreakRiskNudges(supabase);
    }
  } catch (err) {
    console.error('[cron] streak-nudge step error:', err);
  }

  // ── Weekly Bloom Recap (Monday runs; second run is the safety net) ────────
  try {
    if (isMondayIST()) {
      recapsWritten = await generateWeeklyRecaps(supabase);
    }
  } catch (err) {
    console.error('[cron] weekly-recap step error:', err);
  }

  console.log(`[cron] ${ranAt}: ${pendingSummaries} pending summaries, ${briefsGenerated} briefs, ${streakNudges} streak nudges, ${recapsWritten} recaps`);
  return res.status(200).json({
    ok: true,
    ran_at: ranAt,
    pending_summaries: pendingSummaries,
    briefs_generated: briefsGenerated,
    streak_nudges: streakNudges,
    recaps_written: recapsWritten,
  });
}

// ── Agent step: defend live streaks ─────────────────────────────────────────
// For every active child, look at the last 8 IST days of logs. If the streak
// is ≥3 and nothing is logged today, write ONE in-app notification (deduped
// on data.date across the two daily runs). No Claude calls — cheap.
const STREAK_BATCH_LIMIT = 50;

async function sendStreakRiskNudges(supabase) {
  const today = istDayStr();
  const eightAgo = istDayStr(new Date(), 8);

  const { data: children, error } = await supabase
    .from('children')
    .select('id, user_id, name')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)
    .limit(200);
  if (error || !children?.length) return 0;

  const ids = children.map((c) => c.id);
  const [{ data: food }, { data: sleep }, { data: quick }] = await Promise.all([
    supabase.from('food_logs').select('child_id, logged_date').in('child_id', ids).gte('logged_date', eightAgo),
    supabase.from('sleep_logs').select('child_id, logged_date').in('child_id', ids).gte('logged_date', eightAgo),
    supabase.from('quick_logs').select('child_id, logged_date').in('child_id', ids).gte('logged_date', eightAgo),
  ]);

  const daysByChild = new Map();
  for (const row of [...(food || []), ...(sleep || []), ...(quick || [])]) {
    if (!row?.logged_date) continue;
    if (!daysByChild.has(row.child_id)) daysByChild.set(row.child_id, new Set());
    daysByChild.get(row.child_id).add(row.logged_date);
  }

  let sent = 0;
  for (const child of children) {
    if (sent >= STREAK_BATCH_LIMIT) break;
    try {
      const days = daysByChild.get(child.id) || new Set();
      const loggedToday = days.has(today);
      const streak = computeStreakFromDays(days);
      if (!shouldNudgeStreak({ streak, loggedToday })) continue;

      const dup = await alreadyNotifiedToday(supabase, {
        recipientId: child.user_id, type: 'streak_risk', date: today,
      });
      if (dup) continue;

      const { delivered } = await insertNotification(supabase, {
        recipientId: child.user_id,
        type: 'streak_risk',
        title: `🌱 ${streak}-day rhythm — one log keeps it alive`,
        body: `${child.name || 'Your little one'}'s garden hasn't been watered today. A single feed, nap or diaper log keeps the ${streak}-day streak going.`,
        data: { child_id: child.id, date: today, streak },
      });
      if (delivered) {
        sent += 1;
        track(child.user_id, 'streak_nudge_sent', { streak });
      }
    } catch (err) {
      console.error(`[cron] streak nudge error for child ${child.id}:`, err?.message || err);
    }
  }
  return sent;
}

// ── Agent step: weekly Bloom Recap ──────────────────────────────────────────
// Monday runs only. Aggregates last week's logs per child, asks Claude for a
// one-line highlight in the parent's language, upserts weekly_recap, notifies.
const RECAP_BATCH_LIMIT = 10;

async function generateWeeklyRecaps(supabase) {
  const weekStart = lastWeekStartIST(); // last Monday (IST)
  const weekEndExclusive = new Date(Date.parse(`${weekStart}T00:00:00Z`) + 7 * 86400000)
    .toISOString().slice(0, 10); // this Monday — [weekStart, weekEndExclusive)

  const { data: children, error } = await supabase
    .from('children')
    .select('id, user_id, name')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)
    .limit(200);
  if (error || !children?.length) return 0;

  const ids = children.map((c) => c.id);
  const { data: existing } = await supabase
    .from('weekly_recap')
    .select('child_id')
    .eq('week_start', weekStart)
    .in('child_id', ids);
  const have = new Set((existing || []).map((r) => r.child_id));

  const [{ data: food }, { data: sleep }, { data: quick }, { data: growth }] = await Promise.all([
    supabase.from('food_logs').select('child_id, logged_date').in('child_id', ids).gte('logged_date', weekStart).lt('logged_date', weekEndExclusive),
    supabase.from('sleep_logs').select('child_id, logged_date, hours_slept').in('child_id', ids).gte('logged_date', weekStart).lt('logged_date', weekEndExclusive),
    supabase.from('quick_logs').select('child_id, logged_date').in('child_id', ids).gte('logged_date', weekStart).lt('logged_date', weekEndExclusive),
    supabase.from('growth_records').select('child_id').in('child_id', ids).gte('record_date', weekStart).lt('record_date', weekEndExclusive),
  ]);

  const byChild = (rows) => {
    const m = new Map();
    for (const r of rows || []) {
      if (!m.has(r.child_id)) m.set(r.child_id, []);
      m.get(r.child_id).push(r);
    }
    return m;
  };
  const foodBy = byChild(food); const sleepBy = byChild(sleep);
  const quickBy = byChild(quick); const growthBy = byChild(growth);

  // Skip children with zero activity AND no prior recap — nothing to say.
  const todo = children
    .filter((c) => !have.has(c.id))
    .filter((c) => (foodBy.get(c.id)?.length || sleepBy.get(c.id)?.length || quickBy.get(c.id)?.length))
    .slice(0, RECAP_BATCH_LIMIT);
  if (!todo.length) return 0;

  const userIds = [...new Set(todo.map((c) => c.user_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, language').in('id', userIds);
  const langByUser = new Map((profiles || []).map((p) => [p.id, p.language]));

  let written = 0;
  for (const child of todo) {
    try {
      const f = foodBy.get(child.id) || [];
      const s = sleepBy.get(child.id) || [];
      const q = quickBy.get(child.id) || [];
      const dayset = new Set([...f, ...s, ...q].map((r) => r.logged_date).filter(Boolean));
      const weekEndDate = new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + 6.5 * 86400000);

      const stats = {
        feeds: f.length,
        sleepSessions: s.length,
        sleepHours: Math.round(s.reduce((sum, r) => sum + (Number(r.hours_slept) || 0), 0) * 10) / 10,
        diapers: q.length,
        daysLogged: dayset.size,
        streakEnd: computeStreakFromDays(dayset, weekEndDate),
        growthLogged: (growthBy.get(child.id) || []).length > 0,
      };

      const lang = normalizeLang(langByUser.get(child.user_id));
      let highlight = null;
      try {
        const completion = await anthropic.messages.create({
          model: FAST_MODEL,
          max_tokens: 200,
          system: buildRecapPrompt(stats, child, lang),
          messages: [{ role: 'user', content: 'Write the highlight as JSON.' }],
        });
        const raw = completion?.content?.[0]?.type === 'text' ? completion.content[0].text : '';
        highlight = parseRecapJson(raw);
      } catch (err) {
        console.error(`[cron] recap highlight error for child ${child.id}:`, err?.message || err);
        // stats-only recap still ships — the card works without the line
      }

      const { error: insErr } = await supabase
        .from('weekly_recap')
        .upsert({
          child_id: child.id,
          user_id: child.user_id,
          week_start: weekStart,
          stats,
          highlight,
          lang,
        }, { onConflict: 'child_id,week_start' });
      if (insErr) {
        console.error(`[cron] recap insert failed for child ${child.id}:`, insErr.message);
        continue;
      }

      written += 1;
      track(child.user_id, 'weekly_recap_generated', { lang, daysLogged: stats.daysLogged });

      await insertNotification(supabase, {
        recipientId: child.user_id,
        type: 'recap_ready',
        title: `${child.name || 'Your little one'}'s week in bloom is ready`,
        body: 'Last week\'s recap — the numbers, the streak, and a line worth sharing.',
        data: { child_id: child.id, week_start: weekStart, date: istDayStr() },
      });
    } catch (err) {
      console.error(`[cron] recap error for child ${child.id}:`, err?.message || err);
    }
  }
  return written;
}

// Generate today's brief for active children that don't have one yet.
// Returns the number of briefs written. Fail-soft per child.
async function generateDailyBriefs(supabase) {
  const briefDate = istDateStr();

  // Active children with a known birthday (skip pregnancy-only profiles).
  const { data: children, error: childErr } = await supabase
    .from('children')
    .select('id, user_id, name, date_of_birth, due_date, is_pregnant, gender, birth_weight_grams, is_premature, gestational_age_at_birth, blood_group, known_allergies')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)
    .order('created_at', { ascending: true })
    .limit(200);

  if (childErr) {
    console.error('[cron] children query error:', childErr);
    return 0;
  }
  if (!children?.length) return 0;

  // Which of these already have today's brief? One query, then filter.
  const ids = children.map((c) => c.id);
  const { data: existing } = await supabase
    .from('daily_brief')
    .select('child_id')
    .eq('brief_date', briefDate)
    .in('child_id', ids);
  const haveBrief = new Set((existing || []).map((r) => r.child_id));

  const todo = children.filter((c) => !haveBrief.has(c.id)).slice(0, BRIEF_BATCH_LIMIT);
  if (!todo.length) return 0;

  // Parent language map (profiles.language), default 'en'.
  const userIds = [...new Set(todo.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, language')
    .in('id', userIds);
  const langByUser = new Map((profiles || []).map((p) => [p.id, p.language]));

  let written = 0;
  for (const child of todo) {
    try {
      const lang = normalizeLang(langByUser.get(child.user_id));
      const data = await fetchChildContext(supabase, child);
      const systemPrompt = buildDailyBriefPrompt(data, lang);

      const completion = await anthropic.messages.create({
        model: FAST_MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: "Write today's Bloom Brief as JSON." }],
      });

      const raw = completion?.content?.[0]?.type === 'text' ? completion.content[0].text : '';
      const brief = parseBriefJson(raw);
      if (!brief) {
        console.error(`[cron] brief parse failed for child ${child.id}`);
        continue;
      }

      const { error: insErr } = await supabase
        .from('daily_brief')
        .upsert(
          {
            child_id: child.id,
            user_id: child.user_id,
            brief_date: briefDate,
            title: brief.title,
            expect_this_week: brief.expect_this_week,
            tip: brief.tip,
            reassurance: brief.reassurance,
            lang,
          },
          { onConflict: 'child_id,brief_date' }
        );

      if (insErr) {
        console.error(`[cron] brief insert failed for child ${child.id}:`, insErr.message);
        continue;
      }

      written += 1;
      track(child.user_id, 'daily_brief_generated', { lang });
    } catch (err) {
      console.error(`[cron] brief generation error for child ${child.id}:`, err?.message || err);
      // continue with the next child — one failure never aborts the batch
    }
  }

  return written;
}

function normalizeLang(lang) {
  return SUPPORTED_LANGS.has(lang) ? lang : 'en';
}

// Fetch the same context Dr. Bloom uses, via the service-role client.
async function fetchChildContext(supabase, child) {
  const childId = child.id;
  const [
    { data: growthRecords },
    { data: foodLogs },
    { data: healthRecords },
    { data: weeklyUpdates },
  ] = await Promise.all([
    supabase
      .from('growth_records')
      .select('record_date, weight_kg, height_cm, head_circumference_cm')
      .eq('child_id', childId)
      .order('record_date', { ascending: false })
      .limit(5),
    supabase
      .from('food_logs')
      .select('logged_date, meal_type, food_name, quantity, notes, food_type')
      .eq('child_id', childId)
      .order('logged_date', { ascending: false })
      .limit(7),
    supabase
      .from('health_records')
      .select('record_date, record_type, title, description, doctor_name')
      .eq('child_id', childId)
      .order('record_date', { ascending: false })
      .limit(3),
    supabase
      .from('weekly_updates')
      .select('week_date, mood, sleep_hours, sleep_quality, motor_milestone, new_skills, feeding_notes, concerns')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  let vaccinations = [];
  try {
    const { data: vacData } = await supabase
      .from('vaccinations')
      .select('vaccine_name, date_given, next_due')
      .eq('child_id', childId)
      .order('next_due', { ascending: true });
    vaccinations = vacData || [];
  } catch {
    // table optional — brief works without it
  }

  return {
    child,
    growthRecords: growthRecords || [],
    foodLogs: foodLogs || [],
    healthRecords: healthRecords || [],
    weeklyUpdate: weeklyUpdates?.[0] || null,
    vaccinations,
  };
}
