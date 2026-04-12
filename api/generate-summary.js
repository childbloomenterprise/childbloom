import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { DR_BLOOM_SYSTEM_PROMPT } from './lib/drBloomPrompt.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LANG_INSTRUCTIONS = {
  en: 'Write in warm, conversational English.',
  ml: 'Write in natural Kerala Malayalam using Malayalam script (മലയാളം). Use warm, familiar tone.',
  ta: 'Write in natural Tamil using Tamil script (தமிழ்). Use warm, familiar tone.',
  hi: 'Write in Hindi using Devanagari script. Use warm, familiar tone.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: Bearer token (user-triggered) OR x-cron-secret (batch job)
  let userId;
  const cronSecret = req.headers['x-cron-secret'];

  if (cronSecret) {
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    userId = req.body.userId;
  } else {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    userId = user.id;
  }

  const { childId, weekStartDate, weekEndDate, language = 'en' } = req.body;

  if (!childId || !weekStartDate || !weekEndDate) {
    return res.status(400).json({ error: 'childId, weekStartDate, and weekEndDate are required' });
  }

  try {
    // Fetch child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('user_id', userId)
      .single();

    if (childError || !child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const weekStart = weekStartDate + 'T00:00:00Z';
    const weekEnd = weekEndDate + 'T23:59:59Z';

    // Fetch all data for the week in parallel
    const [
      { data: weeklyUpdates },
      { data: foodLogs },
      { data: medicalBills },
      { data: growthRecords },
      { data: healthRecords },
    ] = await Promise.all([
      supabase
        .from('weekly_updates')
        .select('*')
        .eq('child_id', childId)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('food_logs')
        .select('food_name, meal_type, quantity')
        .eq('child_id', childId)
        .gte('logged_date', weekStartDate)
        .lte('logged_date', weekEndDate),
      supabase
        .from('medical_bills')
        .select('*')
        .eq('child_id', childId)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd),
      supabase
        .from('growth_records')
        .select('*')
        .eq('child_id', childId)
        .gte('record_date', weekStartDate)
        .lte('record_date', weekEndDate)
        .order('record_date', { ascending: false }),
      supabase
        .from('health_records')
        .select('*')
        .eq('child_id', childId)
        .gte('record_date', weekStartDate)
        .lte('record_date', weekEndDate),
    ]);

    // Fetch previous week for comparison
    const prevStart = new Date(weekStartDate);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(weekEndDate);
    prevEnd.setDate(prevEnd.getDate() - 7);

    const { data: prevGrowth } = await supabase
      .from('growth_records')
      .select('weight_kg, height_cm')
      .eq('child_id', childId)
      .gte('record_date', prevStart.toISOString().split('T')[0])
      .lte('record_date', prevEnd.toISOString().split('T')[0])
      .order('record_date', { ascending: false })
      .limit(1);

    // Calculate child age
    const dob = new Date(child.date_of_birth);
    const weekDate = new Date(weekStartDate);
    const ageMonths = Math.floor((weekDate - dob) / (1000 * 60 * 60 * 24 * 30.44));

    const latestUpdate = weeklyUpdates?.[0] || null;
    const latestGrowth = growthRecords?.[0] || null;
    const prevGrowthRecord = prevGrowth?.[0] || null;

    // Build data snapshot
    const dataSnapshot = {
      child: {
        name: child.name,
        age_months: ageMonths,
        gender: child.gender,
      },
      week: {
        start: weekStartDate,
        end: weekEndDate,
      },
      measurements: latestGrowth
        ? {
            height_cm: latestGrowth.height_cm,
            weight_kg: latestGrowth.weight_kg,
            weight_change_kg: prevGrowthRecord && latestGrowth.weight_kg && prevGrowthRecord.weight_kg
              ? parseFloat((latestGrowth.weight_kg - prevGrowthRecord.weight_kg).toFixed(2))
              : null,
            height_change_cm: prevGrowthRecord && latestGrowth.height_cm && prevGrowthRecord.height_cm
              ? parseFloat((latestGrowth.height_cm - prevGrowthRecord.height_cm).toFixed(1))
              : null,
          }
        : null,
      mood: latestUpdate
        ? {
            mood: latestUpdate.mood,
            sleep_hours: latestUpdate.sleep_hours,
            sleep_quality: latestUpdate.sleep_quality,
          }
        : null,
      milestones: latestUpdate
        ? {
            motor: latestUpdate.motor_milestone,
            new_skills: latestUpdate.new_skills,
            milestones_list: latestUpdate.milestones,
          }
        : null,
      feeding: latestUpdate
        ? {
            feeding_notes: latestUpdate.feeding_notes,
            food_logs_count: foodLogs?.length || 0,
            unique_foods: [...new Set((foodLogs || []).map((f) => f.food_name))].slice(0, 10),
          }
        : null,
      medical: {
        doctor_visits: (medicalBills || []).filter((b) => b.visit_type === 'consultation').length,
        bills_scanned: (medicalBills || []).length,
        vaccinations_this_week: (healthRecords || [])
          .filter((r) => r.record_type === 'vaccination' || r.record_type === 'vaccine')
          .map((r) => r.title),
        upcoming_followups: (medicalBills || [])
          .filter((b) => b.follow_up_date)
          .map((b) => ({ date: b.follow_up_date, doctor: b.doctor_name })),
        ongoing_medicines: (medicalBills || [])
          .flatMap((b) => (b.medicines || []).map((m) => m.name))
          .filter(Boolean),
      },
      concerns: latestUpdate?.concerns || null,
      has_data: !!(latestUpdate || latestGrowth || (foodLogs && foodLogs.length > 0)),
    };

    // Generate summary
    const langInstruction = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.en;

    const summaryPrompt = `Generate a warm, comprehensive weekly summary for ${child.name}'s parents. ${child.name} is ${ageMonths} months old (${child.gender}).

Week of ${weekStartDate} to ${weekEndDate}.

Data:
${JSON.stringify(dataSnapshot, null, 2)}

${langInstruction}

Structure:
1. Opening (1 sentence): Warm greeting using child's name, reference the specific week
2. Growth & Body (2-3 sentences): Weight, height, changes from last week if available
3. Development (2-3 sentences): Milestones, new skills, language development, behavior
4. Feeding & Nutrition (2 sentences): How feeding went, any nutritional notes
5. Sleep (1-2 sentences): Sleep quality and hours
6. Medical (only include if there were doctor visits, vaccines, or ongoing medicines this week)
7. 3 Things to focus on next week: Specific, actionable, age-appropriate bullet points
8. One thing you're doing brilliantly: Genuine, specific positive reinforcement for the parent
9. Closing: Warm sign-off as Dr. Bloom

Tone: Like a wise, warm family doctor writing to a close friend. Never clinical. Never alarming. Reference specific details from the data — never be generic. Under 400 words.

If concerns were logged, address them gently in the "focus next week" section.`;

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: DR_BLOOM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: summaryPrompt }],
    });

    const summaryText = message.content[0].text;

    // Save to weekly_summaries (upsert — one summary per child per week)
    const { data: savedSummary } = await supabase
      .from('weekly_summaries')
      .upsert(
        {
          child_id: childId,
          user_id: userId,
          week_start_date: weekStartDate,
          week_end_date: weekEndDate,
          data_snapshot: dataSnapshot,
          summary_text: summaryText,
          language,
        },
        { onConflict: 'child_id,week_start_date' }
      )
      .select()
      .single();

    return res.status(200).json({
      summary: summaryText,
      dataSnapshot,
      id: savedSummary?.id,
      weekStartDate,
      weekEndDate,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
}
