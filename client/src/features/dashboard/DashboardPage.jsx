import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { differenceInDays, format } from 'date-fns';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T } from '../../components/cb/tokens';
import MotionButton from '../../components/ui/motion-button';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getBloomNote(child, ageInDays) {
  const name = child?.name || 'your little one';
  if (!ageInDays) return `Welcome to ChildBloom. Let's set up ${name}'s profile.`;
  if (ageInDays <= 7)   return `${name} is in their first week — skin-to-skin and feeding are everything right now.`;
  if (ageInDays <= 14)  return `${name} is regaining birth weight this week. Feeding often is exactly right.`;
  if (ageInDays <= 21)  return `${name}'s hearing is now fully developed — they can recognize your voice distinctly.`;
  if (ageInDays <= 30)  return `${name} is on day ${ageInDays} — first social smiles are days away. Watch those eyes today.`;
  if (ageInDays <= 60)  return `${name} is starting to track faces and coo. Talk to them often.`;
  if (ageInDays <= 90)  return `${name} is building head control. Tummy time helps — even 5 minutes counts.`;
  if (ageInDays <= 180) return `${name} is approaching the sitting milestone. Lots to celebrate this month.`;
  if (ageInDays <= 365) return `${name} is close to their first year. Every word you say is building vocabulary.`;
  return `${name} is growing beautifully. You're doing great.`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const child = useSelectedChild();
  const user = useAuthStore((s) => s.user);
  const [mood, setMood] = useState(null);

  const childId = child?.id;
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const today = format(new Date(), 'EEE · MMM d').toUpperCase();

  // Latest food logs
  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('child_id', childId)
        .eq('logged_date', format(new Date(), 'yyyy-MM-dd'))
        .order('logged_at', { ascending: false });
      return data || [];
    },
    enabled: !!childId,
  });

  // Latest sleep log
  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep-logs-today', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('child_id', childId)
        .eq('logged_date', format(new Date(), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(1);
      return data || [];
    },
    enabled: !!childId,
  });

  // Next vaccine
  const { data: vaccines = [] } = useQuery({
    queryKey: ['vaccinations-dash', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('child_id', childId)
        .is('date_given', null)
        .order('next_due', { ascending: true })
        .limit(1);
      return data || [];
    },
    enabled: !!childId,
  });

  // Latest weekly update
  const { data: latestUpdate } = useQuery({
    queryKey: ['latest-update', childId],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_updates')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!childId,
  });

  const feedsToday = foodLogs.length;
  const feedsTarget = ageInDays && ageInDays <= 60 ? 8 : 6;
  const lastFeed = foodLogs[0];
  const lastFeedAgo = lastFeed
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(lastFeed.logged_at)) / 60000);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
      })()
    : null;

  const sleepToday = sleepLogs[0]?.hours_slept ?? null;
  const nextVaccine = vaccines[0];
  const nextVaccineDays = nextVaccine?.next_due
    ? differenceInDays(new Date(nextVaccine.next_due), new Date())
    : null;

  const bloomNote = getBloomNote(child, ageInDays);
  const parentInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'P';
  const parentName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const moods = [
    { id: 'tired', l: 'Tired', i: 'moon' },
    { id: 'good', l: 'Good', i: 'sun' },
    { id: 'anxious', l: 'Anxious', i: 'wave' },
    { id: 'strong', l: 'Strong', i: 'flame' },
  ];

  if (!user) {
    return (
      <div className="animate-fade-in" style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div className="animate-bounce-subtle">
          <CBLogoMark size={48} color={T.forest700} />
        </div>
        <h1 className="animate-fade-in-up stagger-2" style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: T.ink900, marginTop: 20, letterSpacing: '-0.025em' }}>Welcome to ChildBloom</h1>
        <p className="animate-fade-in-up stagger-3" style={{ fontSize: 16, color: T.ink500, marginTop: 10, lineHeight: 1.5 }}>A calm, AI-first companion for Indian parents.</p>
        <div className="animate-fade-in-up stagger-4 mt-7">
          <MotionButton label="Get started — free" onClick={() => navigate('/auth')} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      {/* Greeting */}
      <div className="animate-stagger-up stagger-1" style={{ padding: '56px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink300, letterSpacing: '-0.01em', marginBottom: 2 }}>{today}</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.025em', color: T.ink900, margin: 0 }}>
              {getGreeting()}<br />
              <span style={{ color: T.forest600, fontStyle: 'italic' }}>{parentName}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', color: T.ink500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <CBIcon name="bell" size={17} />
            </button>
            <button onClick={() => navigate('/settings')}
              style={{ width: 36, height: 36, borderRadius: '50%', background: T.forest700, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {parentInitial}
            </button>
          </div>
        </div>
      </div>

      {/* Dr. Bloom card */}
      <div className="card-shimmer animate-stagger-up stagger-2 hover-lift" style={{ margin: '20px 16px 16px', borderRadius: 20, background: T.forest700, color: '#fff', padding: '18px 18px 20px', position: 'relative', overflow: 'hidden', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}>
        {/* decorative drifting orbs */}
        <div className="animate-drift" style={{ position: 'absolute', right: 20, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div className="animate-drift-slow" style={{ position: 'absolute', left: -20, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div className="animate-float" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.07 }}>
          <CBLogoMark size={140} color="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
          <CBIcon name="sparkle" size={13} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Dr. Bloom · just now</span>
        </div>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', position: 'relative', margin: 0 }}>
          "{bloomNote}"
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, position: 'relative' }}>
          <button onClick={() => navigate('/ask')}
            style={{ padding: '7px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            Ask follow-up →
          </button>
        </div>
      </div>

      {/* Stats row */}
      {childId && (
        <div className="animate-stagger-up stagger-3" style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Feeds', value: `${feedsToday}/${feedsTarget}`, sub: lastFeedAgo || 'none today', color: T.forest600, icon: 'bottle' },
            { label: 'Sleep', value: sleepToday ? `${sleepToday}h` : '—', sub: 'Goal 14–17', color: T.blue, icon: 'moon' },
            { label: 'Check-in', value: latestUpdate ? '✓' : '—', sub: latestUpdate ? 'done today' : 'tap to log', color: T.orange, icon: 'clipboard' },
          ].map((s, idx) => (
            <div key={s.label}
              className={`hover-lift press-effect card-shimmer animate-stagger-up stagger-${idx + 3}`}
              style={{ background: '#fff', borderRadius: 14, padding: '12px 12px', cursor: 'pointer', transition: 'transform 0.22s ease, box-shadow 0.22s ease' }}
              onClick={() => {
                if (s.label === 'Feeds') navigate(`/child/${childId}/food`);
                if (s.label === 'Check-in') navigate(`/child/${childId}/weekly-update`);
              }}>
              <div style={{ color: s.color, marginBottom: 6 }}><CBIcon name={s.icon} size={16} /></div>
              <div className="animate-count-in" style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.ink300, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Today timeline */}
      {childId && (
        <div className="animate-stagger-up stagger-4" style={{ margin: '20px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 10px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: T.ink900, letterSpacing: '-0.015em', margin: 0 }}>
              Today, with {child?.name}
            </h2>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { icon: 'bottle', color: T.forest600, title: 'Log a feed', sub: `${feedsToday} logged today`, state: feedsToday > 0 ? 'done' : 'now', path: `/child/${childId}/food`, live: feedsToday > 0 },
              { icon: 'clipboard', color: T.terra, title: 'Daily check-in', sub: '2 min · Dr. Bloom listens', state: latestUpdate ? 'done' : 'now', path: `/child/${childId}/weekly-update`, live: false },
              { icon: 'chart', color: T.blue, title: 'Growth tracking', sub: 'Weight, height, head', state: 'soon', path: `/child/${childId}/growth`, live: false },
              { icon: 'shield', color: T.forest600, title: 'Vaccinations', sub: nextVaccine ? `Next: ${nextVaccine.vaccine_name}` : 'View IAP schedule', state: 'later', last: true, path: `/child/${childId}/vaccinations`, live: false },
            ].map((it, i) => (
              <div key={i} onClick={() => navigate(it.path)}
                className="press-effect"
                style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: it.last ? 'none' : `0.5px solid ${T.ink100}`, background: it.state === 'now' ? T.forest50 : 'transparent', cursor: 'pointer', alignItems: 'center', transition: 'background 0.18s ease' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: it.color + '1f', color: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <CBIcon name={it.icon} size={15} />
                  {/* live pulse dot */}
                  {it.live && (
                    <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: T.forest500, display: 'block' }}>
                      <span className="animate-pulse-live" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.forest500 }} />
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: it.state === 'done' ? T.ink300 : T.ink900, textDecoration: it.state === 'done' ? 'line-through' : 'none', letterSpacing: '-0.01em' }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: T.ink300, marginTop: 1 }}>{it.sub}</div>
                </div>
                {it.state === 'done'
                  ? <CBIcon name="check" size={16} stroke={2.2} />
                  : it.state === 'now'
                    ? <button className="press-effect" style={{ padding: '5px 10px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'transform 0.15s ease, opacity 0.15s ease' }}>Start</button>
                    : <CBIcon name="chevron-right" size={14} />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vaccine reminder */}
      {nextVaccine && nextVaccineDays !== null && nextVaccineDays <= 30 && (
        <div onClick={() => navigate(`/child/${childId}/vaccinations`)}
          className={`press-effect animate-stagger-up stagger-5${nextVaccineDays <= 7 ? ' animate-glow-ring' : ''}`}
          style={{ margin: '14px 16px 0', borderRadius: 16, padding: '14px 16px', background: 'rgba(255,149,0,0.08)', border: `0.5px solid rgba(255,149,0,0.2)`, cursor: 'pointer', transition: 'transform 0.15s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,149,0,0.18)', color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CBIcon name="shield" size={17} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.orange }}>
                Next vaccine · {nextVaccineDays === 0 ? 'today' : `in ${nextVaccineDays} day${nextVaccineDays !== 1 ? 's' : ''}`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink900, marginTop: 2, letterSpacing: '-0.01em' }}>{nextVaccine.vaccine_name}</div>
            </div>
            <CBIcon name="chevron-right" size={16} />
          </div>
        </div>
      )}

      {/* Parent mood */}
      <div className="animate-stagger-up stagger-6" style={{ margin: '14px 16px 0', background: '#fff', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink300 }}>You today</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: T.forest700, marginTop: 2, marginBottom: 10 }}>Two seconds for yourself.</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {moods.map(m => {
            const active = mood === m.id;
            return (
              <button key={m.id} onClick={() => setMood(m.id)}
                className={`mood-btn press-effect${active ? ' animate-scale-in' : ''}`}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 10, border: `1.5px solid ${active ? T.forest500 : T.ink100}`, background: active ? T.forest50 : '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? T.forest600 : T.ink500, transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.15s ease' }}>
                <CBIcon name={m.i} size={16} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{m.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* No child state */}
      {!childId && user && (
        <div className="animate-fade-in-up" style={{ margin: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: 15, color: T.ink500, marginBottom: 16 }}>Add your child to get started</p>
          <MotionButton label="Add child" onClick={() => navigate('/onboarding')} />
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
