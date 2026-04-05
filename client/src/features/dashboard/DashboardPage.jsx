import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { formatAge, formatWeight, formatHeight, formatDate, formatPregnancyWeek } from '../../lib/formatters';
import { ClipboardIcon, GrowthIcon, FoodIcon, BookIcon, ChatIcon, HealthIcon, ChevronRightIcon, BabyIcon } from '../../assets/icons';
import { differenceInDays } from 'date-fns';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const child = useSelectedChild();
  const profile = useAuthStore((s) => s.profile);

  const { data: latestUpdate, isLoading: updateLoading } = useQuery({
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
    enabled: !!child?.id,
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
    enabled: !!child?.id,
  });

  if (!child) {
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

  return (
    <div className="space-y-6 stagger-children">
      <ChildSwitcher />

      {/* Hero Card — child overview */}
      <Card className="p-5 sm:p-7 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-28 h-28 bg-forest-50/50 rounded-full blur-2xl -translate-y-8 translate-x-8" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-h1 font-serif text-forest-700 truncate">{child.name}</h1>
            <AgeDisplay child={child} />
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

      {/* CTA Button */}
      <Button
        onClick={() => navigate(`/child/${child.id}/weekly-update`)}
        className="w-full"
        size="lg"
      >
        <ClipboardIcon className="w-5 h-5 mr-2" />
        {t('dashboard.logThisWeek')}
      </Button>

      {/* AI Insight */}
      {latestUpdate?.ai_insight && (
        <Card accent="green" className="p-5 sm:p-6 bg-forest-50/40">
          <p className="text-micro font-bold uppercase tracking-wider text-forest-600/70 mb-2.5 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('dashboard.aiInsight', { name: child.name })}
          </p>
          <p className="text-body text-gray-600 leading-relaxed">{latestUpdate.ai_insight}</p>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-h3 font-serif text-forest-700 mb-3">{t('dashboard.quickAccess')}</h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {quickLinks.map((link) => (
            <Card
              key={link.to}
              hover
              className="p-3.5 sm:p-4 group"
              onClick={() => navigate(link.to)}
            >
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
        <h2 className="text-h3 font-serif text-forest-700 mb-3">{t('dashboard.quickAccess')}</h2>
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
