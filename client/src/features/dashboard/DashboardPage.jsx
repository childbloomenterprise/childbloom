import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { formatWeight, formatHeight, formatDate, formatPregnancyWeek } from '../../lib/formatters';
import { differenceInDays } from 'date-fns';
import { BabyIcon } from '../../assets/icons';
import EmptyState from '../../components/shared/EmptyState';

const CHECKIN_KEY = 'childbloom_parent_checkin_date';

const MOOD_OPTIONS = [
  { emoji: '😴', label: 'Tired',   value: 'tired' },
  { emoji: '😊', label: 'Good',    value: 'good' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '💪', label: 'Strong',  value: 'strong' },
];

function getStage(ageInDays) {
  if (ageInDays <= 30)   return '🌱 Newborn Stage';
  if (ageInDays <= 90)   return '🌿 Early Infant';
  if (ageInDays <= 180)  return '🌸 Infant';
  if (ageInDays <= 365)  return '🌻 Older Infant';
  if (ageInDays <= 730)  return '🌳 Toddler';
  return '🌲 Growing Child';
}

function getMilestonePill(ageInDays) {
  if (ageInDays <= 7)   return 'Week 1 · Adjusting to the world';
  if (ageInDays <= 14)  return 'Week 2 · Regaining birth weight';
  if (ageInDays <= 21)  return 'Week 3 · Hearing fully developed';
  if (ageInDays <= 30)  return 'Week 4 · First social smiles soon';
  if (ageInDays <= 60)  return 'Month 2 · Cooing & tracking faces';
  if (ageInDays <= 90)  return 'Month 3 · Head control developing';
  if (ageInDays <= 120) return 'Month 4 · Reaching for objects';
  if (ageInDays <= 180) return 'Month 6 · Sitting with support';
  if (ageInDays <= 270) return 'Month 9 · Crawling & exploring';
  if (ageInDays <= 365) return 'Month 12 · First steps approaching';
  return `${Math.floor(ageInDays / 30)} months old`;
}

function getAgeContext(ageInDays, childName) {
  const name = childName || 'your little one';
  if (ageInDays <= 30)   return `${name}'s brain is growing faster right now than it ever will again`;
  if (ageInDays <= 90)   return 'This is the golden window for bonding';
  if (ageInDays <= 180)  return `Every smile right now is building trust that lasts a lifetime`;
  if (ageInDays <= 365)  return `Every word ${name} hears becomes a building block for language`;
  if (ageInDays <= 730)  return 'Toddlerhood — the most curious year of human life';
  if (ageInDays <= 1460) return 'These are the years that shape who they become';
  return 'You have been showing up every single day. That is everything.';
}

function getNudge(child, latestUpdate, latestGrowth, healthRecords) {
  const name = child.name;
  const ageInDays = child.date_of_birth ? differenceInDays(new Date(), new Date(child.date_of_birth)) : 0;

  if (healthRecords?.length) {
    const upcoming = healthRecords.find(r => {
      if (!r.next_due_date || r.record_type !== 'vaccination') return false;
      const daysUntil = differenceInDays(new Date(r.next_due_date), new Date());
      return daysUntil >= 0 && daysUntil <= 7;
    });
    if (upcoming) {
      const d = differenceInDays(new Date(upcoming.next_due_date), new Date());
      return { text: `💉 ${name}'s ${upcoming.title} is ${d === 0 ? 'today' : `in ${d} day${d !== 1 ? 's' : ''}`}.`, path: `/child/${child.id}/health` };
    }
  }

  if (latestGrowth) {
    const daysSince = differenceInDays(new Date(), new Date(latestGrowth.record_date));
    if (daysSince >= 14) return { text: `📏 ${name} hasn't been measured in ${daysSince} days.`, path: `/child/${child.id}/growth` };
  } else if (ageInDays > 14) {
    return { text: `📏 Log ${name}'s first measurement — even one tells a story.`, path: `/child/${child.id}/growth` };
  }

  if (!latestUpdate) return { text: `📋 ${name}'s first check-in is waiting. Dr. Bloom will have something personal to say.`, path: `/child/${child.id}/weekly-update` };

  const daysSinceUpdate = differenceInDays(new Date(), new Date(latestUpdate.created_at));
  if (daysSinceUpdate >= 7) return { text: `📋 This week's check-in for ${name} is ready.`, path: `/child/${child.id}/weekly-update` };

  return null;
}

const DEMO_CHILD = {
  id: 'demo',
  name: 'Baby',
  date_of_birth: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  gender: 'male',
  is_pregnant: false,
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const realChild = useSelectedChild();
  const child = session ? realChild : DEMO_CHILD;
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const todayStr = new Date().toISOString().split('T')[0];
  const lastCheckin = localStorage.getItem(CHECKIN_KEY);
  const [activeMood, setActiveMood] = useState(null);
  const [checkinDone, setCheckinDone] = useState(lastCheckin === todayStr);
  const [checkinConfirm, setCheckinConfirm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const go = (path) => {
    if (!session) { setShowAuthModal(true); return; }
    navigate(path);
  };

  const { data: latestUpdate } = useQuery({
    queryKey: ['latest-update', child?.id],
    queryFn: async () => {
      const { data } = await supabase.from('weekly_updates').select('*').eq('child_id', child.id).order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!child?.id && !!session,
  });

  const { data: latestGrowth } = useQuery({
    queryKey: ['latest-growth', child?.id],
    queryFn: async () => {
      const { data } = await supabase.from('growth_records').select('*').eq('child_id', child.id).order('record_date', { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!child?.id && !!session,
  });

  const { data: healthRecords } = useQuery({
    queryKey: ['health-records-nudge', child?.id],
    queryFn: async () => {
      const { data } = await supabase.from('health_records').select('id, title, record_type, next_due_date').eq('child_id', child.id).eq('record_type', 'vaccination').not('next_due_date', 'is', null);
      return data || [];
    },
    enabled: !!child?.id && !!session,
  });

  const checkinMutation = useMutation({
    mutationFn: async (mood) => {
      if (!user || !child) return;
      const { data: todayUpdate } = await supabase.from('weekly_updates').select('id').eq('child_id', child.id).eq('week_date', todayStr).single();
      if (todayUpdate) await supabase.from('weekly_updates').update({ parent_mood: mood }).eq('id', todayUpdate.id);
    },
  });

  const handleMoodSelect = (mood) => {
    if (!session) { setShowAuthModal(true); return; }
    setActiveMood(mood);
    localStorage.setItem(CHECKIN_KEY, todayStr);
    checkinMutation.mutate(mood);
    const msgs = { tired: 'Rest when you can. Dr. Bloom knows.', good: 'That energy comes through. Dr. Bloom knows.', anxious: 'One thing at a time. Dr. Bloom knows.', strong: 'That strength shows. Dr. Bloom knows.' };
    setCheckinConfirm(msgs[mood] || 'Thank you.');
    setCheckinDone(true);
    setTimeout(() => {}, 2200);
  };

  if (session && !child) {
    return (
      <EmptyState
        title={t('dashboard.noChildren')}
        description={t('dashboard.addChildStart')}
        actionLabel={t('dashboard.goToSettings')}
        onAction={() => navigate('/settings')}
        icon={<BabyIcon className="w-8 h-8" />}
      />
    );
  }

  const ageInDays = child.date_of_birth ? differenceInDays(new Date(), new Date(child.date_of_birth)) : 0;
  const ageContext = getAgeContext(ageInDays, child.name);
  const stage = getStage(ageInDays);
  const milestonePill = getMilestonePill(ageInDays);
  const nudge = getNudge(child, latestUpdate, latestGrowth, healthRecords);
  const parentName = profile?.full_name?.split(' ')[0] || 'you';
  const initial = child.name?.charAt(0)?.toUpperCase() || '?';

  const ageLabel = ageInDays === 0
    ? 'Newborn'
    : ageInDays < 30
    ? `${ageInDays} days old`
    : ageInDays < 365
    ? `${Math.floor(ageInDays / 30)} months old`
    : `${Math.floor(ageInDays / 365)}y ${Math.floor((ageInDays % 365) / 30)}m old`;

  const dobLabel = child.date_of_birth
    ? `Born ${new Date(child.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';

  if (child.is_pregnant) {
    return <PregnancyDashboard child={child} navigate={navigate} go={go} t={t} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── HERO CARD ─────────────────────────────────────── */}
      <div
        className="rounded-[28px] p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden"
        style={{ background: '#1C5628', boxShadow: '0 8px 40px rgba(28,86,40,0.35)' }}
      >
        {/* decorative orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute right-16 -bottom-24 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)' }} />

        {/* Avatar */}
        <div
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 z-10"
          style={{ background: 'rgba(255,255,255,0.14)', border: '2px solid rgba(255,255,255,0.28)' }}
        >
          <span className="font-serif font-bold text-4xl sm:text-5xl select-none" style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
            {initial}
          </span>
          <div
            className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#fff', border: '2px solid #1C5628' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#1C5628" strokeWidth="2.5" strokeLinecap="round" width="10" height="10">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 relative z-10">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-3 tracking-wider uppercase"
            style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)' }}
          >
            {stage}
          </div>
          <h1 className="font-serif font-bold text-white leading-none mb-2" style={{ fontSize: 'clamp(36px,8vw,56px)', letterSpacing: '-2px' }}>
            {child.name}
          </h1>
          <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{ageLabel}{dobLabel ? ` · ${dobLabel}` : ''}</p>
          <p className="font-serif italic text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 340 }}>
            {ageContext}
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mt-4 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.82)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            {milestonePill}
          </button>
        </div>

        {/* Stats */}
        {(latestGrowth || latestUpdate) && (
          <div className="hidden sm:flex items-center gap-6 flex-shrink-0 relative z-10">
            {latestGrowth?.weight_kg && (
              <>
                <div className="text-center">
                  <div className="font-serif font-bold text-white" style={{ fontSize: 30, letterSpacing: '-0.8px', lineHeight: 1 }}>
                    {latestGrowth.weight_kg}<span className="font-sans font-normal text-xs ml-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>kg</span>
                  </div>
                  <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Weight</div>
                </div>
                <div className="w-px h-11" style={{ background: 'rgba(255,255,255,0.14)' }} />
              </>
            )}
            {latestGrowth?.height_cm && (
              <div className="text-center">
                <div className="font-serif font-bold text-white" style={{ fontSize: 30, letterSpacing: '-0.8px', lineHeight: 1 }}>
                  {latestGrowth.height_cm}<span className="font-sans font-normal text-xs ml-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>cm</span>
                </div>
                <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Height</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MOOD + SNAPSHOT ROW ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Mood Card */}
        <div className="bg-white rounded-[22px] border border-black/5 shadow-sm p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Parent Wellbeing</p>
          <p className="font-serif text-lg font-semibold text-forest-700 mb-1">
            How are you feeling{profile?.full_name ? `, ${parentName}` : ''}?
          </p>
          <p className="text-xs text-gray-400 mb-5">You matter too. This takes 2 seconds.</p>

          {checkinDone ? (
            <div className="py-2 text-center animate-fade-in">
              <p className="font-serif text-sm text-forest-700 italic">{checkinConfirm}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all duration-200 border-2 ${
                    activeMood === m.value
                      ? 'border-forest-500 bg-forest-50 shadow-sm'
                      : 'border-cream-200 bg-cream-50 hover:border-forest-300 hover:bg-forest-50/50'
                  }`}
                >
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  <span className={`text-xs font-medium ${activeMood === m.value ? 'text-forest-700 font-semibold' : 'text-gray-500'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Snapshot Card */}
        <div className="bg-white rounded-[22px] border border-black/5 shadow-sm p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Today's Summary</p>
          <p className="font-serif text-lg font-semibold text-forest-700 mb-4">{child.name} at a Glance</p>

          <div className="space-y-0">
            {[
              {
                icon: '🍼',
                name: 'Last Weight',
                when: latestGrowth?.record_date ? `Logged ${formatDate(latestGrowth.record_date)}` : 'Not logged yet',
                value: latestGrowth?.weight_kg ? formatWeight(latestGrowth.weight_kg) : '—',
              },
              {
                icon: '📏',
                name: 'Last Height',
                when: latestGrowth?.record_date ? `Logged ${formatDate(latestGrowth.record_date)}` : 'Not logged yet',
                value: latestGrowth?.height_cm ? formatHeight(latestGrowth.height_cm) : '—',
              },
              {
                icon: '📋',
                name: 'Last Check-in',
                when: latestUpdate?.created_at ? `${differenceInDays(new Date(), new Date(latestUpdate.created_at))} days ago` : 'Not done yet',
                value: latestUpdate ? '✓' : '—',
              },
            ].map((row, i, arr) => (
              <div key={row.name} className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? 'border-b border-cream-200' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-lg flex-shrink-0">
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-700">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.when}</p>
                  </div>
                </div>
                <span className="font-serif font-bold text-xl text-forest-600 leading-none">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-forest-700" style={{ letterSpacing: '-0.4px' }}>
            Everything for {child.name}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {[
            {
              icon: '📋',
              name: 'Check-in',
              desc: 'Daily health log & notes',
              path: `/child/${child.id}/weekly-update`,
              badge: 'Today',
              badgeColor: 'bg-forest-50 text-forest-700',
            },
            {
              icon: '📈',
              name: 'Growth',
              desc: 'Weight, height & head circ.',
              path: `/child/${child.id}/growth`,
            },
            {
              icon: '🍼',
              name: 'Food & Feeding',
              desc: 'Feeding tracker & schedule',
              path: `/child/${child.id}/food`,
            },
            {
              icon: '❤️',
              name: 'Health',
              desc: 'Vitals, vaccines & doctor visits',
              path: `/child/${child.id}/health`,
            },
            {
              icon: '📚',
              name: 'Guides',
              desc: 'Expert-backed parenting content',
              path: '/guides',
            },
            {
              icon: '🌸',
              name: 'Dr. Bloom',
              desc: 'Your AI pediatric assistant',
              path: '/ask',
              badge: 'AI',
              badgeColor: 'bg-amber-50 text-amber-700',
            },
          ].map((feat) => (
            <button
              key={feat.path}
              onClick={() => go(feat.path)}
              className="group relative bg-white rounded-[22px] border border-black/5 shadow-sm p-5 text-left transition-all duration-250 hover:shadow-xl hover:-translate-y-1 hover:border-forest-200 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-forest-500 to-forest-400 opacity-0 group-hover:opacity-100 transition-opacity duration-250 rounded-t-[22px]" />
              {feat.badge && (
                <span className={`absolute top-3.5 right-3.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.badgeColor}`}>
                  {feat.badge}
                </span>
              )}
              <div className="w-11 h-11 rounded-2xl bg-forest-50 flex items-center justify-center text-2xl mb-3.5 transition-all duration-200 group-hover:bg-forest-100 group-hover:scale-110">
                {feat.icon}
              </div>
              <p className="text-sm font-semibold text-forest-700 mb-1 leading-tight">{feat.name}</p>
              <p className="text-xs text-gray-400 leading-snug">{feat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── CTA BUTTON ───────────────────────────────────── */}
      <button
        onClick={() => go(`/child/${child.id}/weekly-update`)}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[14px] text-white text-sm font-semibold transition-all duration-250 hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: '#1C5628', boxShadow: '0 4px 18px rgba(28,86,40,0.35)' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(28,86,40,0.45)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(28,86,40,0.35)'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Log how {child.name} has been today
      </button>

      {/* ── AI INSIGHT ───────────────────────────────────── */}
      {latestUpdate?.ai_insight && (
        <div className="bg-forest-50/60 border border-forest-200/60 rounded-[22px] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-600/70 mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Dr. Bloom on {child.name}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{latestUpdate.ai_insight}</p>
          <button onClick={() => go('/ask')} className="mt-3 text-xs text-forest-600 font-semibold hover:text-forest-700 flex items-center gap-1 transition-colors">
            Ask Dr. Bloom anything →
          </button>
        </div>
      )}

      {/* ── NUDGE ────────────────────────────────────────── */}
      {nudge && (
        <button onClick={() => go(nudge.path)} className="w-full text-left">
          <div className="bg-cream-50 border-l-[3px] border-forest-700 rounded-r-xl px-4 py-3.5 hover:bg-cream-100 transition-colors">
            <p className="text-sm text-gray-700 leading-snug">{nudge.text}</p>
          </div>
        </button>
      )}

      {/* ── ACTIVITY TIMELINE ────────────────────────────── */}
      {(latestUpdate || latestGrowth) && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-forest-700" style={{ letterSpacing: '-0.4px' }}>Recent Activity</h2>
          </div>
          <div className="bg-white rounded-[22px] border border-black/5 shadow-sm p-6">
            <div className="space-y-0">
              {[
                latestUpdate && {
                  icon: '📋',
                  title: 'Weekly check-in completed',
                  detail: latestUpdate.mood ? `Parent mood: ${latestUpdate.mood.replace('_', ' ')}` : 'Check-in logged',
                  time: formatDate(latestUpdate.created_at),
                  live: differenceInDays(new Date(), new Date(latestUpdate.created_at)) === 0,
                },
                latestGrowth && {
                  icon: '📏',
                  title: 'Growth measurement logged',
                  detail: [latestGrowth.weight_kg && `Weight: ${formatWeight(latestGrowth.weight_kg)}`, latestGrowth.height_cm && `Height: ${formatHeight(latestGrowth.height_cm)}`].filter(Boolean).join(' · '),
                  time: formatDate(latestGrowth.record_date),
                  live: false,
                },
              ].filter(Boolean).map((item, i, arr) => (
                <div key={item.title} className={`flex gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-cream-200' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-forest-700 mb-0.5">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.live && (
                        <span className="inline-flex items-center gap-1 bg-forest-50 text-forest-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
                          Today
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AUTH GATE MODAL ──────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl animate-fade-in-up">
            <div className="w-14 h-14 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-forest-700 text-center mb-2">Join ChildBloom</h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-7">
              Track your baby's growth, milestones, and get personalised guidance from Dr. Bloom — free.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-4 rounded-xl text-white text-sm font-semibold mb-3 transition-all hover:opacity-90"
              style={{ background: '#1C5628' }}
            >
              Create free account
            </button>
            <button className="w-full text-sm text-center text-gray-400 hover:text-forest-700 transition-colors py-1" onClick={() => navigate('/auth')}>
              Already have an account? <span className="font-semibold text-forest-600">Sign in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PregnancyDashboard({ child, navigate, go, t }) {
  const pregnancy = formatPregnancyWeek(child.due_date);
  const daysUntilDue = differenceInDays(new Date(child.due_date), new Date());
  const progress = Math.min((pregnancy.weeks / 40) * 100, 100);

  return (
    <div className="space-y-5 animate-fade-in">
      <div
        className="rounded-[28px] p-7 sm:p-9 relative overflow-hidden"
        style={{ background: '#1C5628', boxShadow: '0 8px 40px rgba(28,86,40,0.35)' }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-3 tracking-wider uppercase"
          style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)' }}
        >
          🤰 {t('dashboard.trimester', { number: pregnancy.trimester })}
        </div>
        <h1 className="font-serif font-bold text-white mb-2" style={{ fontSize: 52, letterSpacing: '-2px', lineHeight: 0.95 }}>
          Week {pregnancy.weeks}
        </h1>
        <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {daysUntilDue > 0 ? t('dashboard.daysUntilDue', { days: daysUntilDue }) : t('dashboard.dueDatePassed')}
        </p>
        <p className="font-serif italic text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          These are the weeks you will never forget.
        </p>
        <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span className="font-medium uppercase tracking-wider">{t('dashboard.progress')}</span>
            <span className="font-bold text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: '#7FE89A' }} />
          </div>
        </div>
      </div>

      <button
        onClick={() => go(`/child/${child.id}/weekly-update`)}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[14px] text-white text-sm font-semibold"
        style={{ background: '#1C5628', boxShadow: '0 4px 18px rgba(28,86,40,0.35)' }}
      >
        {t('dashboard.weeklyCheckin')}
      </button>
    </div>
  );
}
