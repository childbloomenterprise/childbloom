// GardenChip — compact Timeline card linking logging to the Bloom Garden.
// Shows the garden's watered state for today + the 7-day rhythm as dots.
// Reuses the food/sleep 7d query keys (warm cache, zero extra network when
// Timeline is already loaded); quick_logs gets its own small 7d query.

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Body, Mono } from '../../components/cb/primitives';
import { computeVitality } from '../../lib/gardenVitality';
import { computeLogStreak, logDaySet } from '../../lib/homePulse';

const TIER_ACCENT = {
  parched: '#B8A88F',
  budding: '#7DA68C',
  growing: '#3D9A6E',
  thriving: '#1D9E75',
};

function MiniBloom({ accent, tier }) {
  const petalOpacity = tier === 'thriving' ? 1 : tier === 'growing' ? 0.7 : tier === 'budding' ? 0.45 : 0.18;
  return (
    <svg viewBox="0 0 80 80" width="34" height="34" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 72) * Math.PI / 180;
        const cx = 40 + Math.cos(angle - Math.PI / 2) * 18;
        const cy = 40 + Math.sin(angle - Math.PI / 2) * 18;
        return (
          <ellipse key={i} cx={cx} cy={cy} rx="13" ry="20" fill={accent}
            opacity={petalOpacity} transform={`rotate(${i * 72} ${cx} ${cy})`} />
        );
      })}
      <circle cx="40" cy="40" r="9" fill={accent} />
    </svg>
  );
}

export default function GardenChip({ childId, foodLogs7d = [], sleepLogs7d = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: quickLogs7d = [] } = useQuery({
    queryKey: ['quick-logs-7d', childId],
    queryFn: async () => {
      const sevenAgo = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');
      const { data } = await supabase.from('quick_logs').select('id, logged_date')
        .eq('child_id', childId).gte('logged_date', sevenAgo);
      return data || [];
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });

  const vitality = computeVitality({ foodLogs7d, sleepLogs7d, quickLogs7d });
  const days = logDaySet(foodLogs7d, sleepLogs7d);
  for (const q of quickLogs7d) if (q?.logged_date) days.add(q.logged_date);
  const streak = computeLogStreak(days);

  const accent = TIER_ACCENT[vitality.tier];
  const statusLine = vitality.wateredToday
    ? t('garden.chip.watered', 'Watered today')
    : t('garden.chip.thirsty', 'One log waters it');

  // 7 dots, oldest → today.
  const dotDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dotDays.push(days.has(format(d, 'yyyy-MM-dd')));
  }

  return (
    <button
      onClick={() => navigate(`/child/${childId}/bloom`)}
      aria-label={t('garden.chip.aria', "Open {{name}}'s Bloom Garden", { name: '' })}
      style={{
        width: '100%', background: T.surface, border: `0.5px solid ${T.line}`,
        borderRadius: RADIUS.lg, padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONTS.sans,
        textAlign: 'left', transition: 'transform 0.16s ease',
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.985)'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ''; }}
    >
      <div style={{ animation: vitality.wateredToday ? 'bloom-breathe 5s ease-in-out infinite' : 'none', flexShrink: 0 }}>
        <MiniBloom accent={accent} tier={vitality.tier} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <Body size={13} weight={600} color={T.ink900}>{statusLine}</Body>
          {streak >= 2 && (
            <Mono size={10} color="#B8860B" style={{ letterSpacing: '0.06em' }}>
              {t('garden.chip.day', 'day {{n}}', { n: streak })} ✦
            </Mono>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 7 }} aria-hidden="true">
          {dotDays.map((on, i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: 999,
              background: on ? accent : 'transparent',
              border: on ? 'none' : `1px solid ${T.ink200}`,
              opacity: i === 6 ? 1 : 0.8,
            }} />
          ))}
        </div>
      </div>

      <Mono size={10} color={T.ink300} style={{ letterSpacing: '0.1em', flexShrink: 0 }}>
        {t(`garden.tier.${vitality.tier}`, vitality.tier).toUpperCase()}
      </Mono>
    </button>
  );
}
