// Timeline view — combines today's logs (feeds, sleep, weekly check-ins) into a
// chronological timeline grouped by Morning/Afternoon/Evening, with a day strip
// header and recent journal entries (weekly_updates) below.
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import { format, differenceInDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button, Body, Eyebrow, Display, Mono,
  HRow, Stack, Spacer, Divider, SectionLabel, ChromeBtn,
  Avatar, AIBubble, TimelineEntry,
} from '../../components/cb/primitives';
import TodayHub from '../dashboard/TodayHub';

const COLOR_BY_KIND = {
  feed:      T.brandWash,
  sleep:     T.brandTint,
  diaper:    T.surfaceDim,
  milestone: T.accentSoft,
  mood:      T.cream,
  note:      T.surfaceDim,
  checkin:   T.brandWash,
};

function bucketForHour(h) {
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function UpdateHistoryPage() {
  const { id: childId } = useParams();
  const navigate = useNavigate();
  const { data: child } = useChildById(childId);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Today's logs
  const { data: todayFeeds = [] } = useQuery({
    queryKey: ['timeline-feeds', childId, format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId).eq('logged_date', format(today, 'yyyy-MM-dd'))
        .order('logged_at', { ascending: true });
      return data || [];
    },
    enabled: !!childId,
  });

  const { data: todaySleeps = [] } = useQuery({
    queryKey: ['timeline-sleeps', childId, format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data } = await supabase.from('sleep_logs').select('*')
        .eq('child_id', childId).eq('logged_date', format(today, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!childId,
  });

  // Recent check-ins (journal)
  const { data: updates = [] } = useQuery({
    queryKey: ['weekly-updates', childId],
    queryFn: async () => {
      const { data } = await supabase.from('weekly_updates').select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!childId,
  });

  // Build today's timeline events
  const events = [];
  todayFeeds.forEach((f) => {
    const ts = new Date(f.logged_at);
    events.push({
      time: format(ts, 'HH:mm'),
      kind: 'feed',
      title: f.feed_type ? `${f.feed_type} feed` : 'Feed',
      sub: [f.duration_min ? `${f.duration_min} min` : null, f.amount_ml ? `${f.amount_ml} ml` : null].filter(Boolean).join(' · '),
      bucket: bucketForHour(ts.getHours()),
    });
  });
  todaySleeps.forEach((s) => {
    const ts = new Date(s.created_at);
    events.push({
      time: format(ts, 'HH:mm'),
      kind: 'sleep',
      title: s.hours_slept ? `Sleep · ${s.hours_slept}h` : 'Sleep',
      sub: s.notes || '',
      bucket: bucketForHour(ts.getHours()),
    });
  });
  events.sort((a, b) => a.time.localeCompare(b.time));

  const buckets = {
    Morning:   events.filter(e => e.bucket === 'Morning'),
    Afternoon: events.filter(e => e.bucket === 'Afternoon'),
    Evening:   events.filter(e => e.bucket === 'Evening'),
  };

  const childName = child?.name || 'your child';
  const childInitial = (childName || 'A')[0]?.toUpperCase();

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 56 }}>

      {/* Top bar */}
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={childInitial} size={36} />
        <div style={{ flex: 1 }}>
          <Body size={12} color={T.ink400}>{format(today, 'EEEE · d MMM')}</Body>
          <Display size={26} italic weight={400} lh={1.1}>Timeline</Display>
        </div>
        <ChromeBtn icon="search" />
        <ChromeBtn icon="menu" />
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Day strip */}
        <Card p={14}>
          <HRow gap={6} justify="space-between">
            {weekDays.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <Stack key={i} gap={6} align="center" style={{ flex: 1 }}>
                  <Mono size={9} color={T.ink400}>{format(d, 'EEEEE')}</Mono>
                  <div style={{
                    width: 30, height: 30, borderRadius: 999,
                    background: isToday ? T.brand : 'transparent',
                    color: isToday ? '#fff' : T.ink700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONTS.serif, fontSize: 14,
                  }}>{format(d, 'd')}</div>
                  <div style={{
                    height: 4, width: 20,
                    background: d <= today ? T.brandSoft : T.ink100,
                    borderRadius: 2,
                  }} />
                </Stack>
              );
            })}
          </HRow>
        </Card>

        <Spacer h={18} />

        {/* Today's rich stack — moved off Home to keep Home calm (Apple deference). */}
        {childId && (
          <>
            <TodayHub child={child} />
            <Spacer h={24} />
          </>
        )}

        {/* Empty today */}
        {events.length === 0 && (
          <Card p={20} tone="warm" style={{ textAlign: 'center' }}>
            <CBIcon name="sparkle" size={28} stroke={1.6} style={{ color: T.brand, opacity: 0.7 }} />
            <Spacer h={10} />
            <Display size={18} italic weight={400}>Nothing logged yet today</Display>
            <Spacer h={6} />
            <Body size={13} color={T.ink500}>Tap a quick-log tile on the home tab to start your rhythm.</Body>
            <Spacer h={14} />
            <Button size="sm" onClick={() => navigate('/dashboard')}>Go to home</Button>
          </Card>
        )}

        {/* Buckets */}
        {events.length > 0 && Object.entries(buckets).map(([label, items]) => (
          items.length === 0 ? null : (
            <div key={label} style={{ marginBottom: 16 }}>
              <HRow gap={8} align="center" style={{ padding: '4px 4px 8px' }}>
                <CBIcon name={label === 'Evening' ? 'moon' : 'sun'} size={14} style={{ color: T.ink400 }} />
                <Eyebrow>{label}</Eyebrow>
                <div style={{ flex: 1, height: 1, background: T.line }} />
                <Mono size={9} color={T.ink400}>{items.length}</Mono>
              </HRow>
              <Card p={14}>
                {items.map((it, i) => (
                  <div key={i}>
                    <TimelineEntry
                      time={it.time}
                      title={it.title}
                      sub={it.sub}
                      icon={it.kind === 'feed' ? 'bottle' : it.kind === 'sleep' ? 'moon' : 'sparkle'}
                      color={COLOR_BY_KIND[it.kind]}
                    />
                    {i < items.length - 1 && <Divider />}
                  </div>
                ))}
              </Card>
            </div>
          )
        ))}

        {/* Bloom insight teaser */}
        {events.length >= 3 && (
          <>
            <AIBubble lead="Bloom · pattern" sparkle tone="brand">
              You've logged {events.length} events today — that's plenty for Bloom to start finding rhythms. Open Dr. Bloom for a full reading.
            </AIBubble>
            <Spacer h={16} />
          </>
        )}

        {/* Past check-ins */}
        {updates.length > 0 && (
          <>
            <SectionLabel
              title={`${childName}'s journal`}
              trailing="New check-in"
              onTrailing={() => navigate(`/child/${childId}/weekly-update`)}
            />
            <Stack gap={10}>
              {updates.map((u) => (
                <Card key={u.id} p={14}>
                  <HRow justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <HRow gap={8} align="center" style={{ marginBottom: 4 }}>
                        <Body size={13} weight={600} color={T.ink900}>
                          {format(new Date(u.week_date || u.created_at), 'EEE · d MMM')}
                        </Body>
                        {u.mood && (
                          <Chip tone="wash" style={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}>
                            {String(u.mood).replace('_', ' ')}
                          </Chip>
                        )}
                      </HRow>
                      <HRow gap={10}>
                        {u.weight_kg && <Mono size={10}>{u.weight_kg} kg</Mono>}
                        {u.height_cm && <Mono size={10}>{u.height_cm} cm</Mono>}
                        {u.sleep_hours && <Mono size={10}>{u.sleep_hours}h sleep</Mono>}
                      </HRow>
                      {u.ai_insight && (
                        <Body size={12} color={T.ink500} style={{ marginTop: 8, fontStyle: 'italic' }}>
                          {u.ai_insight}
                        </Body>
                      )}
                    </div>
                    <CBIcon name="chevron-right" size={14} style={{ color: T.ink200, marginTop: 4 }} />
                  </HRow>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {updates.length === 0 && events.length === 0 && (
          <>
            <Spacer h={16} />
            <Card p={20} style={{ textAlign: 'center' }}>
              <Display size={20} italic weight={400}>{childName}'s first check-in is waiting</Display>
              <Spacer h={8} />
              <Body size={13} color={T.ink500}>
                Three minutes — mood, sleep, milestones, feeding. Dr. Bloom will have something personal to say at the end.
              </Body>
              <Spacer h={16} />
              <Button onClick={() => navigate(`/child/${childId}/weekly-update`)}>
                Start {childName}'s first check-in
              </Button>
            </Card>
          </>
        )}

        <Spacer h={32} />
      </div>
    </div>
  );
}
