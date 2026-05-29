import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  Avatar, BloomFlower, Ring,
} from '../../components/cb/primitives';
import { useAchievements } from '../../hooks/useAchievements';
import { ACHIEVEMENTS } from '../../lib/achievementDefs';
import { useRepeatLastFeed } from '../../hooks/useRepeatLastFeed';
import { useRepeatLastSleep } from '../../hooks/useRepeatLastSleep';
import { useInbox } from '../../hooks/useInbox';
import { computeBloomScore } from '../../lib/bloomScore';
import { getNextMilestone } from '../../lib/nextMilestone';
import { chooseObservation, hoursSinceLastFeed } from '../../lib/observations';
import { detectFeedPattern } from '../../lib/feedPatterns';
import { useObservation } from '../../hooks/useObservation';
import { useBloomMoments } from '../../hooks/useBloomMoments';
import { getDailySuggestion } from '../../lib/bloomAreas';
import SleepQuickSheet from './SleepQuickSheet';

// ──────────────────────────────────────────────────────────────────────────
// Tone palette for the primary observation card.
// Apple-level idea: tone is communicated via subtle ink + a thin accent,
// never via heavy backgrounds. Calmer than coloured cards.
// ──────────────────────────────────────────────────────────────────────────
function toneAccent(tone) {
  switch (tone) {
    case 'urgent':    return { ink: '#9A2A2A', accent: '#C44545', wash: 'rgba(196,69,69,0.08)' };
    case 'attention': return { ink: '#8A5A14', accent: '#C9A35A', wash: 'rgba(201,163,90,0.10)' };
    case 'positive': return { ink: T.brand,    accent: T.brand,   wash: T.brandWash };
    case 'calm':
    default:          return { ink: T.ink900,  accent: T.brandSoft, wash: 'transparent' };
  }
}

// One observation card — the only big surface above the fold.
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
      {/* Quiet flower mark — only visible on calm/positive tones */}
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
    {
      label: 'Slept',
      value: sleepToday != null ? `${sleepToday}h` : '—',
      sub: sleepToday != null ? `of ${sleepTarget}h` : 'not logged',
    },
    {
      label: 'Feeds',
      value: String(feedsToday),
      sub: 'today',
    },
    {
      label: 'Last feed',
      value: hoursSinceLastFeedVal != null
        ? (hoursSinceLastFeedVal < 1
            ? `${Math.round(hoursSinceLastFeedVal * 60)}m`
            : `${Math.floor(hoursSinceLastFeedVal)}h`)
        : '—',
      sub: hoursSinceLastFeedVal != null ? 'ago' : 'none today',
    },
  ];
  return (
    <HRow style={{ padding: '14px 8px' }} align="stretch">
      {items.map((it, i) => (
        <div key={i} style={{
          flex: 1, padding: '0 8px',
          borderLeft: i > 0 ? `0.5px solid ${T.line}` : 'none',
        }}>
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

// Three large quick-log tiles. Bigger tap targets than before.
function QuickAction({ icon, label, sub, onClick, accent, ...aria }) {
  return (
    <button
      onClick={onClick}
      {...aria}
      style={{
        flex: 1, padding: '18px 12px', borderRadius: RADIUS.lg,
        background: T.surface, border: `0.5px solid ${T.line}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', fontFamily: FONTS.sans, color: T.ink900,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minHeight: 92,
      }}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
      onPointerUp={e => e.currentTarget.style.transform = ''}
      onPointerLeave={e => e.currentTarget.style.transform = ''}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: accent || T.brandWash, color: T.brand,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CBIcon name={icon} size={18} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink900 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.ink400, letterSpacing: '0.04em' }}>{sub}</div>}
    </button>
  );
}

// "Repeat last feed" hero — the sub-5-second log on the home screen.
function RepeatLastFeedCard({ lastFeed, onRepeat, isRepeating, justSaved, onUndo }) {
  if (!lastFeed) return null;
  const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(lastFeed.logged_at).getTime()) / 60000));
  const timeLabel = minsAgo < 60
    ? `${minsAgo}m ago`
    : `${Math.floor(minsAgo / 60)}h ${minsAgo % 60}m ago`;

  return (
    <Card p={16} role="group" aria-label="Repeat last feed" style={{ background: T.brandWash, border: `0.5px solid ${T.brandSoft}40` }}>
      <HRow gap={14} align="center">
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: T.brand, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
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
          <button
            onClick={onUndo}
            aria-label="Undo last feed log"
            style={{
              padding: '10px 16px', borderRadius: 999, border: `0.5px solid ${T.brand}`,
              background: T.surface, color: T.brand, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}
          >
            Undo
          </button>
        ) : (
          <button
            onClick={onRepeat}
            disabled={isRepeating}
            aria-label={`Log another ${lastFeed.food_type} feed of ${lastFeed.duration_minutes || 15} minutes`}
            style={{
              padding: '12px 18px', borderRadius: 999, border: 'none',
              background: T.brand, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: isRepeating ? 'default' : 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isRepeating ? 0.7 : 1,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}
          >
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
        <div style={{
          width: 38, height: 38, borderRadius: 12, background: '#3B5BDB', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CBIcon name="moon" size={17} />
        </div>
        <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
          <Mono size={10} color="#3B5BDB" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yesterday</Mono>
          <Body size={13} color={T.ink900} weight={600}>
            Slept {lastSleep.hours_slept}h
          </Body>
        </Stack>
        {justSaved ? (
          <button
            onClick={onUndo}
            aria-label="Undo sleep log"
            style={{
              padding: '8px 14px', borderRadius: 999, border: `0.5px solid #3B5BDB`,
              background: T.surface, color: '#3B5BDB', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}
          >Undo</button>
        ) : (
          <button
            onClick={onRepeat}
            disabled={isRepeating}
            aria-label={`Log ${lastSleep.hours_slept} hours of sleep for today`}
            style={{
              padding: '10px 16px', borderRadius: 999, border: 'none',
              background: '#3B5BDB', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: isRepeating ? 'default' : 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: isRepeating ? 0.7 : 1,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}
          >
            <CBIcon name="plus" size={12} stroke={2.5} />
            Same for today
          </button>
        )}
      </HRow>
    </Card>
  );
}

// Today's timeline — merged food + sleep + check-in events.
function TodayTimeline({ events, onEmpty }) {
  if (!events.length) {
    return (
      <Card p={20} style={{ textAlign: 'center', border: `0.5px dashed ${T.line}`, background: 'transparent' }}>
        <Body size={13} color={T.ink400}>Nothing logged today yet.</Body>
        {onEmpty && (
          <>
            <Spacer h={10} />
            <Button variant="ghost" size="sm" onClick={onEmpty}>Start the day</Button>
          </>
        )}
      </Card>
    );
  }
  return (
    <Card p={0}>
      {events.map((e, i) => (
        <div key={e.key}>
          <HRow gap={12} style={{ padding: '14px 16px' }} align="center">
            <Mono size={11} color={T.ink400} style={{ width: 52, flexShrink: 0 }}>{e.time}</Mono>
            <div style={{
              width: 30, height: 30, borderRadius: 10, background: e.bg, color: e.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CBIcon name={e.icon} size={14} />
            </div>
            <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
              <Body size={13} color={T.ink900} weight={600}>{e.title}</Body>
              {e.sub && <Body size={11} color={T.ink400}>{e.sub}</Body>}
            </Stack>
          </HRow>
          {i < events.length - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
}

// Discreet floating SOS — no more giant red gradient banner.
function FloatingSOS({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', right: 16, bottom: 110, zIndex: 50,
        width: 52, height: 52, borderRadius: 999, border: 'none',
        background: '#B91C1C', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 22px rgba(185,28,28,0.32)',
        fontFamily: FONTS.sans, transition: 'transform 0.15s ease',
      }}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
      onPointerUp={e => e.currentTarget.style.transform = ''}
      onPointerLeave={e => e.currentTarget.style.transform = ''}
      aria-label="Emergency first-aid"
    >
      <CBIcon name="siren" size={20} stroke={2.2} />
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Quiet night';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const user = useAuthStore((s) => s.user);
  const childId = child?.id;
  const { pendingCount } = useInbox();
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ── Data ──
  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId)
        .eq('logged_date', todayStr)
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId)
        .eq('logged_date', todayStr)
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

  // 7-day windows for pattern detection
  const { data: foodLogs7d = [] } = useQuery({
    queryKey: ['food-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId)
        .gte('logged_at', sevenAgo)
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
        .eq('child_id', childId)
        .gte('logged_date', sevenAgo)
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

  // Server-first observation (6h cached). Falls back to client-side detector.
  const { observation: pattern } = useObservation({
    childId,
    childName: child?.name,
    foodLogs7d,
    sleepLogs7d,
    enabled: !!childId && !user?.is_anonymous,
  });

  // Bloom Path daily suggestion (rotates daily, area-aware)
  const { momentsByArea } = useBloomMoments(childId);
  const bloomSuggestion = childId && ageInDays != null
    ? getDailySuggestion(ageInDays, childId, momentsByArea)
    : null;

  const observation = chooseObservation({
    childName: child?.name,
    ageInDays,
    feedsToday, feedsTarget,
    sleepToday, sleepTarget,
    hasCheckinToday: checkLogged,
    hoursSinceLastFeed: hoursSinceLast,
    nextVaccineDays,
    nextVaccineName: nextVaccine?.vaccine_name,
    milestone,
    bloomScore: score,
    childId,
    pattern,
    bloomSuggestion,
  });

  // Build today's timeline (food + sleep + check-in, sorted desc)
  const timelineEvents = [
    ...foodLogs.map((f) => ({
      key: `food-${f.id}`,
      sortTs: new Date(f.logged_at).getTime(),
      time: format(new Date(f.logged_at), 'h:mm a'),
      title: `${f.food_type} feed`,
      sub: f.duration_minutes ? `${f.duration_minutes} min` : null,
      icon: 'bottle',
      bg: T.brandWash, fg: T.brand,
    })),
    ...(sleepToday != null && sleepLogs[0] ? [{
      key: `sleep-${sleepLogs[0].id}`,
      sortTs: new Date(sleepLogs[0].created_at).getTime(),
      time: format(new Date(sleepLogs[0].created_at), 'h:mm a'),
      title: `Slept ${sleepToday}h`,
      sub: sleepLogs[0].quality ? `${sleepLogs[0].quality} quality` : null,
      icon: 'moon',
      bg: '#EBF4FF', fg: '#3B5BDB',
    }] : []),
    ...(checkLogged ? [{
      key: `checkin-${latestUpdate.id}`,
      sortTs: new Date(latestUpdate.created_at).getTime(),
      time: format(new Date(latestUpdate.created_at), 'h:mm a'),
      title: 'Daily check-in',
      sub: latestUpdate.mood ? `Mood: ${latestUpdate.mood}` : null,
      icon: 'clipboard',
      bg: '#FFF1E8', fg: '#C9A35A',
    }] : []),
  ].sort((a, b) => b.sortTs - a.sortTs);

  // Repeat last feed
  const { lastFeed: lastFeedFromRecent, repeat, isRepeating, justSaved, undo } = useRepeatLastFeed(childId);

  // Repeat last sleep — only when no sleep logged today + we have past data
  const sleep = useRepeatLastSleep(childId);
  const showSleepRepeat = !sleepLogged && sleep.lastSleep != null;

  // Achievements
  const { unlocked, unlockedKeys } = useAchievements();
  const recentUnlocked = [...unlocked]
    .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
    .slice(0, 3)
    .map((u) => ACHIEVEMENTS.find((a) => a.key === u.achievement_key))
    .filter(Boolean);

  const parentName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const childInitial = child?.name?.[0] || 'B';
  const onCta = () => observation.cta && navigate(observation.cta.path);
  const [sleepSheetOpen, setSleepSheetOpen] = useState(false);

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingBottom: 24 }}>

      {/* ── Header ── */}
      <div style={{ padding: '56px 20px 0' }}>
        <HRow gap={12} align="center" justify="space-between">
          <HRow gap={10} align="center">
            <Avatar name={childInitial} size={42} />
            <Stack gap={1}>
              <Body size={11} color={T.ink400} weight={500}>{getGreeting()}, {parentName}</Body>
              <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: T.ink900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{child?.name || 'your little one'}</span>
              </div>
            </Stack>
          </HRow>
          <HRow gap={6}>
            <ChromeBtn icon="bell" badge={pendingCount > 0 || (!!nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 7)} onClick={() => navigate('/inbox')} />
            <ChromeBtn icon="settings" onClick={() => navigate('/settings')} />
          </HRow>
        </HRow>
      </div>

      <Spacer h={20} />

      {/* ── Primary observation — the one big thing ── */}
      <div style={{ padding: '0 16px' }}>
        <ObservationCard obs={observation} onCta={onCta} />
      </div>

      {/* ── Pulse strip — three numbers inline, no big cards ── */}
      {childId && (
        <div style={{ padding: '4px 12px 0' }}>
          <PulseStrip
            sleepToday={sleepToday}
            sleepTarget={sleepTarget}
            feedsToday={feedsToday}
            hoursSinceLastFeedVal={hoursSinceLast}
          />
        </div>
      )}

      <Spacer h={10} />

      {/* ── Quick actions — 3 large tiles ── */}
      {childId && (
        <div style={{ padding: '0 16px' }}>
          <HRow gap={8}>
            <QuickAction
              icon="bottle"
              label="Feed"
              sub={feedsToday > 0 ? `${feedsToday} today` : 'Log first'}
              onClick={() => navigate(`/child/${childId}/food`)}
              aria-label={`Log a feed. ${feedsToday} feeds today.`}
            />
            <QuickAction
              icon="moon"
              label="Sleep"
              sub={sleepToday != null ? `${sleepToday}h logged` : 'Tap to log'}
              accent="#EBF4FF"
              onClick={() => setSleepSheetOpen(true)}
              aria-label={sleepToday != null ? `Sleep logged: ${sleepToday} hours` : 'Log sleep'}
            />
            <QuickAction
              icon="sparkle"
              label="Bloom"
              sub="Path"
              accent="#FAF1E2"
              onClick={() => navigate(`/child/${childId}/bloom`)}
              aria-label="Open Bloom Path — guided developmental growth"
            />
            <QuickAction
              icon="chart"
              label="Growth"
              sub="Weight, height"
              onClick={() => navigate(`/child/${childId}/growth`)}
              aria-label="Track growth measurements"
            />
          </HRow>
        </div>
      )}

      {/* ── Repeat last feed — only if there's something to repeat ── */}
      {childId && lastFeedFromRecent && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
            <RepeatLastFeedCard
              lastFeed={lastFeedFromRecent}
              onRepeat={repeat}
              isRepeating={isRepeating}
              justSaved={justSaved}
              onUndo={undo}
            />
          </div>
        </>
      )}

      {/* ── Repeat last sleep — only when no sleep today AND we have past data ── */}
      {childId && showSleepRepeat && (
        <>
          <Spacer h={10} />
          <div style={{ padding: '0 16px' }}>
            <RepeatLastSleepCard
              lastSleep={sleep.lastSleep}
              onRepeat={sleep.repeat}
              isRepeating={sleep.isRepeating}
              justSaved={sleep.justSaved}
              onUndo={sleep.undo}
            />
          </div>
        </>
      )}

      {/* ── Today's timeline ── */}
      {childId && (
        <>
          <Spacer h={24} />
          <div style={{ padding: '0 16px' }}>
            <SectionLabel title="Today" trailing={timelineEvents.length > 0 ? 'See all' : null} onTrailing={() => navigate(`/child/${childId}/updates`)} />
            <TodayTimeline
              events={timelineEvents}
              onEmpty={() => navigate(`/child/${childId}/food`)}
            />
          </div>
        </>
      )}

      {/* ── Milestone (only when meaningful) ── */}
      {childId && milestone && (
        <>
          <Spacer h={20} />
          <div style={{ padding: '0 16px' }}>
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
                <Ring
                  value={milestone.progress}
                  size={54}
                  stroke={5}
                  label={`${Math.round(milestone.progress * 100)}`}
                />
              </HRow>
              {!milestone.onTrack && (
                <Body size={11} color="#B45309" style={{ marginTop: 10 }}>
                  Past typical window — worth mentioning at your next visit.
                </Body>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ── Vaccine nudge (compact, only ≤14 days) ── */}
      {nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 14 && nextVaccineDays > 1 && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
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
          </div>
        </>
      )}

      {/* ── Achievements (compact) ── */}
      {unlockedKeys.size > 0 && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
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
          </div>
        </>
      )}

      {/* ── No-child state ── */}
      {!childId && user && (
        <>
          <Spacer h={26} />
          <div style={{ padding: '0 16px', textAlign: 'center' }}>
            <Display size={20} italic weight={400} style={{ marginBottom: 8 }}>Add your child to begin</Display>
            <Body size={14} color={T.ink500} style={{ marginBottom: 20 }}>Bloom personalizes everything from this moment.</Body>
            <Button onClick={() => navigate('/onboarding')}>Add child</Button>
          </div>
        </>
      )}

      {/* ── Save account nudge for anonymous users ── */}
      {user?.is_anonymous && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
            <Card p={14} style={{ border: `0.5px solid ${T.ink100}`, background: T.surface }}>
              <HRow gap={12} align="center">
                <div style={{ width: 30, height: 30, borderRadius: 10, background: T.brandWash, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.brand, flexShrink: 0 }}>
                  <CBIcon name="shield" size={14} />
                </div>
                <Stack gap={1} style={{ flex: 1 }}>
                  <Body size={12} color={T.ink900} weight={600}>Back up your data</Body>
                  <Body size={11} color={T.ink500}>Sign in to access from any device.</Body>
                </Stack>
                <Chip tone="brand" onClick={() => navigate('/auth')}>Sign in</Chip>
              </HRow>
            </Card>
          </div>
        </>
      )}

      <Spacer h={32} />

      {/* ── Floating SOS — discreet, always reachable ── */}
      <FloatingSOS onClick={() => navigate('/emergency')} />

      {/* ── Quick sleep log sheet ── */}
      {childId && (
        <SleepQuickSheet
          open={sleepSheetOpen}
          onClose={() => setSleepSheetOpen(false)}
          childId={childId}
        />
      )}
    </div>
  );
}
