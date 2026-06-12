// TodayHub — the rich "everything about today" stack.
//
// This used to live on the Home/Dashboard screen. Following Apple's deference
// principle (content first, the home screen stays calm and instant), Home now
// keeps only the greeting + child age + the four quick-log tiles. Every richer
// surface — the morning Brief, the single insight card, the pulse numbers,
// the next-nap SweetSpot, voice/quick logging, repeat-last shortcuts, the
// "is this normal?" entry, the next milestone, the vaccine nudge and recent
// achievements — is gathered here and rendered on the Timeline tab, next to
// the day's chronological log where it belongs.
//
// It owns its own data (React Query keys are shared with the rest of the app,
// so mounting it costs no extra network when the cache is warm).

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { differenceInDays, format } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, SectionLabel,
  BloomFlower, Ring,
} from '../../components/cb/primitives';
import { useAchievements } from '../../hooks/useAchievements';
import { ACHIEVEMENTS } from '../../lib/achievementDefs';
import { useRepeatLastFeed } from '../../hooks/useRepeatLastFeed';
import { useRepeatLastSleep } from '../../hooks/useRepeatLastSleep';
import { computeBloomScore } from '../../lib/bloomScore';
import { getNextMilestone } from '../../lib/nextMilestone';
import { chooseObservation, hoursSinceLastFeed } from '../../lib/observations';
import { useObservation } from '../../hooks/useObservation';
import { useBloomMoments } from '../../hooks/useBloomMoments';
import { getDailySuggestion } from '../../lib/bloomAreas';
import BriefCard from '../brief/BriefCard';
import SweetSpotCard from '../sleep/SweetSpotCard';
import QuickLogBar from '../quicklog/QuickLogBar';
import NudgeCard from '../quicklog/NudgeCard';
import GardenChip from '../bloom/GardenChip';

// ── Tone palette for the primary observation card ──────────────────────────
// Apple-level idea: tone is communicated via subtle ink + a thin accent,
// never via heavy backgrounds. Calmer than coloured cards.
function toneAccent(tone) {
  switch (tone) {
    case 'urgent':    return { ink: '#9A2A2A', accent: '#C44545', wash: 'rgba(196,69,69,0.08)' };
    case 'attention': return { ink: '#8A5A14', accent: '#C9A35A', wash: 'rgba(201,163,90,0.10)' };
    case 'positive': return { ink: T.brand,    accent: T.brand,   wash: T.brandWash };
    case 'calm':
    default:          return { ink: T.ink900,  accent: T.brandSoft, wash: 'transparent' };
  }
}

// One observation card — the single big surface.
function ObservationCard({ obs, onCta }) {
  const a = toneAccent(obs.tone);
  return (
    <Card
      p={22}
      className="bloom-card-in"
      role="region"
      aria-label={`${obs.eyebrow}: ${obs.headline}`}
      style={{
        position: 'relative', overflow: 'hidden',
        background: a.wash !== 'transparent' ? a.wash : T.surface,
        border: a.wash !== 'transparent' ? `0.5px solid ${a.accent}30` : `0.5px solid ${T.line}`,
      }}>
      {(obs.tone === 'calm' || obs.tone === 'positive') && (
        <div style={{ position: 'absolute', right: -28, top: -28, opacity: 0.55, pointerEvents: 'none', animation: 'bloom-breathe 6s ease-in-out infinite' }}>
          <BloomFlower size={170} />
        </div>
      )}
      <HRow justify="space-between" align="flex-start">
        <Eyebrow color={a.accent}>{obs.eyebrow}</Eyebrow>
        {obs.badge && (
          <div style={{
            padding: '4px 10px', borderRadius: 999, background: T.brandWash,
            display: 'flex', alignItems: 'baseline', gap: 4,
          }}>
            <Mono size={9} color={T.brand}>{obs.badge.label.toUpperCase()}</Mono>
            <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontStyle: 'italic', color: T.brand, fontWeight: 600 }}>{obs.badge.value}</div>
          </div>
        )}
      </HRow>
      <Spacer h={8} />
      <div style={{
        fontFamily: FONTS.serif, fontSize: 26, fontStyle: 'italic', fontWeight: 500,
        letterSpacing: '-0.022em', lineHeight: 1.15, color: a.ink, maxWidth: 320,
      }}>
        {obs.headline}
      </div>
      <Spacer h={8} />
      <Body size={13} color={T.ink500} lh={1.5} style={{ maxWidth: 320 }}>{obs.body}</Body>
      {obs.cta && (
        <>
          <Spacer h={16} />
          <Button variant={obs.tone === 'urgent' ? 'primary' : 'secondary'} size="sm" onClick={onCta}>
            {obs.cta.label}
          </Button>
        </>
      )}
    </Card>
  );
}

// Three numbers in a row — no cards, no progress bars. Visual rest.
function PulseStrip({ sleepToday, sleepTarget, feedsToday, hoursSinceLastFeedVal }) {
  const items = [
    { label: 'Slept', value: sleepToday != null ? `${sleepToday}h` : '—', sub: sleepToday != null ? `of ${sleepTarget}h` : 'not logged' },
    { label: 'Feeds', value: String(feedsToday), sub: 'today' },
    {
      label: 'Last feed',
      value: hoursSinceLastFeedVal != null
        ? (hoursSinceLastFeedVal < 1 ? `${Math.round(hoursSinceLastFeedVal * 60)}m` : `${Math.floor(hoursSinceLastFeedVal)}h`)
        : '—',
      sub: hoursSinceLastFeedVal != null ? 'ago' : 'none today',
    },
  ];
  return (
    <HRow style={{ padding: '14px 8px' }} align="stretch">
      {items.map((it, i) => (
        <div key={i} style={{ flex: 1, padding: '0 8px', borderLeft: i > 0 ? `0.5px solid ${T.line}` : 'none' }}>
          <Mono size={10} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{it.label}</Mono>
          <Spacer h={4} />
          <div style={{ fontFamily: FONTS.serif, fontSize: 22, fontStyle: 'italic', color: T.ink900, lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 500 }}>
            {it.value}
          </div>
          <Spacer h={3} />
          <Body size={11} color={T.ink400}>{it.sub}</Body>
        </div>
      ))}
    </HRow>
  );
}

// "Repeat last feed" hero — the sub-5-second log.
function RepeatLastFeedCard({ lastFeed, onRepeat, isRepeating, justSaved, onUndo }) {
  if (!lastFeed) return null;
  const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(lastFeed.logged_at).getTime()) / 60000));
  const timeLabel = minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ${minsAgo % 60}m ago`;

  return (
    <Card p={16} role="group" aria-label="Repeat last feed" style={{ background: T.brandWash, border: `0.5px solid ${T.brandSoft}40` }}>
      <HRow gap={14} align="center">
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CBIcon name="bottle" size={20} />
        </div>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Mono size={10} color={T.brand} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last feed</Mono>
          <Body size={14} color={T.ink900} weight={600}>
            {lastFeed.food_type}{lastFeed.duration_minutes ? ` · ${lastFeed.duration_minutes} min` : ''}
          </Body>
          <Body size={11} color={T.ink500}>{timeLabel}</Body>
        </Stack>
        {justSaved ? (
          <button onClick={onUndo} aria-label="Undo last feed log"
            style={{ padding: '10px 16px', borderRadius: 999, border: `0.5px solid ${T.brand}`, background: T.surface, color: T.brand, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
            Undo
          </button>
        ) : (
          <button onClick={onRepeat} disabled={isRepeating}
            aria-label={`Log another ${lastFeed.food_type} feed of ${lastFeed.duration_minutes || 15} minutes`}
            style={{
              padding: '12px 18px', borderRadius: 999, border: 'none',
              background: T.brand, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: isRepeating ? 'default' : 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', gap: 6, opacity: isRepeating ? 0.7 : 1,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}>
            <CBIcon name="plus" size={14} stroke={2.5} />
            Repeat
          </button>
        )}
      </HRow>
    </Card>
  );
}

// Sleep repeat card — compact variant of the feed repeat.
function RepeatLastSleepCard({ lastSleep, onRepeat, isRepeating, justSaved, onUndo }) {
  if (!lastSleep) return null;
  return (
    <Card p={14} role="group" aria-label="Repeat last sleep log" style={{ background: '#EBF4FF', border: `0.5px solid #B8D1FA60` }}>
      <HRow gap={12} align="center">
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#3B5BDB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CBIcon name="moon" size={17} />
        </div>
        <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
          <Mono size={10} color="#3B5BDB" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yesterday</Mono>
          <Body size={13} color={T.ink900} weight={600}>Slept {lastSleep.hours_slept}h</Body>
        </Stack>
        {justSaved ? (
          <button onClick={onUndo} aria-label="Undo sleep log"
            style={{ padding: '8px 14px', borderRadius: 999, border: `0.5px solid #3B5BDB`, background: T.surface, color: '#3B5BDB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>Undo</button>
        ) : (
          <button onClick={onRepeat} disabled={isRepeating}
            aria-label={`Log ${lastSleep.hours_slept} hours of sleep for today`}
            style={{
              padding: '10px 16px', borderRadius: 999, border: 'none',
              background: '#3B5BDB', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: isRepeating ? 'default' : 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', gap: 5, opacity: isRepeating ? 0.7 : 1,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}>
            <CBIcon name="plus" size={12} stroke={2.5} />
            Same for today
          </button>
        )}
      </HRow>
    </Card>
  );
}

export default function TodayHub({ child }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const childId = child?.id;
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ── Data (keys shared with Dashboard/Care/Timeline → warm cache) ──
  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId).eq('logged_date', todayStr)
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId).eq('logged_date', todayStr)
        .order('created_at', { ascending: false }).limit(1);
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: vaccines = [] } = useQuery({
    queryKey: ['vaccinations-dash', childId],
    queryFn: async () => {
      const { data } = await supabase.from('vaccinations').select('*')
        .eq('child_id', childId).is('date_given', null)
        .order('next_due', { ascending: true }).limit(1);
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: latestUpdate } = useQuery({
    queryKey: ['latest-update', childId],
    queryFn: async () => {
      const { data } = await supabase.from('weekly_updates').select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!childId,
  });

  const { data: foodLogs7d = [] } = useQuery({
    queryKey: ['food-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId).gte('logged_at', sevenAgo)
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sleepLogs7d = [] } = useQuery({
    queryKey: ['sleep-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId).gte('logged_date', sevenAgo)
        .order('logged_date', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived ──
  const feedsToday  = foodLogs.length;
  const feedsTarget = ageInDays && ageInDays <= 60 ? 8 : 6;
  const sleepToday  = sleepLogs[0]?.hours_slept ?? null;
  const sleepTarget = ageInDays && ageInDays <= 90 ? 14 : 12;
  const sleepLogged = sleepToday != null;
  const feedLogged  = feedsToday > 0;
  const checkLogged = !!latestUpdate;
  const hoursSinceLast = hoursSinceLastFeed(foodLogs);
  const nextVaccine = vaccines[0];
  const nextVaccineDays = nextVaccine?.next_due
    ? differenceInDays(new Date(nextVaccine.next_due), new Date()) : null;

  const score = computeBloomScore({
    sleepToday, sleepTarget,
    feedsToday: feedLogged ? feedsToday : null,
    feedsTarget,
    hasCheckin: checkLogged,
  });
  const milestone = getNextMilestone(ageInDays);

  const { observation: pattern } = useObservation({
    childId, childName: child?.name, foodLogs7d, sleepLogs7d,
    enabled: !!childId && !user?.is_anonymous,
  });

  const { momentsByArea } = useBloomMoments(childId);
  const bloomSuggestion = childId && ageInDays != null
    ? getDailySuggestion(ageInDays, childId, momentsByArea)
    : null;

  const observation = chooseObservation({
    childName: child?.name, ageInDays,
    feedsToday, feedsTarget, sleepToday, sleepTarget,
    hasCheckinToday: checkLogged,
    hoursSinceLastFeed: hoursSinceLast,
    nextVaccineDays, nextVaccineName: nextVaccine?.vaccine_name,
    milestone, bloomScore: score, childId, pattern, bloomSuggestion,
  });
  const onCta = () => observation.cta && navigate(observation.cta.path);

  const { lastFeed: lastFeedFromRecent, repeat, isRepeating, justSaved, undo } = useRepeatLastFeed(childId);
  const sleep = useRepeatLastSleep(childId);
  const showSleepRepeat = !sleepLogged && sleep.lastSleep != null;

  const { unlocked, unlockedKeys } = useAchievements();
  const recentUnlocked = [...unlocked]
    .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
    .slice(0, 3)
    .map((u) => ACHIEVEMENTS.find((a) => a.key === u.achievement_key))
    .filter(Boolean);

  if (!childId) return null;
  const isLive = !user?.is_anonymous;

  return (
    <Stack gap={0}>
      {/* ── Daily Bloom Brief — the morning hook ── */}
      {isLive && (
        <div style={{ paddingBottom: 14 }}>
          <BriefCard child={child} />
        </div>
      )}

      {/* ── Primary observation — the one big thing ── */}
      <ObservationCard obs={observation} onCta={onCta} />

      {/* ── Pulse strip — three numbers inline ── */}
      <div style={{ padding: '4px 4px 0' }}>
        <PulseStrip
          sleepToday={sleepToday}
          sleepTarget={sleepTarget}
          feedsToday={feedsToday}
          hoursSinceLastFeedVal={hoursSinceLast}
        />
      </div>

      {/* ── Garden chip — logging waters the Bloom Garden ── */}
      {isLive && (
        <>
          <Spacer h={14} />
          <GardenChip childId={childId} foodLogs7d={foodLogs7d} sleepLogs7d={sleepLogs7d} />
        </>
      )}

      {/* ── Sleep SweetSpot — next-nap window predictor ── */}
      {isLive && (
        <>
          <Spacer h={14} />
          <SweetSpotCard child={child} sleepLogs={sleepLogs7d} />
        </>
      )}

      {/* ── Rhythm nudge — the app proposes the log, parent confirms ──
           (renders nothing, including its top margin, when there is no nudge) */}
      {isLive && (
        <NudgeCard childId={childId} foodLogs7d={foodLogs7d} lastFeed={lastFeedFromRecent} />
      )}

      {/* ── Quick log — voice + one-tap diaper/meds ── */}
      {isLive && (
        <>
          <Spacer h={14} />
          <QuickLogBar child={child} />
        </>
      )}

      {/* ── "Is this normal?" entry ── */}
      <>
        <Spacer h={14} />
        <Card p={14} onClick={() => navigate('/myths')} style={{ cursor: 'pointer' }}>
          <HRow gap={12} align="center">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.brandWash, color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CBIcon name="info" size={15} />
            </div>
            <Stack gap={1} style={{ flex: 1 }}>
              <Body size={13} color={T.ink900} weight={600}>Is this normal?</Body>
              <Body size={11} color={T.ink500}>Check advice from relatives — instant answers</Body>
            </Stack>
            <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />
          </HRow>
        </Card>
      </>

      {/* ── Repeat last feed ── */}
      {lastFeedFromRecent && (
        <>
          <Spacer h={14} />
          <RepeatLastFeedCard
            lastFeed={lastFeedFromRecent}
            onRepeat={repeat}
            isRepeating={isRepeating}
            justSaved={justSaved}
            onUndo={undo}
          />
        </>
      )}

      {/* ── Repeat last sleep ── */}
      {showSleepRepeat && (
        <>
          <Spacer h={10} />
          <RepeatLastSleepCard
            lastSleep={sleep.lastSleep}
            onRepeat={sleep.repeat}
            isRepeating={sleep.isRepeating}
            justSaved={sleep.justSaved}
            onUndo={sleep.undo}
          />
        </>
      )}

      {/* ── Milestone ── */}
      {milestone && (
        <>
          <Spacer h={20} />
          <SectionLabel title="Development" trailing="Chart" onTrailing={() => navigate(`/child/${childId}/development`)} />
          <Card p={18}>
            <HRow justify="space-between" align="flex-start">
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Eyebrow color={T.brand}>Next</Eyebrow>
                <Display size={20} italic weight={500}>{milestone.name}</Display>
                <Body size={12} color={T.ink500}>
                  Week {milestone.windowStartWeek}–{milestone.windowEndWeek} · you're in week {milestone.currentWeek}
                </Body>
              </Stack>
              <Ring value={milestone.progress} size={54} stroke={5} label={`${Math.round(milestone.progress * 100)}`} />
            </HRow>
            {!milestone.onTrack && (
              <Body size={11} color="#B45309" style={{ marginTop: 10 }}>
                Past typical window — worth mentioning at your next visit.
              </Body>
            )}
          </Card>
        </>
      )}

      {/* ── Vaccine nudge (compact, only ≤14 days) ── */}
      {nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 14 && nextVaccineDays > 1 && (
        <>
          <Spacer h={14} />
          <Card
            p={14}
            onClick={() => navigate(`/child/${childId}/vaccinations`)}
            style={{ background: 'rgba(201,163,90,0.06)', border: `0.5px solid rgba(201,163,90,0.22)`, cursor: 'pointer' }}
          >
            <HRow gap={12} align="center">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(201,163,90,0.16)', color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CBIcon name="shield" size={15} />
              </div>
              <Stack gap={1} style={{ flex: 1 }}>
                <Body size={13} color={T.ink900} weight={600}>{nextVaccine.vaccine_name}</Body>
                <Body size={11} color={T.ink500}>in {nextVaccineDays} day{nextVaccineDays !== 1 ? 's' : ''}</Body>
              </Stack>
              <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />
            </HRow>
          </Card>
        </>
      )}

      {/* ── Achievements (compact) ── */}
      {unlockedKeys.size > 0 && (
        <>
          <Spacer h={14} />
          <Card p={14} onClick={() => navigate('/achievements')} style={{ cursor: 'pointer' }}>
            <HRow gap={12} align="center">
              <HRow gap={4}>
                {recentUnlocked.map((a) => (
                  <div key={a.key} style={{
                    width: 28, height: 28, borderRadius: 8, background: `${a.color}18`,
                    border: `1px solid ${a.color}30`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>{a.emoji}</div>
                ))}
              </HRow>
              <Body size={12} color={T.ink500} style={{ flex: 1 }}>
                {unlockedKeys.size} of {ACHIEVEMENTS.length} milestones
              </Body>
              <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />
            </HRow>
          </Card>
        </>
      )}
    </Stack>
  );
}
