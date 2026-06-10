// DashboardPage — the Home tab.
//
// Apple's deference principle: the home screen stays calm, instant and
// content-light. It carries only what a parent needs the second they open the
// app — who they're caring for, how old that child is today, and the four
// one-tap ways to log. Every richer surface (the morning Brief, the insight
// card, pulse numbers, SweetSpot, voice logging, repeats, milestones, vaccine
// nudges, achievements) now lives on the Timeline tab via <TodayHub/>.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { useInbox } from '../../hooks/useInbox';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button,
  Display, Body,
  Stack, HRow, Spacer, ChromeBtn, Avatar,
} from '../../components/cb/primitives';
import SleepQuickSheet from './SleepQuickSheet';
import useHomePulse from './useHomePulse';
import { getWarmGreeting } from '../../lib/homePulse';

// Human, warm age line — "10 days old", "6 weeks old", "14 months old".
export function formatChildAge(dob) {
  if (!dob) return null;
  const days = differenceInDays(new Date(), new Date(dob));
  if (days < 0) return null;
  if (days === 0) return 'born today';
  if (days < 7)   return `${days} day${days !== 1 ? 's' : ''} old`;
  if (days < 56)  { const w = Math.round(days / 7);  return `${w} week${w !== 1 ? 's' : ''} old`; }
  if (days < 730) { const m = Math.round(days / 30.4375); return `${m} month${m !== 1 ? 's' : ''} old`; }
  const y = Math.floor(days / 365.25);
  const remM = Math.round((days - y * 365.25) / 30.4375);
  return remM > 0 ? `${y}y ${remM}m old` : `${y} year${y !== 1 ? 's' : ''} old`;
}

// One large quick-log tile. Generous tap target, quiet surface, single accent.
function QuickTile({ icon, label, sub, onClick, accent, tint, ...aria }) {
  return (
    <button
      onClick={onClick}
      {...aria}
      style={{
        padding: '20px 16px', borderRadius: RADIUS.lg,
        background: T.surface, border: `0.5px solid ${T.line}`,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
        cursor: 'pointer', fontFamily: FONTS.sans, color: T.ink900,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minHeight: 116, textAlign: 'left',
        boxShadow: '0 1px 2px rgba(11,23,20,0.04)',
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(11,23,20,0.04)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: tint || T.brandWash, color: accent || T.brand,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CBIcon name={icon} size={22} stroke={1.9} />
      </div>
      <Stack gap={2}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.ink900, letterSpacing: '-0.01em' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.ink400 }}>{sub}</div>}
      </Stack>
    </button>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const user = useAuthStore((s) => s.user);
  const childId = child?.id;
  const { pendingCount } = useInbox();
  const [sleepSheetOpen, setSleepSheetOpen] = useState(false);

  const parentName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const childInitial = child?.name?.[0] || 'B';
  const ageLabel = formatChildAge(child?.date_of_birth);
  const pulse = useHomePulse(childId);

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingBottom: 24 }}>

      {/* ── Header: chrome row ── */}
      <div style={{ padding: '56px 20px 0' }}>
        <HRow gap={12} align="center" justify="space-between">
          <Avatar name={childInitial} size={44} />
          <HRow gap={6}>
            <ChromeBtn icon="bell" badge={pendingCount > 0} onClick={() => navigate('/inbox')} />
            <ChromeBtn icon="settings" onClick={() => navigate('/settings')} />
          </HRow>
        </HRow>
      </div>

      {/* ── The hero: greeting · child · age — the one thing that matters first ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <Body size={13} color={T.ink400} weight={500}>{getWarmGreeting()}, {parentName}</Body>
        <Spacer h={6} />
        <Display size={36} italic weight={500} lh={1.05}>
          {child?.name || 'your little one'}
        </Display>
        {childId && (
          <>
            <Spacer h={6} />
            <Body size={14} color={T.ink500}>
              {ageLabel ? `${ageLabel} · ` : ''}{format(new Date(), 'EEEE')}
              {pulse.streak >= 2 && (
                <span style={{ color: T.gold, fontWeight: 600 }}>
                  {' '}· ✦ {pulse.streak >= 7 ? '7+' : pulse.streak}-day streak
                </span>
              )}
            </Body>
          </>
        )}
      </div>

      {/* ── Four quick-log tiles — the whole point of Home ── */}
      {childId && (
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <QuickTile
              icon="bottle"
              label="Feed"
              sub={pulse.lastFeedAgo
                ? `Last feed · ${pulse.lastFeedAgo}`
                : 'Bottle, breast, pump'}
              onClick={() => navigate(`/child/${childId}/food`)}
              aria-label="Log a feed"
            />
            <QuickTile
              icon="moon"
              label="Sleep"
              sub={pulse.napElapsedMin != null
                ? `● Nap in progress · ${pulse.napElapsedMin < 60
                    ? `${pulse.napElapsedMin}m`
                    : `${Math.floor(pulse.napElapsedMin / 60)}h ${pulse.napElapsedMin % 60}m`}`
                : pulse.sleepHoursToday != null
                  ? `${pulse.sleepHoursToday}h logged today`
                  : 'Start the nap timer'}
              accent="#3B5BDB"
              tint="#EBF4FF"
              onClick={() => setSleepSheetOpen(true)}
              aria-label={pulse.napElapsedMin != null ? 'Nap in progress — open sleep timer' : 'Log sleep'}
            />
            <QuickTile
              icon="sparkle"
              label="Bloom"
              sub="Today's growth play"
              accent="#C9A35A"
              tint="#FAF1E2"
              onClick={() => navigate(`/child/${childId}/bloom`)}
              aria-label="Open Bloom Path"
            />
            <QuickTile
              icon="chart"
              label="Growth"
              sub={pulse.latestWeightKg != null
                ? `Last · ${pulse.latestWeightKg} kg`
                : 'Weight & height'}
              onClick={() => navigate(`/child/${childId}/growth`)}
              aria-label="Track growth measurements"
            />
          </div>

          {/* Rhythm whisper — gentle prediction from this week's real feeds */}
          {pulse.nextFeed && (
            <Body
              size={12}
              color={T.ink400}
              style={{ marginTop: 14, textAlign: 'center' }}
              aria-live="polite"
            >
              {pulse.nextFeed.at <= new Date()
                ? `${child?.name || 'Baby'} is usually fed around now`
                : `Next feed usually around ${format(pulse.nextFeed.at, 'h:mm a')}`}
              {' · '}from this week's rhythm
            </Body>
          )}
        </div>
      )}

      {/* ── No-child state ── */}
      {!childId && user && (
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <Display size={20} italic weight={400} style={{ marginBottom: 8 }}>Add your child to begin</Display>
          <Body size={14} color={T.ink500} style={{ marginBottom: 20 }}>Bloom personalizes everything from this moment.</Body>
          <Button onClick={() => navigate('/onboarding')}>Add child</Button>
        </div>
      )}

      {/* ── Save-account nudge for anonymous users ── */}
      {user?.is_anonymous && (
        <div style={{ padding: '20px 16px 0' }}>
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
      )}

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
