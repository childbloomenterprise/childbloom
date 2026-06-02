// Bloom Path — Area detail at /child/:id/bloom/:area
// Shows what's growing, timeline of moments, and gentle activity invitations.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useChildById } from '../../hooks/useChild';
import { useBloomMoments } from '../../hooks/useBloomMoments';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, ChromeBtn, Card, Button,
} from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import { getArea, getActivitiesForArea } from '../../lib/bloomAreas';
import BloomMomentSheet from './BloomMomentSheet';

export default function BloomAreaPage() {
  const navigate = useNavigate();
  const { id: childId, area: areaKey } = useParams();
  const { data: child } = useChildById(childId);
  const { moments, add, isAdding, remove } = useBloomMoments(childId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const area = getArea(areaKey);
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : 60; // safe default

  if (!area) {
    return (
      <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, padding: 52 }}>
        <ChromeBtn icon="back" onClick={() => navigate(-1)} aria-label="Back" />
        <Spacer h={24} />
        <Body color={T.ink500}>Area not found.</Body>
      </div>
    );
  }

  const areaMoments = moments.filter(m => m.area === area.key);
  const activities = getActivitiesForArea(area.key, ageInDays, 3);
  const childName = child?.name || 'your little one';

  const headline = (() => {
    if (areaMoments.length === 0) {
      return `Watching for ${area.short.toLowerCase()}`;
    }
    if (areaMoments.length === 1) {
      return 'One moment noticed';
    }
    return `${areaMoments.length} moments — and growing`;
  })();

  const subhead = (() => {
    if (areaMoments.length === 0) return area.plain;
    const latest = areaMoments[0];
    return `Most recent: "${latest.note.slice(0, 80)}${latest.note.length > 80 ? '…' : ''}"`;
  })();

  const handleSave = async ({ note }) => {
    add({ note, area: area.key });
    setTimeout(() => setSheetOpen(false), 350);
  };

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans, paddingBottom: 120 }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChromeBtn icon="back" onClick={() => navigate(-1)} aria-label="Back to garden" />
        <Mono size={11} color={area.accent} style={{ letterSpacing: '0.12em' }}>{area.short.toUpperCase()}</Mono>
        <div style={{ width: 36 }} />
      </div>

      {/* Title block */}
      <div style={{ padding: '14px 20px 4px' }}>
        <Eyebrow color={T.ink300}>{area.label.toUpperCase()}</Eyebrow>
        <Spacer h={6} />
        <Display size={26} italic weight={500} lh={1.15}>{headline}</Display>
        <Spacer h={8} />
        <Body size={13} color={T.ink500} lh={1.5}>{subhead}</Body>
      </div>

      <Spacer h={24} />

      {/* Activities — "Things to gently invite this week" */}
      {activities.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <Body size={11} color={T.ink400} weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Things to gently invite this week
          </Body>
          <Stack gap={10}>
            {activities.map((act, i) => (
              <Card key={i} p={16} style={{ background: area.wash, border: `0.5px solid ${area.accent}30` }}>
                <HRow gap={12} align="flex-start">
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, background: area.accent + '22', color: area.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CBIcon name={area.icon} size={16} aria-hidden="true" />
                  </div>
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Body size={14} weight={600} color={T.ink900}>{act.label}</Body>
                    <Body size={12} color={T.ink500} lh={1.5}>{act.body}</Body>
                    {act.minutes > 0 && (
                      <Mono size={10} color={T.ink400} style={{ letterSpacing: '0.08em', marginTop: 2 }}>
                        ~{act.minutes} MIN · OPTIONAL
                      </Mono>
                    )}
                  </Stack>
                </HRow>
              </Card>
            ))}
          </Stack>
        </div>
      )}

      <Spacer h={26} />

      {/* Timeline */}
      <div style={{ padding: '0 16px' }}>
        <Body size={11} color={T.ink400} weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          {areaMoments.length === 0 ? 'Nothing noted yet' : 'Timeline'}
        </Body>

        {areaMoments.length === 0 ? (
          <Card p={18} style={{ textAlign: 'center', border: `0.5px dashed ${T.line}`, background: 'transparent' }}>
            <Body size={13} color={T.ink400} lh={1.5}>
              When you notice something — even small — tap below to remember it.
              No rush.
            </Body>
          </Card>
        ) : (
          <Card p={0}>
            {areaMoments.map((m, i) => (
              <div key={m.id}>
                <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: area.accent,
                    marginTop: 6, flexShrink: 0,
                  }} aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Body size={13} color={T.ink900} lh={1.45}>{m.note}</Body>
                    <Spacer h={4} />
                    <Mono size={10} color={T.ink400} style={{ letterSpacing: '0.08em' }}>
                      {format(new Date(m.noticed_at), 'MMM d, yyyy · h:mm a')}
                    </Mono>
                  </div>
                  <button
                    onClick={() => { if (confirm('Remove this moment?')) remove(m.id); }}
                    aria-label="Remove this moment"
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: T.ink300, padding: 4, lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    <CBIcon name="trash" size={14} aria-hidden="true" />
                  </button>
                </div>
                {i < areaMoments.length - 1 && (
                  <div style={{ height: 0.5, background: T.line, marginLeft: 36 }} />
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      <Spacer h={32} />

      {/* Sticky log button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 16px), 28px)',
        background: `linear-gradient(to top, ${T.bg} 70%, transparent)`,
        zIndex: 40,
      }}>
        <Button variant="primary" size="lg" full onClick={() => setSheetOpen(true)}>
          Note something I noticed
        </Button>
        <Spacer h={6} />
        <Body size={11} color={T.ink300} style={{ textAlign: 'center' }}>
          {childName} develops at their own pace · No rush
        </Body>
      </div>

      <BloomMomentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        childId={childId}
        defaultArea={area.key}
        onSave={handleSave}
        isSaving={isAdding}
      />
    </div>
  );
}
