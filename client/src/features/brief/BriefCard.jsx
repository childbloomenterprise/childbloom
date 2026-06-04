// Daily Bloom Brief — the morning retention card.
//
// A warm, personalised card about THIS child for today, generated overnight by
// the cron (api/agent/cron.js) and read here via /api/brief/today. Free for all
// users — this is the reason to open ChildBloom daily, not a paywall.
//
// States:
//   loading            → gentle skeleton
//   brief present       → full card with read-aloud
//   no brief yet (null) → renders nothing (keeps the dashboard clean until the
//                         cron writes the first one)

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import api from '../../lib/api';
import { track } from '../../lib/analytics';
import { T, FONTS } from '../../components/cb/tokens';
import { Card, Eyebrow, Body, Spacer, Mono } from '../../components/cb/primitives';
import SpeakerButton from '../../components/SpeakerButton';

function BriefSkeleton() {
  const bar = (w) => (
    <div style={{
      height: 12, width: w, borderRadius: 6,
      background: T.ink100, opacity: 0.7,
      animation: 'bloom-breathe 1.8s ease-in-out infinite',
    }} />
  );
  return (
    <Card p={22} aria-busy="true" aria-label="Loading today's brief">
      {bar('40%')}
      <Spacer h={12} />
      {bar('85%')}
      <Spacer h={8} />
      {bar('70%')}
    </Card>
  );
}

function Line({ label, text, color }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <Mono size={10} color={color} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </Mono>
      <Spacer h={3} />
      <Body size={13} color={T.ink700} lh={1.5} style={{ maxWidth: 340 }}>{text}</Body>
    </div>
  );
}

export default function BriefCard({ child }) {
  const { t, i18n } = useTranslation();
  const childId = child?.id;
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ['daily-brief', childId],
    enabled: !!childId,
    staleTime: 30 * 60 * 1000, // a brief is good for the whole morning
    queryFn: async () => {
      // api unwraps response.data → { brief: {...} | null }
      const res = await api.get('/api/brief/today', { params: { childId } });
      return res?.brief ?? null;
    },
  });

  // Fire the view event once, when a real brief first appears.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (data && !viewedRef.current) {
      viewedRef.current = true;
      track('daily_brief_viewed', { child_age_days: ageInDays });
    }
  }, [data, ageInDays]);

  if (!childId) return null;
  if (isLoading) return <BriefSkeleton />;
  if (!data) return null; // no brief yet — stay quiet until the cron writes one

  const ttsText = [data.title, data.expect_this_week, data.tip, data.reassurance]
    .filter(Boolean)
    .join('. ');

  return (
    <Card
      p={22}
      className="bloom-card-in"
      role="region"
      aria-label={t('brief.aria', 'Today\'s Bloom Brief')}
      style={{ background: T.brandWash, border: `0.5px solid ${T.brandSoft}30` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Eyebrow color={T.brand}>{t('brief.label', 'Today with')} {child?.name || ''}</Eyebrow>
        <span onClickCapture={() => track('daily_brief_read_aloud', { child_age_days: ageInDays })}>
          <SpeakerButton text={ttsText} language={(data.lang || i18n.language || 'en')} size={40} />
        </span>
      </div>
      <Spacer h={6} />
      <div style={{
        fontFamily: FONTS.serif, fontSize: 22, fontStyle: 'italic', fontWeight: 500,
        letterSpacing: '-0.02em', lineHeight: 1.2, color: T.ink900, maxWidth: 340,
      }}>
        {data.title}
      </div>

      <Line label={t('brief.expectLabel', 'This week')} text={data.expect_this_week} color={T.brand} />
      <Line label={t('brief.tipLabel', 'Try today')} text={data.tip} color={T.gold} />
      <Line label={t('brief.reassuranceLabel', 'Totally normal')} text={data.reassurance} color={T.brandSoft} />
    </Card>
  );
}
