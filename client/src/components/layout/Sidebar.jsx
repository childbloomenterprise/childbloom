import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import useUiStore from '../../stores/uiStore';
import ChildSwitcher from '../shared/ChildSwitcher';
import { DashboardIcon, GrowthIcon, FoodIcon, BookIcon, ChatIcon, HealthIcon, SettingsIcon, ClipboardIcon, LogoutIcon, EmergencyIcon, VaccineIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { signOut } = useAuth();
  const childId = child?.id;

  const navItems = [
    { to: '/dashboard', icon: DashboardIcon, label: t('nav.dashboard') },
    ...(childId ? [
      { to: `/child/${childId}/weekly-update`, icon: ClipboardIcon, label: t('nav.weeklyUpdate') },
      { to: `/child/${childId}/growth`,        icon: GrowthIcon,    label: t('nav.growth') },
      { to: `/child/${childId}/food`,          icon: FoodIcon,      label: t('nav.foodTracker') },
      { to: `/child/${childId}/health`,        icon: HealthIcon,    label: t('nav.health') },
      { to: `/child/${childId}/vaccinations`, icon: VaccineIcon,   label: t('nav.vaccines') },
    ] : []),
    { to: '/guides',    icon: BookIcon,      label: t('nav.guides') },
    { to: '/ask',       icon: ChatIcon,      label: t('nav.askAi') },
    { to: '/emergency', icon: EmergencyIcon, label: t('emergency.nav'), emergency: true },
    { to: '/settings',  icon: SettingsIcon,  label: t('nav.settings') },
  ];

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '2px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-body-lg font-serif font-bold" style={{ color: '#1C1C1E' }}>{t('app.name')}</h1>
              <p className="text-micro text-gray-400 uppercase tracking-wider">{t('app.tagline')}</p>
            </div>
          </div>
        </div>

        {/* Child switcher */}
        <div className="px-4 pb-3">
          <ChildSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className="relative block"
            >
              {({ isActive }) => {
                const isEmergency = item.emergency;
                const activeStyle = isEmergency
                  ? {
                      background: 'linear-gradient(135deg, rgba(220,38,38,0.10) 0%, rgba(153,27,27,0.07) 100%)',
                      color: '#DC2626',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                    }
                  : {
                      background: 'linear-gradient(135deg, rgba(251,113,133,0.12) 0%, rgba(244,63,94,0.08) 100%)',
                      color: '#F43F5E',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                    };
                const pillStyle = isEmergency
                  ? { background: 'linear-gradient(180deg, #EF4444, #DC2626)' }
                  : { background: 'linear-gradient(180deg, #FB7185, #F43F5E)' };
                const inactiveColor = isEmergency ? 'rgba(220,38,38,0.55)' : '#8E8E93';
                return (
                  <div
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-caption font-semibold transition-all duration-200 relative ${isActive ? '' : 'hover:bg-white/60'}`}
                    style={isActive ? activeStyle : { color: inactiveColor }}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={pillStyle}
                      />
                    )}
                    <div className={`transition-colors ${isActive ? '' : 'group-hover:text-gray-600'}`}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    {item.label}
                  </div>
                );
              }}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.6)' }}
        >
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-caption font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50/60 w-full transition-all duration-200"
          >
            <LogoutIcon className="w-[18px] h-[18px]" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
