// BloomRecapCard — the weekly pride moment.
// A compact Timeline card that opens a full-height, screenshot-proud sheet:
// Claude's highlight line, the week's three big numbers, the streak, a
// doctor-ready completeness ring, and the garden tier — wordmark + URL at the
// foot so a screenshot IS the share card. Data comes from weekly_recap
// (written by the Monday cron); viewed-state lives in localStorage.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import useUiStore from '../../stores/uiStore';
import { track } from '../../lib/analytics';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Body, Mono, Spacer, Ring } from '../../components/cb/primitives';
import { computeCompleteness } from '../../lib/completeness';
import { vitalityTier } from '../../lib/gardenVitality';
import { shareToFamily } from '../dashboard/shareHelpers';

const SEEN_KEY = (childId, weekStart) => `cb_recap_seen_${childId}_${weekStart}`;
const MAX_CARD_AGE_DAYS = 10; // card retires mid-week; recap stays in history

function readSeen(childId, weekStart) {
  try { return localStorage.getItem(SEEN_KEY(childId, weekStart)) === '1'; } catch { return false; }
}
function markSeen(childId, weekStart) {
  try { localStorage.setItem(SEEN_KEY(childId, weekStart), '1'); } catch { /* noop */ }
}

function BigStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontFamily: FONTS.serif, fontSize: 34, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      <Mono size={9} color={T.ink400} style={{ letterSpacing: '0.12em', marginTop: 6, display: 'block', textTransform: 'uppercase' }}>
        {label}
      </Mono>
    </div>
  );
}

export default function BloomRecapCard({ childId, childName }) {
  const { t } = useTranslation();
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seenTick, setSeenTick] = useState(0); // re-render after markSeen

  const { data: recap } = useQuery({
    queryKey: ['weekly-recap', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_recap')
        .select('*')
        .eq('child_id', childId)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    },
    enabled: !!childId,
    staleTime: 30 * 60 * 1000,
  });

  if (!recap) return null;

  const ageDays = (Date.now() - Date.parse(recap.week_start)) / 86400000;
  const seen = readSeen(childId, recap.week_start);
  const showCard = !seen && ageDays <= MAX_CARD_AGE_DAYS;
  if (!showCard && !sheetOpen) return null;

  const stats = recap.stats || {};
  const completeness = computeCompleteness(stats);
  const tier = vitalityTier(Math.max(0, Math.min(7, Number(stats.daysLogged) || 0)));
  const weekLabel = format(new Date(recap.week_start), 'd MMM');

  const open = () => {
    setSheetOpen(true);
    openModal();
    markSeen(childId, recap.week_start);
    track('recap_viewed', { weekStart: recap.week_start, daysLogged: stats.daysLogged });
  };
  const close = () => {
    setSheetOpen(false);
    closeModal();
    setSeenTick((n) => n + 1);
  };

  const share = async () => {
    const lines = [
      t('recap.shareTitle', "{{name}}'s week in bloom 🌱", { name: childName || 'Our little one' }),
      recap.highlight || '',
      t('recap.shareStats', '{{feeds}} feeds · {{sleep}}h sleep · {{days}}/7 days logged', {
        feeds: stats.feeds ?? 0, sleep: stats.sleepHours ?? 0, days: stats.daysLogged ?? 0,
      }),
      stats.streakEnd >= 2 ? t('recap.shareStreak', '{{n}}-day logging streak ✦', { n: stats.streakEnd }) : null,
      '— childbloom.in',
    ].filter(Boolean);
    const res = await shareToFamily(lines.join('\n'));
    if (res.ok) track('recap_shared', { method: res.method });
  };

  return (
    <>
      {showCard && (
        <button
          onClick={open}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 14,
            background: `linear-gradient(135deg, ${T.brandWash}, ${T.surface})`,
            border: `0.5px solid ${T.brandSoft}50`, borderRadius: RADIUS.lg,
            padding: '14px 16px', fontFamily: FONTS.sans,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{ fontSize: 24 }} aria-hidden="true">✨</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Body size={13.5} weight={700} color={T.ink900}>
              {t('recap.cardTitle', "{{name}}'s week in bloom is ready", { name: childName || t('recap.yourLittleOne', 'Your little one') })}
            </Body>
            <Body size={12} color={T.ink500} style={{ marginTop: 2 }}>
              {t('recap.cardSub', 'Week of {{week}} — the numbers and a line worth sharing', { week: weekLabel })}
            </Body>
          </div>
          <Mono size={10} color={T.brand} style={{ flexShrink: 0 }}>{t('recap.open', 'Open')} →</Mono>
        </button>
      )}

      {sheetOpen && (
        <>
          <div onClick={close} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.44)', zIndex: 200 }} />
          <div
            role="dialog" aria-modal="true" aria-label={t('recap.aria', 'Weekly Bloom Recap')}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, background: T.bg,
              borderRadius: '28px 28px 0 0', padding: '12px 22px',
              paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 20px), 32px)',
              zIndex: 201, maxHeight: '92dvh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
              fontFamily: FONTS.sans,
            }}
          >
            <div aria-hidden style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 16px' }} />

            {/* The screenshot-proud composition */}
            <div style={{ textAlign: 'center' }}>
              <Mono size={10} color={T.ink400} style={{ letterSpacing: '0.16em' }}>
                {t('recap.eyebrow', 'WEEKLY BLOOM RECAP').toUpperCase()} · {weekLabel}
              </Mono>
              <Spacer h={10} />
              <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontStyle: 'italic', fontWeight: 500, color: T.ink900, lineHeight: 1.2 }}>
                {childName || t('recap.yourLittleOne', 'Your little one')}
              </div>

              {recap.highlight && (
                <>
                  <Spacer h={14} />
                  <Body size={15} color={T.ink700} lh={1.55} style={{ maxWidth: 420, margin: '0 auto' }}>
                    “{recap.highlight}”
                  </Body>
                </>
              )}

              <Spacer h={22} />
              <div style={{ display: 'flex', gap: 8, maxWidth: 380, margin: '0 auto' }}>
                <BigStat value={stats.feeds ?? 0} label={t('recap.feeds', 'Feeds')} />
                <BigStat value={`${stats.sleepHours ?? 0}h`} label={t('recap.sleep', 'Sleep')} />
                <BigStat value={`${stats.daysLogged ?? 0}/7`} label={t('recap.days', 'Days logged')} />
              </div>

              {stats.streakEnd >= 2 && (
                <>
                  <Spacer h={14} />
                  <Mono size={11} color="#B8860B" style={{ letterSpacing: '0.08em' }}>
                    ✦ {t('recap.streak', '{{n}}-day rhythm', { n: stats.streakEnd })}
                  </Mono>
                </>
              )}

              <Spacer h={22} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
                <Ring value={completeness.score / 100} size={84} stroke={8} color={T.brand}
                  label={`${completeness.score}`} sub={t('recap.ready', 'doctor-ready')} />
                <div style={{ textAlign: 'left', maxWidth: 170 }}>
                  <Body size={12.5} weight={700} color={T.ink900}>
                    {t(`recap.label.${completeness.label}`, completeness.label)}
                  </Body>
                  <Body size={11.5} color={T.ink500} lh={1.45} style={{ marginTop: 3 }}>
                    {t(`recap.tierLine.${tier}`, `The garden is ${tier} this week`)}
                  </Body>
                </div>
              </div>

              <Spacer h={20} />
              <Mono size={10} color={T.ink300} style={{ letterSpacing: '0.1em' }}>
                ChildBloom · childbloom.in
              </Mono>
            </div>

            <Spacer h={20} />
            <button
              onClick={share}
              style={{
                width: '100%', padding: '15px', borderRadius: RADIUS.lg, border: 'none',
                background: T.brand, color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              {t('recap.share', 'Share this week')}
            </button>
            <Spacer h={8} />
            <button
              onClick={close}
              style={{
                width: '100%', padding: '12px', borderRadius: RADIUS.md,
                border: `0.5px solid ${T.line}`, background: 'transparent',
                color: T.ink400, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              {t('recap.close', 'Close')}
            </button>
          </div>
        </>
      )}
    </>
  );
}
