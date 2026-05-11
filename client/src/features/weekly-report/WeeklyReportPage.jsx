// Weekly Report — auto-generated headline + sleep bars + feed ring + milestones + AI summary.
// UI shell with placeholder data. Real data generation can hook in later.
import { useNavigate, useParams } from 'react-router-dom';
import { useChildById } from '../../hooks/useChild';
import { format, subDays } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  AIBubble, Ring, MiniBars, BloomFlower,
} from '../../components/cb/primitives';

function BigStat({ v, l, trend, dark = false }) {
  const fg  = dark ? '#fff' : T.ink900;
  const sub = dark ? 'rgba(255,255,255,0.65)' : T.ink400;
  return (
    <Stack gap={2} style={{ flex: 1 }}>
      <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontStyle: 'italic', fontWeight: 400, color: fg, letterSpacing: '-0.02em' }}>{v}</div>
      <Body size={11} color={sub}>{l}</Body>
      <Mono size={10} color={dark ? 'rgba(255,255,255,0.85)' : T.brand}>{trend}</Mono>
    </Stack>
  );
}

function MilestoneRow({ kind, title, sub }) {
  const map = {
    new:    { c: T.brand,     i: 'milestone', tag: 'NEW' },
    watch:  { c: T.brandSoft, i: 'sun',       tag: 'OBSERVED' },
    next:   { c: T.gold,      i: 'sparkle',   tag: 'NEXT' },
  };
  const m = map[kind] || map.new;
  return (
    <HRow gap={12} align="flex-start">
      <div style={{
        width: 32, height: 32, borderRadius: RADIUS.md, background: T.brandWash,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.c, flexShrink: 0,
      }}>
        <CBIcon name={m.i} size={16} stroke={1.7} />
      </div>
      <Stack gap={2} style={{ flex: 1 }}>
        <Mono size={9} color={m.c}>{m.tag}</Mono>
        <Body size={13} color={T.ink900} weight={500}>{title}</Body>
        {sub && <Body size={11} color={T.ink500}>{sub}</Body>}
      </Stack>
    </HRow>
  );
}

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const childName = child?.name || 'Your child';

  const weekStart = subDays(new Date(), 6);
  const weekLabel = `${format(weekStart, 'd MMM')} – ${format(new Date(), 'd MMM')}`;

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 56 }}>

      {/* Top */}
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <ChromeBtn icon="back" onClick={() => navigate(-1)} />
        <div style={{ flex: 1 }}>
          <Body size={12} color={T.ink400}>Bloom report · auto-generated</Body>
          <Display size={26} italic weight={400} lh={1.1}>The week of {format(weekStart, 'd MMM')}</Display>
        </div>
        <ChromeBtn icon="share" />
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Headline card */}
        <Card p={20} tone="brand" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.35, pointerEvents: 'none' }}>
            <BloomFlower size={200} colors={['#fff', '#fff', '#fff', '#fff', '#fff', '#fff']} />
          </div>
          <Eyebrow color="rgba(255,255,255,0.7)">Headline</Eyebrow>
          <Spacer h={8} />
          <div style={{
            fontFamily: FONTS.serif, fontSize: 24, fontStyle: 'italic', color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1.2, maxWidth: 270,
          }}>
            {childName}'s sleep pulled forward. Mornings are calmer.
          </div>
          <Spacer h={16} />
          <HRow gap={12}>
            <BigStat dark v="14h 12m" l="avg sleep / day" trend="+22m" />
            <BigStat dark v="7×"      l="feeds / day"    trend="−1"   />
          </HRow>
        </Card>

        <Spacer h={18} />

        {/* Sleep section */}
        <SectionLabel title="Sleep" />
        <Card p={16}>
          <HRow justify="space-between" align="baseline">
            <Display size={18} italic weight={400}>Earlier bedtimes</Display>
            <Mono size={10}>Mon — Sun</Mono>
          </HRow>
          <Spacer h={10} />
          <MiniBars values={[12, 14, 15, 14, 16, 15, 17]} w={300} h={70} labels={['M','T','W','T','F','S','S']} />
          <Spacer h={6} />
          <Body size={12} color={T.ink500}>Five of seven nights matched the optimal wind-down window.</Body>
        </Card>

        <Spacer h={16} />

        {/* Feeds section */}
        <SectionLabel title="Feeds" />
        <Card p={16}>
          <HRow gap={14}>
            <Ring value={0.84} size={84} stroke={9} label="84%" sub="ON RHYTHM" />
            <Stack gap={6} style={{ flex: 1 }}>
              <Body size={13} color={T.ink900} weight={600}>Cluster pattern noticed</Body>
              <Body size={11} color={T.ink500} lh={1.5}>
                Feeds tightened in the late afternoon — common right before a leap. Bloom expects this to settle in 3–4 days.
              </Body>
            </Stack>
          </HRow>
        </Card>

        <Spacer h={16} />

        {/* Milestones */}
        <SectionLabel title="Milestones" />
        <Card p={16}>
          <Stack gap={10}>
            <MilestoneRow kind="new"   title="Held head longer" sub="22 sec · new best" />
            <MilestoneRow kind="watch" title="Tracked moving toy across midline" />
            <MilestoneRow kind="next"  title="Coming up: rolling tummy → back" sub="typical at 14–16 weeks" />
          </Stack>
        </Card>

        <Spacer h={16} />

        {/* AI summary */}
        <SectionLabel title="What Bloom learned" />
        <AIBubble lead="3 patterns" sparkle>
          {childName} winds down faster after bath. Cluster feeds peak between 4–6 PM. Sundays are the highest-mood day — likely because the whole family is home.
        </AIBubble>

        <Spacer h={20} />

        <HRow gap={10}>
          <Button variant="secondary" size="md" full icon="share">Share with co-parent</Button>
          <Button variant="primary"   size="md" full icon="doctor">Save for doctor</Button>
        </HRow>

        <Spacer h={32} />
      </div>
    </div>
  );
}
