import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import useUiStore from '../../stores/uiStore';
import ChildSwitcher from '../shared/ChildSwitcher';
import { DashboardIcon, GrowthIcon, FoodIcon, BookIcon, ChatIcon, HealthIcon, SettingsIcon, ClipboardIcon, LogoutIcon } from '../../assets/icons';
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
      { to: `/child/${childId}/growth`, icon: GrowthIcon, label: t('nav.growth') },
      { to: `/child/${childId}/food`, icon: FoodIcon, label: t('nav.foodTracker') },
      { to: `/child/${childId}/health`, icon: HealthIcon, label: t('nav.health') },
    ] : []),
    { to: '/guides', icon: BookIcon, label: t('nav.guides') },
    { to: '/ask', icon: ChatIcon, label: t('nav.askAi') },
    { to: '/settings', icon: SettingsIcon, label: t('nav.settings') },
  ];

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/15 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-cream-300/60 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h1 className="text-body-lg font-serif font-bold text-forest-700">{t('app.name')}</h1>
                <p className="text-micro text-gray-400 uppercase tracking-wider">{t('app.tagline')}</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-3"><ChildSwitcher /></div>
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-caption font-medium transition-all duration-200 relative ${isActive ? 'bg-forest-50 text-forest-700' : 'text-gray-500 hover:bg-cream-200 hover:text-forest-600'}`}>
                {({ isActive }) => (<>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-terracotta-400 rounded-r-full" />}
                  <div className={`transition-colors ${isActive ? 'text-forest-600' : 'text-gray-400 group-hover:text-forest-500'}`}><item.icon className="w-[18px] h-[18px]" /></div>
                  {item.label}
                </>)}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-cream-300/60">
            <button onClick={signOut} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-caption font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200">
              <LogoutIcon className="w-[18px] h-[18px]" /> {t('nav.signOut')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
