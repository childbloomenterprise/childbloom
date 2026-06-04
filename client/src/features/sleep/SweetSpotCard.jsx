// Sleep SweetSpot card — the all-day, forward-looking nap predictor.
//
// Shows the ideal next nap/bedtime window from the child's age + last wake time.
// Instant + offline-capable for the core calc (no AI). If we don't know when the
// baby last woke, a one-tap "She just woke up" starts the clock (written direct
// to wake_events under RLS — no server needed).

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { differenceInDays, format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { track } from '../../lib/analytics';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Mono, Body, Spacer } from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import { computeSweetSpot } from './sweetSpot';

function fmtRange(start, end) {
  return `${format(start, 'h:mm')}–${format(end, 'h:mm a')}`;
}

function countdownLabel(minutes, t) {
  if (minutes == null) return '';
  if (minutes <= 0) return t('sweetspot.nowWindow', 'in the window now');
  if (minutes < 60) return t('sweetspot.inMins', 'in {{m}} min', { m: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0
    ? t('sweetspot.inHrsMins', 'in {{h}}h {{m}}m', { h, m })
    : t('sweetspot.inHrs', 'in {{h}}h', { h });
}

export default function SweetSpotCard({ child, sleepLogs = [] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const childId = child?.id;
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const { data: wakeEvents = [] } = useQuery({
    queryKey: ['wake-events', childId],
    enabled: !!childId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('wake_events')
        .select('woke_at')
        .eq('child_id', childId)
        .order('woke_at', { ascending: false })
        .limit(1);
      return data || [];
    },
  });

  const logWake = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('wake_events').insert({
        child_id: childId,
        user_id: user.id,
        woke_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wake-events', childId] });
      track('sweetspot_quick_wake_logged', { child_age_days: ageInDays });
      try { navigator.vibrate?.(20); } catch (_) {}
    },
  });

  const spot = computeSweetSpot({ ageInDays, wakeEvents, sleepLogs });

  // Fire the view event once when a real window is shown.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (spot.status !== 'no-wake' && spot.status !== 'unknown-age' && !viewedRef.current) {
      viewedRef.current = true;
      track('sweetspot_viewed', { child_age_days: ageInDays, status: spot.status });
    }
  }, [spot.status, ageInDays]);

  if (!childId || ageInDays == null) return null;

  const caption = t('sweetspot.caption', 'General guidance from age-based wake windows, not medical advice.');

  // No wake recorded → prompt the one-tap.
  if (spot.status === 'no-wake' || spot.status === 'unknown-age') {
    return (
      <Card p={16} style={{ background: '#EBF4FF', border: '0.5px solid #B8D1FA60' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#3B5BDB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CBIcon name="moon" size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Mono size={10} color="#3B5BDB" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sweetspot.eyebrow', 'Next nap')}</Mono>
            <Body size={13} color={T.ink900} weight={600}>{t('sweetspot.prompt', 'When did she last wake up?')}</Body>
          </div>
          <button
            onClick={() => !logWake.isPending && logWake.mutate()}
            disabled={logWake.isPending}
            aria-label={t('sweetspot.justWoke', 'Just woke up')}
            style={{
              padding: '10px 16px', borderRadius: RADIUS.pill, border: 'none',
              background: '#3B5BDB', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: logWake.isPending ? 'default' : 'pointer', fontFamily: FONTS.sans, flexShrink: 0,
            }}
          >
            {t('sweetspot.justWoke', 'Just woke up')}
          </button>
        </div>
        <Spacer h={8} />
        <Body size={10} color={T.ink400} lh={1.4}>{caption}</Body>
      </Card>
    );
  }

  const accent = spot.status === 'overdue' ? '#B45309' : '#3B5BDB';
  const headline = spot.status === 'overdue'
    ? t('sweetspot.overdue', 'Past the ideal window')
    : countdownLabel(spot.minutesUntilStart, t);

  return (
    <Card p={16} style={{ background: '#EBF4FF', border: '0.5px solid #B8D1FA60' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CBIcon name="moon" size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono size={10} color={accent} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sweetspot.eyebrow', 'Next nap')}</Mono>
          <div style={{ fontFamily: FONTS.serif, fontSize: 19, fontStyle: 'italic', color: T.ink900, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {fmtRange(spot.start, spot.end)}
          </div>
          <Body size={11} color={T.ink500}>
            {headline} · {t('sweetspot.lastWoke', 'woke {{time}}', { time: format(spot.lastWake, 'h:mm a') })}
          </Body>
        </div>
        <button
          onClick={() => !logWake.isPending && logWake.mutate()}
          disabled={logWake.isPending}
          aria-label={t('sweetspot.wokeAgain', 'Woke up again')}
          style={{
            padding: '9px 13px', borderRadius: RADIUS.pill, border: `0.5px solid ${accent}`,
            background: 'transparent', color: accent, fontSize: 12, fontWeight: 600,
            cursor: logWake.isPending ? 'default' : 'pointer', fontFamily: FONTS.sans, flexShrink: 0,
          }}
        >
          {t('sweetspot.wokeAgain', 'Woke again')}
        </button>
      </div>
      <Spacer h={8} />
      <Body size={10} color={T.ink400} lh={1.4}>{caption}</Body>
      {/* PREMIUM TODO (Phase 2): full-day predicted nap schedule + AI "why". */}
    </Card>
  );
}
