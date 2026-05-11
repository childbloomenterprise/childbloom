import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { differenceInDays, format } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button, ProgressBar,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  Avatar, BloomFlower,
  Ring, Spark, TripleArc,
  TimelineEntry, QuickTile,
} from '../../components/cb/primitives';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getBloomNote(child, ageInDays) {
  const name = child?.name || 'your little one';
  if (!ageInDays) return `Welcome to ChildBloom. Let's set up ${name}'s profile.`;
  if (ageInDays <= 7)   return `${name} is in their first week — skin-to-skin and feeding are everything right now.`;
  if (ageInDays <= 14)  return `${name} is regaining birth weight this week. Feeding often is exactly right.`;
  if (ageInDays <= 21)  return `${name}'s hearing is now fully developed — they can recognize your voice distinctly.`;
  if (ageInDays <= 30)  return `${name} is on day ${ageInDays} — first social smiles are days away. Watch those eyes today.`;
  if (ageInDays <= 60)  return `${name} is starting to track faces and coo. Talk to them often.`;
  if (ageInDays <= 90)  return `${name} is building head control. Tummy time helps — even 5 minutes counts.`;
  if (ageInDays <= 180) return `${name} is approaching the sitting milestone. Lots to celebrate this month.`;
  if (ageInDays <= 365) return `${name} is close to their first year. Every word you say is building vocabulary.`;
  return `${name} is growing beautifully. You're doing great.`;
}

function getTodayPhrase(ageInDays) {
  const h = new Date().getHours();
  if (!ageInDays) return 'is ready to be discovered';
  if (h < 10) return 'had a gentle morning';
  if (h < 14) return 'is having a calm day';
  if (h < 18) return 'had a curious afternoon';
  return 'is winding down';
}

// Hero card — flower variant. Bloom score + insight + 3 stats with progress bars.
function HeroBloom({ score, insight, stats }) {
  return (
    <Card p={20} className="bloom-card-in card-shimmer" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.85, pointerEvents: 'none', animation: 'bloom-breathe 4s ease-in-out infinite' }}>
        <BloomFlower size={220} />
      </div>
      <Eyebrow color={T.brand}>Today · Bloom score</Eyebrow>
      <Spacer h={6} />
      <Display size={44} italic weight={300} className="animate-count-in">
        {score}
        <span style={{ fontSize: 20, opacity: 0.5 }}>/100</span>
      </Display>
      <Spacer h={10} />
      <Body size={13} color={T.ink500} style={{ maxWidth: 240 }}>{insight}</Body>
      <Spacer h={16} />
      <HRow gap={10}>
        {stats.map((s, i) => (
          <Stat key={i} {...s} />
        ))}
      </HRow>
    </Card>
  );
}

function Stat({ label, value, target, pct = 0.7, color }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Eyebrow color={T.ink400}>{label}</Eyebrow>
      <Spacer h={6} />
      <HRow gap={3} align="baseline">
        <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: T.ink900, fontWeight: 500 }}>{value}</div>
        {target && <Mono size={9}>{target}</Mono>}
      </HRow>
      <Spacer h={6} />
      <ProgressBar value={pct} color={color} />
    </div>
  );
}

function CoachCard({ eyebrow, title, body, onOpen }) {
  return (
    <Card p={16} style={{ minWidth: 240, maxWidth: 240, flexShrink: 0 }}>
      <Eyebrow color={T.brand}>{eyebrow}</Eyebrow>
      <Spacer h={6} />
      <div style={{ fontFamily: FONTS.serif, fontSize: 17, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.02em' }}>{title}</div>
      <Spacer h={8} />
      <Body size={12} color={T.ink500} lh={1.45}>{body}</Body>
      <Spacer h={12} />
      <HRow gap={6}>
        <Chip tone="wash" icon="arrow-right" onClick={onOpen}>Open</Chip>
      </HRow>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const user = useAuthStore((s) => s.user);
  const childId = child?.id;
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('child_id', childId)
        .eq('logged_date', format(new Date(), 'yyyy-MM-dd'))
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
        .eq('logged_date', format(new Date(), 'yyyy-MM-dd'))
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
        .order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!childId,
  });

  const feedsToday   = foodLogs.length;
  const feedsTarget  = ageInDays && ageInDays <= 60 ? 8 : 6;
  const sleepToday   = sleepLogs[0]?.hours_slept ?? null;
  const sleepTarget  = ageInDays && ageInDays <= 90 ? 14 : 12;
  const nextVaccine  = vaccines[0];
  const nextVaccineDays = nextVaccine?.next_due
    ? differenceInDays(new Date(nextVaccine.next_due), new Date()) : null;

  const bloomNote   = getBloomNote(child, ageInDays);
  const parentName  = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Composite Bloom score (rough wellness % from sleep + feeds + check-in)
  const sleepPct = sleepToday ? Math.min(sleepToday / sleepTarget, 1) : 0.5;
  const feedPct  = Math.min(feedsToday / feedsTarget, 1);
  const checkPct = latestUpdate ? 1 : 0.5;
  const score    = Math.round((sleepPct * 0.4 + feedPct * 0.4 + checkPct * 0.2) * 100);

  const quickTiles = [
    { icon: 'bottle',    label: 'Feed',      color: T.brandWash,  path: childId ? `/child/${childId}/food` : null },
    { icon: 'moon',      label: 'Sleep',     color: T.brandWash,  path: childId ? `/child/${childId}/weekly-update` : null },
    { icon: 'drop',      label: 'Diaper',    color: T.accentSoft, path: childId ? `/child/${childId}/weekly-update` : null },
    { icon: 'chart',     label: 'Growth',    color: T.brandWash,  path: childId ? `/child/${childId}/growth` : null },
    { icon: 'pill',      label: 'Meds',      color: T.accentSoft, path: childId ? `/child/${childId}/health` : null },
    { icon: 'sun',       label: 'Mood',      color: T.brandWash,  path: childId ? `/child/${childId}/weekly-update` : null },
    { icon: 'sparkle',   label: 'Milestone', color: T.brandWash,  path: childId ? `/child/${childId}/development` : null },
    { icon: 'edit',      label: 'Note',      color: T.surfaceDim, path: childId ? `/child/${childId}/weekly-update` : null },
  ];

  const childInitial = child?.name?.[0] || 'B';

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 0' }}>
        <HRow gap={12} align="center" justify="space-between">
          <HRow gap={10} align="center">
            <Avatar name={childInitial} size={42} />
            <Stack gap={1}>
              <Body size={11} color={T.ink400} weight={500}>{getGreeting()}, {parentName}</Body>
              <div style={{ fontFamily: FONTS.serif, fontSize: 19, color: T.ink900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{child?.name || 'your little one'}</span>{' '}
                {getTodayPhrase(ageInDays)}.
              </div>
            </Stack>
          </HRow>
          <HRow gap={6}>
            <ChromeBtn icon="bell" badge={!!nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 7} />
            <ChromeBtn icon="settings" onClick={() => navigate('/settings')} />
          </HRow>
        </HRow>
      </div>

      <Spacer h={18} />

      {/* Hero */}
      <div style={{ padding: '0 16px' }}>
        <HeroBloom
          score={score}
          insight={bloomNote}
          stats={[
            { label: 'Sleep', value: sleepToday ? `${sleepToday}h` : '—', target: `/ ${sleepTarget}h`, pct: sleepPct, color: T.brandSoft },
            { label: 'Feeds', value: `${feedsToday}`, target: `/ ${feedsTarget}`, pct: feedPct, color: T.accent },
            { label: 'Check-in', value: latestUpdate ? '✓' : '—', pct: checkPct, color: T.gold },
          ]}
        />
      </div>

      {/* Quick log */}
      {childId && (
        <>
          <Spacer h={24} />
          <div style={{ padding: '0 16px' }}>
            <SectionLabel title="Log in one tap" trailing="Voice" />
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {quickTiles.map((q) => (
                <QuickTile
                  key={q.label}
                  icon={q.icon}
                  label={q.label}
                  color={q.color}
                  onClick={() => q.path && navigate(q.path)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI insight */}
      <Spacer h={26} />
      <div style={{ padding: '0 16px' }}>
        <Card p={18} style={{ position: 'relative', overflow: 'hidden' }} className="card-shimmer">
          <HRow gap={8} align="center" style={{ marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, background: T.brandWash,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'bloom-breathe 2.4s ease-in-out infinite',
            }}>
              <CBLogoMark size={14} color={T.brand} />
            </div>
            <Eyebrow color={T.brand}>Dr. Bloom · just now</Eyebrow>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: T.brand,
              animation: 'pulse-live 2s ease-out infinite',
            }} />
          </HRow>
          <div style={{
            fontFamily: FONTS.serif, fontSize: 17, fontStyle: 'italic', color: T.ink900,
            lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: 14,
          }}>
            "{bloomNote}"
          </div>
          <HRow gap={8}>
            <Chip tone="wash" icon="sparkle" onClick={() => navigate('/ask')}>Ask follow-up</Chip>
            <Chip tone="soft" icon="check">Got it</Chip>
            <Chip tone="soft" icon="bell">Remind me</Chip>
          </HRow>
        </Card>
      </div>

      {/* Today's rhythm */}
      {childId && (
        <>
          <Spacer h={26} />
          <div style={{ padding: '0 16px' }}>
            <SectionLabel title={`Today with ${child?.name}`} trailing="See all" onTrailing={() => navigate(`/child/${childId}/updates`)} />
            <Card p={14}>
              {[
                { icon: 'bottle',    color: T.brandWash,  title: 'Log a feed',      sub: `${feedsToday} logged today`,        path: `/child/${childId}/food`,          done: feedsToday > 0 },
                { icon: 'clipboard', color: '#FFF1E8',     title: 'Daily check-in',  sub: '2 min · Dr. Bloom listens',         path: `/child/${childId}/weekly-update`, done: !!latestUpdate },
                { icon: 'chart',     color: '#EBF4FF',     title: 'Growth tracking', sub: 'Weight, height, head',              path: `/child/${childId}/growth`,        done: false },
              ].map((it, i, arr) => (
                <div key={i}>
                  <TimelineEntry
                    time={it.done ? '✓' : '·'}
                    title={it.title}
                    sub={it.sub}
                    icon={it.icon}
                    color={it.color}
                    onClick={() => navigate(it.path)}
                  />
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* Development journey — milestone ring + spark */}
      {childId && ageInDays !== null && (
        <>
          <Spacer h={26} />
          <div style={{ padding: '0 16px' }}>
            <SectionLabel title="Development journey" trailing="See chart" onTrailing={() => navigate(`/child/${childId}/development`)} />
            <Card p={18}>
              <HRow justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Eyebrow color={T.brand}>Next milestone</Eyebrow>
                  <Display size={22} italic weight={400}>
                    {ageInDays <= 90 ? 'Rolling over' :
                     ageInDays <= 180 ? 'Sitting unsupported' :
                     ageInDays <= 365 ? 'First steps' :
                     'First sentences'}
                  </Display>
                  <Body size={12} color={T.ink500}>
                    typically in {ageInDays <= 90 ? 12 : ageInDays <= 180 ? 9 : 7} days · 73% confident
                  </Body>
                </Stack>
                <Ring value={0.73} size={60} stroke={6} label="73" />
              </HRow>
              <Spacer h={14} />
              <Spark points={[3, 4, 4, 5, 5, 6, 7, 7, 8]} w={300} h={42} dots />
              <Spacer h={6} />
              <HRow justify="space-between">
                <Mono size={9}>WK {Math.max(1, Math.floor(ageInDays / 7) - 4)}</Mono>
                <Mono size={9}>WK {Math.max(1, Math.floor(ageInDays / 7))}</Mono>
              </HRow>
            </Card>
          </div>
        </>
      )}

      {/* Parent intelligence — horizontal scroll coach cards */}
      {childId && (
        <>
          <Spacer h={26} />
          <div style={{ padding: '0 16px' }}>
            <SectionLabel title="Parent intelligence" />
            <HRow gap={10} style={{ overflowX: 'auto', paddingBottom: 4, marginRight: -16 }}>
              <CoachCard
                eyebrow="Is this normal?"
                title="Cluster feeds at your stage"
                body="Many babies eat more often as a developmental leap approaches."
                onOpen={() => navigate('/ask')}
              />
              <CoachCard
                eyebrow="Reassurance"
                title="You're on rhythm"
                body="Your check-ins are landing within minutes of your usual wind-down."
                onOpen={() => navigate('/ask')}
              />
              <CoachCard
                eyebrow="Coaching"
                title="Try slightly earlier bath"
                body="A 12-minute earlier bath often pulls the bedtime window forward."
                onOpen={() => navigate('/ask')}
              />
            </HRow>
          </div>
        </>
      )}

      {/* Vaccine nudge */}
      {nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 30 && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
            <Card
              p={14}
              tone="surface"
              onClick={() => navigate(`/child/${childId}/vaccinations`)}
              style={{
                background: 'rgba(201,163,90,0.08)',
                boxShadow: '0 0 0 1px rgba(201,163,90,0.25)',
              }}
            >
              <HRow gap={10}>
                <div style={{
                  width: 34, height: 34, borderRadius: RADIUS.sm, background: 'rgba(201,163,90,0.16)',
                  color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CBIcon name="shield" size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <Eyebrow color={T.gold}>
                    Next vaccine · {nextVaccineDays === 0 ? 'today' : `in ${nextVaccineDays} day${nextVaccineDays !== 1 ? 's' : ''}`}
                  </Eyebrow>
                  <Body size={13} color={T.ink900} weight={600} style={{ marginTop: 2 }}>{nextVaccine.vaccine_name}</Body>
                </div>
                <CBIcon name="chevron-right" size={16} style={{ color: T.ink200 }} />
              </HRow>
            </Card>
          </div>
        </>
      )}

      {/* Streak */}
      {latestUpdate && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
            <Card p={18} tone="warm" style={{ border: `1px solid rgba(201,163,90,0.18)` }}>
              <HRow gap={14} align="center">
                <div style={{
                  width: 52, height: 52, borderRadius: RADIUS.md, background: T.gold,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                }}>
                  <CBIcon name="flame" size={24} stroke={1.8} />
                </div>
                <div>
                  <Eyebrow color={T.gold}>Streak</Eyebrow>
                  <div style={{
                    fontFamily: FONTS.serif, fontSize: 17, fontStyle: 'italic', color: T.ink900, marginTop: 2,
                  }}>You showed up. That matters.</div>
                </div>
              </HRow>
            </Card>
          </div>
        </>
      )}

      {/* No-child state */}
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

      {/* SOS */}
      <Spacer h={14} />
      <div style={{ padding: '0 16px' }}>
        <button
          onClick={() => navigate('/emergency')}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
            border: 'none', borderRadius: RADIUS.lg, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(185,28,28,0.22)',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff',
          }}>
            <CBIcon name="siren" size={18} stroke={2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Emergency First-Aid</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>CPR, choking, burns, seizures &amp; more</div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.2)',
            padding: '4px 8px', borderRadius: 999, letterSpacing: '0.06em',
          }}>SOS</div>
        </button>
      </div>

      {/* Save account nudge — only shown to anonymous users */}
      {user?.is_anonymous && (
        <>
          <Spacer h={14} />
          <div style={{ padding: '0 16px' }}>
            <Card p={16} style={{ border: `1px solid ${T.ink100}`, background: T.surface }}>
              <HRow gap={12} align="center">
                <div style={{
                  width: 34, height: 34, borderRadius: RADIUS.sm, background: T.brandWash,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.brand, flexShrink: 0,
                }}>
                  <CBIcon name="shield" size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <Body size={13} color={T.ink900} weight={600}>Back up your data</Body>
                  <Body size={11} color={T.ink500} style={{ marginTop: 2 }}>
                    Create a free account to access from any device.
                  </Body>
                </div>
                <Chip tone="brand" onClick={() => navigate('/onboarding?upgrade=true')}>Save</Chip>
              </HRow>
            </Card>
          </div>
        </>
      )}

      <Spacer h={32} />
    </div>
  );
}
