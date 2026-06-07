import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedChild } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, AIBubble,
} from '../../components/cb/primitives';
import { GUIDE_STAGES } from '../../lib/constants';
import { getAgeStage } from '../../lib/formatters';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const STAGE_ICONS = {
  pregnancy:         'heart',
  newborn:           'leaf',
  infant:            'sparkle',
  toddler:           'sun',
  preschool:         'book',
  'early-childhood': 'chart',
};

export default function GuidesPage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const currentStage = child?.date_of_birth ? getAgeStage(child.date_of_birth) : null;
  const [weeklyTip, setWeeklyTip] = useState('');
  const [tipLoading, setTipLoading] = useState(false);

  useEffect(() => {
    if (!child?.id || !currentStage) return;
    const token = localStorage.getItem('sb-access-token');
    if (!token) return;

    setTipLoading(true);
    setWeeklyTip('');

    const stageInfo = GUIDE_STAGES.find(s => s.slug === currentStage);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ai/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: `Give me 2-3 specific, practical tips for a parent of ${child.name} who is in the ${stageInfo?.title || currentStage} stage. Make it personal and useful right now, not generic advice. 3 short bullet points only.`,
            childId: child.id,
            language: localStorage.getItem('childbloom_voice_lang') || 'en',
          }),
        });

        if (!res.ok) return;

        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.content) setWeeklyTip(data.content);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'text') setWeeklyTip(prev => prev + event.content);
            } catch {}
          }
        }
      } catch {}
      finally { setTipLoading(false); }
    })();
  }, [child?.id]);

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <div style={{ paddingTop: 52 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <Eyebrow color={T.ink300}>GUIDES</Eyebrow>
          <Spacer h={4} />
          <Display size={34} italic weight={600} lh={1.05}>Development</Display>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* AI weekly tip */}
        {child?.name && (tipLoading || weeklyTip) && (
          <>
            {tipLoading && !weeklyTip ? (
              <Card p={16} style={{ marginBottom: 16 }}>
                <HRow gap={4} align="center">
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.brandSoft, animation: `pulse ${0.6 + i * 0.2}s infinite` }} />
                  ))}
                </HRow>
              </Card>
            ) : (
              <AIBubble lead={`This week for ${child.name}`} sparkle style={{ marginBottom: 16 }}>
                {weeklyTip}
              </AIBubble>
            )}
            <Spacer h={16} />
          </>
        )}

        {/* Stage list */}
        <Stack gap={8}>
          {GUIDE_STAGES.map(stage => {
            const isCurrent = currentStage === stage.slug;
            const icon = STAGE_ICONS[stage.slug] || 'book';
            return (
              <button key={stage.slug} onClick={() => navigate(`/guides/${stage.slug}`)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: isCurrent ? T.brandWash : T.surface,
                  border: `1px solid ${isCurrent ? T.brandSoft : T.line}`,
                  borderRadius: RADIUS.lg, padding: '14px', fontFamily: FONTS.sans,
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.12s ease',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: RADIUS.md,
                  background: isCurrent ? T.brandSoft : T.surfaceDim,
                  color: isCurrent ? T.brand : T.ink300,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CBIcon name={icon} size={20} stroke={1.8} />
                </div>

                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <HRow gap={6} align="center">
                    <Body size={15} color={T.ink900} weight={600}>{stage.title}</Body>
                    {isCurrent && (
                      <div style={{ fontSize: 9, fontWeight: 800, color: T.brand, background: T.brandWash, padding: '2px 7px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                        Current
                      </div>
                    )}
                  </HRow>
                  <Body size={11} color={T.ink300} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stage.ageRange} · {stage.description}
                  </Body>
                </Stack>

                <CBIcon name="chevron-right" size={14} stroke={2.2} style={{ color: T.ink300, flexShrink: 0 }} />
              </button>
            );
          })}
        </Stack>

        <Spacer h={16} />

        {/* Disclaimer */}
        <div style={{ background: T.surfaceDim, border: `1px solid ${T.line}`, borderRadius: RADIUS.md, padding: '12px 14px', textAlign: 'center' }}>
          <Body size={11} color={T.ink300} lh={1.5}>
            Based on WHO, AAP, and IAP guidelines.
            Every child develops at their own pace — your paediatrician knows your child best.
          </Body>
        </div>

        <Spacer h={16} />
      </div>
    </div>
  );
}
