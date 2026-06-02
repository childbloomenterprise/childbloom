// Care hub — emergency profile, upcoming vaccines/checkups, records grid, history.
// Routes from `/care` (also reachable via tab bar). Public — guests see demo state.
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { differenceInDays, format } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Chip, Button, ProgressBar,
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  Avatar,
} from '../../components/cb/primitives';

function CareRow({ dot, title, sub, right, onClick, urgent }) {
  return (
    <HRow
      gap={12}
      style={{ padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'opacity 0.12s ease' }}
      align="center"
      onClick={onClick}
    >
      <div style={{
        width: 8, height: 8, borderRadius: 4, background: dot, flexShrink: 0,
        animation: urgent ? 'badge-pulse 1.8s ease-in-out infinite' : 'none',
        boxShadow: urgent ? `0 0 0 3px ${dot}30` : 'none',
      }} />
      <Stack gap={2} style={{ flex: 1 }}>
        <Body size={14} weight={600} color={T.ink900}>{title}</Body>
        {sub && <Body size={11} color={T.ink500}>{sub}</Body>}
      </Stack>
      {right && <Mono size={10} color={T.ink400}>{right}</Mono>}
      {onClick && <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />}
    </HRow>
  );
}

function RecordTile({ icon, label, sub, pct, onClick }) {
  return (
    <Card p={14} onClick={onClick}>
      <HRow gap={10} align="center">
        <div style={{
          width: 32, height: 32, borderRadius: RADIUS.md, background: T.brandWash,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.brand,
        }}>
          <CBIcon name={icon} size={16} stroke={1.8} />
        </div>
        <Stack gap={1} style={{ flex: 1 }}>
          <Body size={13} weight={600} color={T.ink900}>{label}</Body>
          <Body size={10} color={T.ink500}>{sub}</Body>
        </Stack>
      </HRow>
      <Spacer h={10} />
      <ProgressBar value={pct} h={4} />
    </Card>
  );
}

export default function CarePage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const session = useAuthStore((s) => s.session);
  const childId = child?.id;
  const childName = child?.name || 'your child';

  // Upcoming vaccines (next 5)
  const { data: upcomingVaccines = [] } = useQuery({
    queryKey: ['care-upcoming-vaccines', childId],
    queryFn: async () => {
      const { data } = await supabase.from('vaccinations').select('*')
        .eq('child_id', childId).is('date_given', null)
        .order('next_due', { ascending: true }).limit(5);
      return data || [];
    },
    enabled: !!childId,
  });

  // Vaccine completion %
  const { data: allVaccines = [] } = useQuery({
    queryKey: ['care-all-vaccines', childId],
    queryFn: async () => {
      const { data } = await supabase.from('vaccinations').select('id,date_given')
        .eq('child_id', childId);
      return data || [];
    },
    enabled: !!childId,
  });

  const completedVaccines = allVaccines.filter(v => !!v.date_given).length;
  const totalVaccines = allVaccines.length || 14;

  // Recent vaccine history
  const { data: vaccineHistory = [] } = useQuery({
    queryKey: ['care-vaccine-history', childId],
    queryFn: async () => {
      const { data } = await supabase.from('vaccinations').select('*')
        .eq('child_id', childId).not('date_given', 'is', null)
        .order('date_given', { ascending: false }).limit(3);
      return data || [];
    },
    enabled: !!childId,
  });

  // Latest growth record (for growth tile)
  const { data: latestMeasurement } = useQuery({
    queryKey: ['care-latest-growth', childId],
    queryFn: async () => {
      const { data } = await supabase.from('growth_records').select('*')
        .eq('child_id', childId)
        .order('record_date', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!childId,
  });

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 56 }}>

      {/* Top bar */}
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {child && <Avatar name={childName[0]} size={36} />}
        <div style={{ flex: 1 }}>
          <Body size={12} color={T.ink400}>Health, vaccines, doctors</Body>
          <Display size={26} italic weight={400} lh={1.1}>Care</Display>
        </div>
        <ChromeBtn
          icon="plus"
          onClick={() => childId ? navigate(`/child/${childId}/health`) : navigate('/onboarding')}
          aria-label="Add a health record"
        />
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Emergency profile widget */}
        <Card p={16} tone="brand" style={{ position: 'relative', overflow: 'hidden' }}>
          <Eyebrow color="rgba(255,255,255,0.7)">Emergency profile</Eyebrow>
          <Spacer h={8} />
          <div style={{ fontFamily: FONTS.serif, fontSize: 19, color: '#fff', fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            Tap and hold the lock-screen widget for ER-ready info.
          </div>
          <Spacer h={14} />
          <HRow gap={8}>
            <Chip tone="cream" icon="user">{childName}</Chip>
            <Chip tone="cream" icon="shield">Records secure</Chip>
            <Chip tone="cream" icon="leaf">Local first</Chip>
          </HRow>
        </Card>

        <Spacer h={16} />

        {/* SOS button */}
        <button
          onClick={() => navigate('/emergency')}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
            border: 'none', borderRadius: RADIUS.md, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(185,28,28,0.22)',
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: RADIUS.sm, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <CBIcon name="siren" size={18} stroke={2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Emergency First-Aid</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>CPR, choking, burns, seizures &amp; more</div>
          </div>
          <CBIcon name="chevron-right" size={16} style={{ color: '#fff' }} />
        </button>

        <Spacer h={20} />

        {/* Up next */}
        {childId && upcomingVaccines.length > 0 && (
          <>
            <SectionLabel
              title="Up next"
              trailing="Calendar"
              onTrailing={() => navigate(`/child/${childId}/vaccinations`)}
            />
            <Card p={0}>
              {upcomingVaccines.map((v, i, arr) => {
                const days = v.next_due ? differenceInDays(new Date(v.next_due), new Date()) : null;
                const right = v.next_due ? format(new Date(v.next_due), 'd MMM') : '—';
                const dot = days !== null && days <= 7 ? T.accent : T.brand;
                return (
                  <div key={v.id}>
                    <CareRow
                      dot={dot}
                      title={v.vaccine_name}
                      sub={days === null ? '' : days <= 0 ? 'overdue' : days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`}
                      right={right}
                      urgent={days !== null && days <= 3}
                      onClick={() => navigate(`/child/${childId}/vaccinations`)}
                    />
                    {i < arr.length - 1 && <Divider />}
                  </div>
                );
              })}
            </Card>
            <Spacer h={20} />
          </>
        )}

        {/* Records grid */}
        {childId && (
          <>
            <SectionLabel title="Records" />
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <RecordTile
                icon="shield"
                label="Vaccines"
                sub={`${completedVaccines} of ${totalVaccines}`}
                pct={completedVaccines / Math.max(1, totalVaccines)}
                onClick={() => navigate(`/child/${childId}/vaccinations`)}
              />
              <RecordTile
                icon="chart"
                label="Growth"
                sub={latestMeasurement ? `${latestMeasurement.weight_kg ?? '—'} kg` : 'Add measurement'}
                pct={latestMeasurement ? 0.62 : 0}
                onClick={() => navigate(`/child/${childId}/growth`)}
              />
              <RecordTile
                icon="pill"
                label="Health records"
                sub="Doctor visits, meds"
                pct={1}
                onClick={() => navigate(`/child/${childId}/health`)}
              />
              <RecordTile
                icon="sparkle"
                label="Bloom Path"
                sub="Developmental journey"
                pct={0.5}
                onClick={() => navigate(`/child/${childId}/bloom`)}
              />
              <RecordTile
                icon="clipboard"
                label="Daily check-in"
                sub="Mood, sleep, notes"
                pct={0}
                onClick={() => navigate(`/child/${childId}/weekly-update`)}
              />
              <RecordTile
                icon="award"
                label="Achievements"
                sub="Your milestones"
                pct={0}
                onClick={() => navigate('/achievements')}
              />
            </div>
            <Spacer h={20} />
          </>
        )}

        {/* History */}
        {vaccineHistory.length > 0 && (
          <>
            <SectionLabel title="History" />
            <Card p={0}>
              {vaccineHistory.map((v, i, arr) => (
                <div key={v.id}>
                  <CareRow
                    dot={T.brandSoft}
                    title={v.vaccine_name}
                    sub={`completed${v.notes ? ` · ${v.notes}` : ''}`}
                    right={format(new Date(v.date_given), 'd MMM')}
                  />
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}
            </Card>
            <Spacer h={20} />
          </>
        )}

        {/* No-child state — guest or no profile yet */}
        {!childId && (
          <>
            <Card p={20} style={{ textAlign: 'center' }}>
              <Display size={20} italic weight={400}>
                {session ? 'Add your child to see care records' : 'Sign in to see your care records'}
              </Display>
              <Spacer h={8} />
              <Body size={13} color={T.ink500}>
                Vaccines, growth, health history — all in one place. Bloom keeps it organized for any visit.
              </Body>
              <Spacer h={16} />
              <Button onClick={() => navigate(session ? '/onboarding' : '/auth')}>
                {session ? 'Add child' : 'Sign in — free'}
              </Button>
            </Card>
            <Spacer h={20} />
          </>
        )}

        <Spacer h={32} />
      </div>
    </div>
  );
}
