// Primary observation chooser for the home screen.
//
// Apple-level idea: show ONE thing. The most important thing right now.
// All other context becomes secondary surfaces.
//
// Returns: { tone, eyebrow, headline, body, cta?, badge? }
//   tone:     'urgent' | 'attention' | 'calm' | 'positive'
//   cta:      { label, path } — optional action button
//   badge:    optional small score/metric to show in corner

import { differenceInMinutes } from 'date-fns';

export function chooseObservation(ctx) {
  const {
    childName,
    ageInDays,
    feedsToday = 0,
    feedsTarget = 8,
    sleepToday = null,
    sleepTarget = 14,
    hasCheckinToday = false,
    hoursSinceLastFeed = null,
    nextVaccineDays = null,
    nextVaccineName = null,
    milestone = null,
    bloomScore = null,
    childId = null,
    hour = new Date().getHours(),
  } = ctx;

  const name = childName || 'your little one';

  if (ageInDays == null) {
    return {
      tone: 'calm',
      eyebrow: 'Welcome',
      headline: `Set up ${name}'s profile`,
      body: 'Two minutes — then I can give real guidance instead of generic tips.',
      cta: { label: 'Begin', path: '/onboarding' },
    };
  }

  // ── Priority 1: Vaccine today/tomorrow ──
  if (nextVaccineDays != null && nextVaccineDays >= 0 && nextVaccineDays <= 1 && childId) {
    return {
      tone: 'urgent',
      eyebrow: nextVaccineDays === 0 ? 'Due today' : 'Tomorrow',
      headline: nextVaccineName || 'Vaccine due',
      body: nextVaccineDays === 0
        ? `Don't skip — the IAP schedule matters for ${name}.`
        : `Plan ${name}'s clinic visit for tomorrow.`,
      cta: { label: 'View schedule', path: `/child/${childId}/vaccinations` },
    };
  }

  // ── Priority 2: Long gap since last feed (under-6m only, daytime) ──
  if (ageInDays < 180 && hoursSinceLastFeed != null && hoursSinceLastFeed >= 3.5 && hour >= 7 && hour <= 22) {
    return {
      tone: 'attention',
      eyebrow: 'Heads up',
      headline: `${Math.floor(hoursSinceLastFeed)}h since the last feed`,
      body: `${name} usually feeds every 2–3 hours at this age. Check if they're showing hunger cues.`,
      cta: childId ? { label: 'Log a feed', path: `/child/${childId}/food` } : null,
    };
  }

  // ── Priority 3: Pattern observation from history (CMG) ──
  if (ctx.pattern) {
    return {
      tone: 'calm',
      eyebrow: 'Pattern noticed',
      headline: ctx.pattern.headline,
      body: ctx.pattern.body,
      badge: bloomScore != null ? { label: 'Bloom', value: bloomScore } : null,
    };
  }

  // ── Priority 4: Quiet positive — steady day ──
  if (feedsToday >= 3 && hasCheckinToday) {
    return {
      tone: 'positive',
      eyebrow: 'On rhythm',
      headline: `${name} is having a steady day`,
      body: `${feedsToday} feeds${sleepToday ? `, ${sleepToday}h sleep` : ''} — within typical range for this age. You're showing up.`,
      badge: bloomScore != null ? { label: 'Bloom', value: bloomScore } : null,
    };
  }

  // ── Priority 4: Missing check-in late in the day ──
  if (!hasCheckinToday && hour >= 17 && childId) {
    return {
      tone: 'attention',
      eyebrow: 'One small thing',
      headline: 'Two-minute check-in',
      body: `Tell me about ${name}'s day. I'll spot anything off.`,
      cta: { label: 'Check in', path: `/child/${childId}/weekly-update` },
    };
  }

  // ── Priority 5: Missing feeds, midday ──
  if (ageInDays < 180 && feedsToday < Math.floor(feedsTarget * 0.5) && hour >= 12 && childId) {
    return {
      tone: 'attention',
      eyebrow: 'Today so far',
      headline: `${feedsToday} feed${feedsToday === 1 ? '' : 's'} logged`,
      body: `${name} usually has ${feedsTarget} a day. Cluster feeds in the evening are normal.`,
      cta: { label: 'Log a feed', path: `/child/${childId}/food` },
    };
  }

  // ── Priority 5.5: Bloom Path daily gentle suggestion ──
  // Quiet, never pushy. Only surfaces when nothing more urgent applies.
  if (ctx.bloomSuggestion && childId) {
    const s = ctx.bloomSuggestion;
    return {
      tone: 'calm',
      eyebrow: 'Today, gently',
      headline: s.activity.label,
      body: s.activity.body,
      cta: { label: 'See bloom path', path: `/child/${childId}/bloom` },
      badge: bloomScore != null ? { label: 'Bloom', value: bloomScore } : null,
    };
  }

  // ── Priority 6: Milestone window approaching ──
  if (milestone && milestone.daysToMedian >= 0 && milestone.daysToMedian <= 21 && childId) {
    return {
      tone: 'calm',
      eyebrow: 'Approaching',
      headline: milestone.name,
      body: `Most babies show this around week ${Math.round((milestone.windowStartWeek + milestone.windowEndWeek) / 2)}. You're in week ${milestone.currentWeek}.`,
      cta: { label: 'Track', path: `/child/${childId}/development` },
    };
  }

  // ── Default: age-anchored gentle note ──
  return {
    tone: 'calm',
    eyebrow: 'This week',
    headline: getAgeHeadline(name, ageInDays),
    body: getAgeBody(ageInDays),
    badge: bloomScore != null ? { label: 'Bloom', value: bloomScore } : null,
  };
}

function getAgeHeadline(name, ageInDays) {
  if (ageInDays <= 7)   return `${name}'s first week`;
  if (ageInDays <= 30)  return `Day ${ageInDays}`;
  if (ageInDays <= 90)  return `Week ${Math.floor(ageInDays / 7)}`;
  if (ageInDays <= 365) return `${Math.floor(ageInDays / 30)} months in`;
  return `${Math.floor(ageInDays / 365)} years`;
}

function getAgeBody(ageInDays) {
  if (ageInDays <= 7)   return 'Skin-to-skin and feeding are everything right now.';
  if (ageInDays <= 21)  return 'Hearing is now fully developed — your voice is familiar.';
  if (ageInDays <= 45)  return 'First social smiles are days away. Watch the eyes today.';
  if (ageInDays <= 90)  return 'Building head control. Tummy time helps — even 5 minutes.';
  if (ageInDays <= 180) return 'Approaching the sitting milestone. Lots to celebrate this month.';
  if (ageInDays <= 365) return 'Every word you say is building vocabulary.';
  return 'Growing beautifully.';
}

// Compute hours since the most recent food log
export function hoursSinceLastFeed(foodLogs) {
  if (!foodLogs || foodLogs.length === 0) return null;
  const sorted = [...foodLogs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const last = sorted[0];
  if (!last?.logged_at) return null;
  return differenceInMinutes(new Date(), new Date(last.logged_at)) / 60;
}
