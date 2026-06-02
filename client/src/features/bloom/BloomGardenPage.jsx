// Bloom Path — Garden view at /child/:id/bloom
// 8 bloom areas as soft tiles. No percentages. Buds become blooms gently.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { useChildById } from '../../hooks/useChild';
import { useBloomMoments } from '../../hooks/useBloomMoments';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, ChromeBtn, Card, Button,
} from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import { BLOOM_AREAS } from '../../lib/bloomAreas';
import BloomMomentSheet from './BloomMomentSheet';

// Soft bloom shape — abstract flower SVG. State drives petal opacity.
function BloomShape({ accent, state }) {
  // state: 'bud' | 'opening' | 'blooming'
  const petalOpacity = state === 'blooming' ? 1 : state === 'opening' ? 0.55 : 0.18;
  const centerOpacity = state === 'bud' ? 0.4 : 1;
  return (
    <svg viewBox="0 0 80 80" width="56" height="56" aria-hidden="true">
      {/* 5 petals around center */}
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (i * 72) * Math.PI / 180;
        const cx = 40 + Math.cos(angle - Math.PI / 2) * 18;
        const cy = 40 + Math.sin(angle - Math.PI / 2) * 18;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="13"
            ry="20"
            fill={accent}
            opacity={petalOpacity}
            transform={`rotate(${i * 72} ${cx} ${cy})`}
            style={{ transition: 'opacity 0.6s ease' }}
          />
        );
      })}
      {/* Center */}
      <circle cx="40" cy="40" r="9" fill={accent} opacity={centerOpacity} />
    </svg>
  );
}

function BloomTile({ area, count, onClick }) {
  const state = count >= 3 ? 'blooming' : count >= 1 ? 'opening' : 'bud';
  const stateLabel = state === 'blooming' ? 'Blooming' : state === 'opening' ? 'Opening' : 'Bud';
  return (
    <button
      onClick={onClick}
      aria-label={`${area.label} — ${stateLabel}${count > 0 ? `, ${count} ${count === 1 ? 'moment' : 'moments'} noticed` : ', no moments noticed yet'}`}
      style={{
        background: T.surface,
        border: `0.5px solid ${T.line}`,
        borderRadius: RADIUS.lg,
        padding: '18px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        cursor: 'pointer', fontFamily: FONTS.sans,
        transition: 'transform 0.16s ease, box-shadow 0.18s ease',
        minHeight: 132,
      }}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onPointerUp={e => e.currentTarget.style.transform = ''}
      onPointerLeave={e => e.currentTarget.style.transform = ''}
    >
      <div style={{ animation: state !== 'bud' ? 'bloom-breathe 5s ease-in-out infinite' : 'none' }}>
        <BloomShape accent={area.accent} state={state} />
      </div>
      <Stack gap={2} style={{ alignItems: 'center' }}>
        <Body size={12} weight={600} color={T.ink900}>{area.short}</Body>
        <Mono size={9} color={state === 'bud' ? T.ink300 : area.accent} style={{ letterSpacing: '0.1em' }}>
          {stateLabel.toUpperCase()}
        </Mono>
      </Stack>
    </button>
  );
}

export default function BloomGardenPage() {
  const navigate = useNavigate();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const { momentsByArea, moments, add, isAdding } = useBloomMoments(childId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const totalMoments = moments.length;
  const blooming = BLOOM_AREAS.filter(a => (momentsByArea[a.key] || 0) >= 1);
  const childName = child?.name || 'your little one';

  // Lead headline — acknowledgement-first
  const headline = (() => {
    if (totalMoments === 0) return `${childName}'s garden is just beginning`;
    if (blooming.length === 1) return `${blooming[0].label.toLowerCase()} is opening`;
    if (blooming.length <= 3) return `A few areas are opening this week`;
    return `${childName} is blooming across many areas`;
  })();

  const subhead = (() => {
    if (totalMoments === 0) return 'Tap any bloom to learn what\'s growing. Note small things you notice — they add up.';
    return 'Tap a bloom to see what\'s growing. Note small things you notice — they add up.';
  })();

  const handleSave = async ({ note, area }) => {
    await new Promise((resolve, reject) => {
      add({ note, area });
      // Mutation completes asynchronously; resolve next tick (optimistic).
      setTimeout(resolve, 350);
    });
    setSheetOpen(false);
  };

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans, paddingBottom: 120 }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChromeBtn icon="back" onClick={() => navigate(-1)} aria-label="Back" />
        <Mono size={11} color={T.ink400} style={{ letterSpacing: '0.12em' }}>BLOOM PATH</Mono>
        <div style={{ width: 36 }} />
      </div>

      {/* Title block */}
      <div style={{ padding: '14px 20px 4px' }}>
        <Eyebrow color={T.ink300}>{childName.toUpperCase()}{ageInDays != null ? ` · ${Math.floor(ageInDays / 7)} WEEKS` : ''}</Eyebrow>
        <Spacer h={6} />
        <Display size={28} italic weight={500} lh={1.12}>{headline}</Display>
        <Spacer h={8} />
        <Body size={13} color={T.ink500} lh={1.5}>{subhead}</Body>
      </div>

      <Spacer h={22} />

      {/* The garden — 2×4 grid */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {BLOOM_AREAS.map(area => (
            <BloomTile
              key={area.key}
              area={area}
              count={momentsByArea[area.key] || 0}
              onClick={() => navigate(`/child/${childId}/bloom/${area.key}`)}
            />
          ))}
        </div>
      </div>

      <Spacer h={26} />

      {/* Empty state CTA */}
      {totalMoments === 0 && (
        <div style={{ padding: '0 16px' }}>
          <Card p={18} style={{ background: T.brandWash, border: `0.5px solid ${T.brandSoft}40` }}>
            <Body size={13} color={T.ink900} weight={600}>Start with one thing</Body>
            <Spacer h={4} />
            <Body size={12} color={T.ink500} lh={1.5}>
              A sound, a reach, a smile — whatever felt new today. We'll grow the garden from there.
            </Body>
            <Spacer h={12} />
            <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
              Note something I noticed
            </Button>
          </Card>
        </div>
      )}

      {/* Recent moments (only if any) */}
      {totalMoments > 0 && (
        <div style={{ padding: '0 16px' }}>
          <Body size={11} color={T.ink400} weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Recent moments
          </Body>
          <Card p={0}>
            {moments.slice(0, 5).map((m, i) => {
              const a = BLOOM_AREAS.find(x => x.key === m.area);
              return (
                <div key={m.id}>
                  <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 999,
                      background: a?.accent || T.ink300,
                      marginTop: 6, flexShrink: 0,
                    }} aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Body size={13} color={T.ink900} lh={1.45}>{m.note}</Body>
                      <Spacer h={4} />
                      <Mono size={10} color={T.ink400} style={{ letterSpacing: '0.08em' }}>
                        {a?.short.toUpperCase() || 'NOT TAGGED'} · {new Date(m.noticed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Mono>
                    </div>
                  </div>
                  {i < Math.min(4, moments.length - 1) && (
                    <div style={{ height: 0.5, background: T.line, marginLeft: 36 }} />
                  )}
                </div>
              );
            })}
          </Card>
          {moments.length > 5 && (
            <>
              <Spacer h={10} />
              <Body size={11} color={T.ink400} style={{ textAlign: 'center' }}>
                + {moments.length - 5} more in the timeline
              </Body>
            </>
          )}
        </div>
      )}

      {/* Sticky CTA — only when there are moments (empty-state has its own) */}
      {totalMoments > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 16px), 28px)',
          background: `linear-gradient(to top, ${T.bg} 70%, transparent)`,
          zIndex: 40,
        }}>
          <Button variant="primary" size="lg" full onClick={() => setSheetOpen(true)}>
            Note something I noticed
          </Button>
        </div>
      )}

      <BloomMomentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        childId={childId}
        onSave={handleSave}
        isSaving={isAdding}
      />
    </div>
  );
}
