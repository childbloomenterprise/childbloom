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

  console.log(`[cron] ${ranAt}: ${pendingSummaries} pending summaries, ${briefsGenerated} briefs generated`);
  return res.status(200).json({
    ok: true,
    ran_at: ranAt,
    pending_summaries: pendingSummaries,
    briefs_generated: briefsGenerated,
  });
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
