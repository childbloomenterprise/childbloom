// completeness — "doctor-ready data" score for the Weekly Bloom Recap.
// One pure function over weekly_recap.stats (single implementation: the cron
// stores raw counts, the client computes the score — no client/server drift).
//
// Weighting: day-coverage of daily logs 60% · growth recency 25% · 15% for
// having any care/diaper logging at all (the detail doctors rarely get).

export function computeCompleteness(stats = {}) {
  const daysLogged = Math.max(0, Math.min(7, Number(stats.daysLogged) || 0));
  const coverage = daysLogged / 7; // 0–1

  const growth = stats.growthLogged ? 1 : 0;
  const care = (Number(stats.diapers) || 0) > 0 ? 1 : 0;

  const score = Math.round((coverage * 0.6 + growth * 0.25 + care * 0.15) * 100);

  const gaps = [];
  if (daysLogged < 7) gaps.push('coverage');
  if (!growth) gaps.push('growth');
  if (!care) gaps.push('care');

  const label = score >= 85 ? 'doctorReady' : score >= 55 ? 'takingShape' : 'justStarting';

  return { score, label, gaps };
}
