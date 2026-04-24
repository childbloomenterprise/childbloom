import { differenceInDays, format } from 'date-fns';

function ageLine(dateOfBirth) {
  if (!dateOfBirth) return '';
  const days = differenceInDays(new Date(), new Date(dateOfBirth));
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} old`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} month${m === 1 ? '' : 's'} old`;
  }
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m ? `${y}y ${m}m old` : `${y} year${y === 1 ? '' : 's'} old`;
}

export function composeTodayShareMessage({
  child,
  feedsToday,
  lastFeedAgoMinutes,
  latestGrowth,
  nextVaccine,
  latestMilestone,
}) {
  if (!child?.name) return '';

  const today = format(new Date(), 'EEEE, d MMMM');
  const lines = [];

  lines.push(`${child.name}'s update — ${today}`);
  lines.push(ageLine(child.date_of_birth));
  lines.push('');

  if (latestGrowth?.weight_kg) {
    lines.push(`Weight: ${latestGrowth.weight_kg} kg`);
  }
  if (latestGrowth?.height_cm) {
    lines.push(`Height: ${latestGrowth.height_cm} cm`);
  }

  if (typeof feedsToday === 'number') {
    lines.push(`Feeds today: ${feedsToday}`);
  }
  if (typeof lastFeedAgoMinutes === 'number' && Number.isFinite(lastFeedAgoMinutes)) {
    lines.push(`Last feed: ${formatAgo(lastFeedAgoMinutes)} ago`);
  }

  if (nextVaccine) {
    const when = nextVaccine.daysAway === 0
      ? 'today'
      : `in ${nextVaccine.daysAway} day${nextVaccine.daysAway === 1 ? '' : 's'}`;
    lines.push(`Next vaccine: ${nextVaccine.label} — ${when}`);
  }

  if (latestMilestone) {
    lines.push('');
    lines.push(`A small win: ${latestMilestone}`);
  }

  lines.push('');
  lines.push('— shared from ChildBloom');

  return lines.filter((l) => l !== null && l !== undefined).join('\n');
}

function formatAgo(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round(minutes - h * 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

export async function shareToFamily(text) {
  if (!text) return { ok: false, method: 'empty' };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return { ok: true, method: 'native' };
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { ok: false, method: 'cancelled' };
      }
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const win = typeof window !== 'undefined' ? window.open(waUrl, '_blank', 'noopener,noreferrer') : null;
  if (win) return { ok: true, method: 'whatsapp-web' };

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      /* ignore */
    }
  }

  return { ok: false, method: 'unsupported' };
}
