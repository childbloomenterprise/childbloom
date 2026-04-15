import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ChildSwitcher from '../../components/shared/ChildSwitcher';
import AgeDisplay from '../../components/shared/AgeDisplay';
import EmptyState from '../../components/shared/EmptyState';
import { formatAge, formatWeight, formatHeight, formatDate, formatPregnancyWeek, formatAgeInDays } from '../../lib/formatters';
import { ClipboardIcon, GrowthIcon, FoodIcon, BookIcon, ChatIcon, HealthIcon, ChevronRightIcon, BabyIcon } from '../../assets/icons';
import { differenceInDays } from 'date-fns';

const CHECKIN_KEY = 'childbloom_parent_checkin_date';

const MOOD_OPTIONS = [
  { emoji: '😴', label: 'Tired',   value: 'tired' },
  { emoji: '😊', label: 'Good',    value: 'good' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '💪', label: 'Strong',  value: 'strong' },
];

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

function getNudgeCard(child, latestUpdate, latestGrowth, healthRecords) {
  const name = child.name;
  const ageInDays = child.date_of_birth ? differenceInDays(new Date(), new Date(child.date_of_birth)) : 0;

  // Priority 1 — upcoming vaccine
  if (healthRecords?.length) {
    const upcoming = healthRecords.find(r => {
      if (!r.next_due_date || r.record_type !== 'vaccination') return false;
      const daysUntil = differenceInDays(new Date(r.next_due_date), new Date());
      return daysUntil >= 0 && daysUntil <= 7;
    });
    if (upcoming) {
      const daysUntil = differenceInDays(new Date(upcoming.next_due_date), new Date());
      return {
        text: `💉 ${name}'s ${upcoming.title} is ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}. Tap to see what to expect.`,
        path: `/child/${child.id}/health`,
      };
    }
  }

  // Priority 2 — no growth logged in 14+ days
  if (latestGrowth) {
    const daysSince = differenceInDays(new Date(), new Date(latestGrowth.record_date));
    if (daysSince >= 14) {
      return {
        text: `📏 ${name} hasn't been measured in ${daysSince} days. Even one measurement tells a story.`,
        path: `/child/${child.id}/growth`,
      };
    }
  } else if (ageInDays > 14) {
    return {
      text: `📏 ${name} hasn't been measured yet. Even one measurement tells a story.`,
      path: `/child/${child.id}/growth`,
    };
  }

  // Priority 3 — no food log today
  const todayStr = new Date().toISOString().split('T')[0];
  // we only nudge if child is 6+ months (solids age)
  if (ageInDays > 180) {
    return {
      text: `🥗 What did ${name} eat today? One log creates a pattern over time.`,
      path: `/child/${child.id}/food`,
    };
  }

  // Priority 4 — weekly update not done this week
  if (!latestUpdate) {
    return {
      text: `📋 ${name}'s first check-in is waiting. It takes 3 minutes and Dr. Bloom will have something personal to say afterwards.`,
      path: `/child/${child.id}/weekly-update`,
    };
  }
  const daysSinceUpdate = differenceInDays(new Date(), new Date(latestUpdate.created_at));
  if (daysSinceUpdate >= 7) {
    return {
      text: `📋 This week's check-in is waiting. It takes 3 minutes and Dr. Bloom will have something to say about ${name} afterwards.`,
      path: `/child/${child.id}/weekly-update`,
    };
  }

  return null;
}

const DEMO_CHILD = {
  id: 'demo',
  name: 'Baby',
  date_of_birth: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split('T')[0];
  const lastCheckin = localStorage.getItem(CHECKIN_KEY);
  const [showCheckin, setShowCheckin] = useState(lastCheckin !== todayStr);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkinConfirm, setCheckinConfirm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Require login before any navigation action
  const go = (path) => {
    if (!session) { setShowAuthModal(true); return; }
    navigate(path);
  };

  const { data: latestUpdate } = useQuery({
    queryKey: ['latest-update', child?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_updates')
        .select('*')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!child?.id && !!session,
  });

  const { data: latestGrowth } = useQuery({
    queryKey: ['latest-growth', child?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('growth_records')
        .select('*')
        .eq('child_id', child.id)
        .order('record_date', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!child?.id && !!session,
  });

  const { data: healthRecords } = useQuery({
    queryKey: ['health-records-nudge', child?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('health_records')
        .select('id, title, record_type, next_due_date')
        .eq('child_id', child.id)
        .eq('record_type', 'vaccination')
        .not('next_due_date', 'is', null);
      return data || [];
    },
    enabled: !!child?.id && !!session,
  });

  const checkinMutation = useMutation({
    mutationFn: async (mood) => {
      if (!user || !child) return;
      const { data: todayUpdate } = await supabase
        .from('weekly_updates')
        .select('id')
        .eq('child_id', child.id)
        .eq('week_date', todayStr)
        .single();

      if (todayUpdate) {
        await supabase.from('weekly_updates').update({ parent_mood: mood }).eq('id', todayUpdate.id);
      }
    },
  });

  const handleMoodSelect = async (mood) => {
    if (!session) { setShowAuthModal(true); return; }
    localStorage.setItem(CHECKIN_KEY, todayStr);
    checkinMutation.mutate(mood);
    const confirmMap = {
      tired: 'Rest when you can. Dr. Bloom knows.',
      good: 'That energy comes through. Dr. Bloom knows.',
      anxious: 'One thing at a time. Dr. Bloom knows.',
      strong: 'That strength shows. Dr. Bloom knows.',
    };
    setCheckinConfirm(confirmMap[mood] || 'Thank you for checking in. Dr. Bloom knows.');
    setCheckinDone(true);
    setTimeout(() => setShowCheckin(false), 2200);
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

  const quickLinks = [
    { label: t('nav.weeklyUpdate'), icon: ClipboardIcon, to: `/child/${child.id}/weekly-update`, bg: 'bg-forest-50', iconColor: 'text-forest-600' },
    { label: t('dashboard.growthChart'), icon: GrowthIcon, to: `/child/${child.id}/growth`, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: t('nav.foodTracker'), icon: FoodIcon, to: `/child/${child.id}/food`, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: t('dashboard.healthRecords'), icon: HealthIcon, to: `/child/${child.id}/health`, bg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { label: t('nav.guides'), icon: BookIcon, to: '/guides', bg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: t('nav.askAi'), icon: ChatIcon, to: '/ask', bg: 'bg-terracotta-50', iconColor: 'text-terracotta-400' },
  ];

  if (child.is_pregnant) {
    return <PregnancyDashboard child={child} profile={profile} navigate={navigate} quickLinks={quickLinks} t={t} />;
  }

  const ageInDays = child.date_of_birth ? differenceInDays(new Date(), new Date(child.date_of_birth)) : 0;
  const ageContext = getAgeContext(ageInDays, child.name);
  const nudge = getNudgeCard(child, latestUpdate, latestGrowth, healthRecords);
  const parentName = profile?.full_name?.split(' ')[0] || 'you';

  return (
    <div className="space-y-6 stagger-children">
      <ChildSwitcher />

      {/* Hero Card */}
      <Card className="p-5 sm:p-7 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-28 h-28 bg-forest-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-h1 font-serif text-forest-700 truncate">{child.name}</h1>
            <AgeDisplay child={child} />
            {/* Contextual age headline */}
            <p className="text-sm italic font-serif text-forest-600/80 mt-2 leading-snug">{ageContext}</p>
            {latestUpdate && (
              <p className="text-micro text-gray-400 mt-3 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-forest-400 rounded-full flex-shrink-0" />
                {t('dashboard.lastUpdate', { date: formatDate(latestUpdate.created_at) })}
              </p>
            )}
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-forest-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BabyIcon className="w-7 h-7 sm:w-8 sm:h-8 text-forest-600" />
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      {(latestGrowth || latestUpdate) && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { label: t('dashboard.weight'), value: formatWeight(latestGrowth?.weight_kg || latestUpdate?.weight_kg), bg: 'bg-blue-50', accent: 'bg-blue-400' },
            { label: t('dashboard.height'), value: formatHeight(latestGrowth?.height_cm || latestUpdate?.height_cm), bg: 'bg-violet-50', accent: 'bg-violet-400' },
            { label: t('dashboard.mood'), value: latestUpdate?.mood?.replace('_', ' ') || '—', bg: 'bg-amber-50', accent: 'bg-amber-400' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-3.5 sm:p-4 text-center ${stat.bg} border-transparent`}>
              <p className="text-micro font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-center gap-1.5">
                <span className={`w-1.5 h-1.5 ${stat.accent} rounded-full`} />
                {stat.label}
              </p>
              <p className="text-h3 font-serif font-bold text-forest-700 capitalize truncate">{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Parent emotional check-in — once per day */}
      {showCheckin && (
        <Card className="p-4 sm:p-5 rounded-2xl border-cream-300">
          {!checkinDone ? (
            <>
              <p className="text-caption font-semibold text-forest-700">
                How are you feeling today{profile?.full_name ? `, ${parentName}` : ''}?
              </p>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">You matter too. This takes 2 seconds.</p>
              <div className="flex gap-2.5 justify-between">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => handleMoodSelect(m.value)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 border-cream-200 hover:border-forest-300 hover:bg-forest-50/50 transition-all duration-200 active:scale-95"
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-micro text-gray-500">{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-1 animate-fade-in">
              <p className="font-serif text-sm text-forest-700 italic">{checkinConfirm}</p>
            </div>
          )}
        </Card>
      )}

      {/* Dr. Bloom AI Insight */}
      {latestUpdate?.ai_insight && (
        <Card accent="green" className="p-5 sm:p-6 bg-forest-50/40">
          <p className="text-micro font-bold uppercase tracking-wider text-forest-600/70 mb-2.5 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('dashboard.aiInsight', { name: child.name })}
          </p>
          <p className="text-body text-gray-600 leading-relaxed">{latestUpdate.ai_insight}</p>
          <button
            onClick={() => go('/ask')}
            className="mt-3 text-micro text-forest-600 font-semibold hover:text-forest-700 flex items-center gap-1"
          >
            Ask Dr. Bloom anything
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </Card>
      )}

      {/* Primary CTA */}
      <Button
        onClick={() => go(`/child/${child.id}/weekly-update`)}
        className="w-full"
        size="lg"
      >
        <ClipboardIcon className="w-5 h-5 mr-2" />
        {child.name ? t('dashboard.logThisWeek', { name: child.name }) : t('dashboard.logThisWeekGeneric')}
      </Button>

      {/* Contextual nudge card */}
      {nudge && (
        <button
          onClick={() => go(nudge.path)}
          className="w-full text-left"
        >
          <div className="bg-cream-50 border-l-[3px] border-forest-700 rounded-r-xl px-4 py-3.5">
            <p className="text-sm text-gray-700 leading-snug">{nudge.text}</p>
          </div>
        </button>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-h3 font-serif text-forest-700 mb-3">
          {child.name ? t('dashboard.quickAccess', { name: child.name }) : t('dashboard.quickAccessGeneric')}
        </h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {quickLinks.map((link) => (
            <Card
              key={link.to}
              hover
              className="p-3.5 sm:p-4 group"
              onClick={() => go(link.to)}
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2.5 ${link.bg} group-hover:scale-105 transition-transform duration-250`}>
                <link.icon className={`w-5 h-5 ${link.iconColor}`} />
              </div>
              <p className="text-caption font-semibold text-forest-700 group-hover:text-terracotta-400 transition-colors leading-tight">{link.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Auth gate modal for guests */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="relative bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl animate-fade-in-up">
            {/* Dr. Bloom icon */}
            <div className="w-14 h-14 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-forest-700 text-center mb-2">Join ChildBloom</h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-7">
              Track your baby's growth, milestones, and get personalised guidance from Dr. Bloom — free.
            </p>
            <Button className="w-full mb-3" size="lg" onClick={() => navigate('/auth')}>
              Create free account
            </Button>
            <button
              className="w-full text-sm text-center text-gray-400 hover:text-forest-700 transition-colors py-1"
              onClick={() => navigate('/auth')}
            >
              Already have an account? <span className="font-semibold text-forest-600">Sign in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PregnancyDashboard({ child, profile, navigate, quickLinks, t }) {
  const pregnancy = formatPregnancyWeek(child.due_date);
  const daysUntilDue = differenceInDays(new Date(child.due_date), new Date());
  const progress = Math.min((pregnancy.weeks / 40) * 100, 100);

  return (
    <div className="space-y-6 stagger-children">
      <ChildSwitcher />

      {/* Pregnancy Hero */}
      <Card className="p-5 sm:p-7 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-forest-50/50 rounded-full blur-2xl" />
        <div className="relative">
          <Badge variant="primary" className="mb-3">{t('dashboard.trimester', { number: pregnancy.trimester })}</Badge>
          <h1 className="text-h1 font-serif text-forest-700">Week {pregnancy.weeks}</h1>
          <p className="text-body text-gray-500 mt-1">
            {daysUntilDue > 0 ? t('dashboard.daysUntilDue', { days: daysUntilDue }) : t('dashboard.dueDatePassed')}
          </p>
          <p className="text-sm italic font-serif text-forest-600/80 mt-2">
            These are the weeks you will never forget.
          </p>

          {/* Progress Bar */}
          <div className="mt-5 bg-cream-100 rounded-xl p-4">
            <div className="flex justify-between text-micro text-gray-500 mb-2.5 uppercase tracking-wider">
              <span className="font-medium">{t('dashboard.progress')}</span>
              <span className="font-bold text-forest-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Button
        onClick={() => navigate(`/child/${child.id}/weekly-update`)}
        className="w-full"
        size="lg"
      >
        <ClipboardIcon className="w-5 h-5 mr-2" />
        {t('dashboard.weeklyCheckin')}
      </Button>

      <div>
        <h2 className="text-h3 font-serif text-forest-700 mb-3">{t('dashboard.quickAccessGeneric')}</h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {quickLinks.map((link) => (
            <Card key={link.to} hover className="p-3.5 sm:p-4 group" onClick={() => navigate(link.to)}>
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2.5 ${link.bg} group-hover:scale-105 transition-transform duration-250`}>
                <link.icon className={`w-5 h-5 ${link.iconColor}`} />
              </div>
              <p className="text-caption font-semibold text-forest-700 group-hover:text-terracotta-400 transition-colors leading-tight">{link.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
