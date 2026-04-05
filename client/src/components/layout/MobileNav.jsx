import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import { DashboardIcon, GrowthIcon, BookIcon, ChatIcon, SettingsIcon } from '../../assets/icons';

export default function MobileNav() {
  const { t } = useTranslation();
  const child = useSelectedChild();

  const items = [
    { to: '/dashboard', icon: DashboardIcon, label: t('nav.home') },
    { to: child ? `/child/${child.id}/growth` : '/dashboard', icon: GrowthIcon, label: t('nav.growth') },
    { to: '/guides', icon: BookIcon, label: t('nav.guides') },
    { to: '/ask', icon: ChatIcon, label: t('nav.askAi') },
    { to: '/settings', icon: SettingsIcon, label: t('nav.more') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-cream-300/60 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex items-center justify-around py-1.5 px-2">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all duration-200 ${isActive ? 'text-terracotta-400' : 'text-gray-400 active:scale-90 active:text-gray-500'}`}>
            {({ isActive }) => (<>
              <div className={`relative p-1 transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                <item.icon className={`${isActive ? 'w-6 h-6' : 'w-5 h-5'}`} />
                {isActive && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-terracotta-400 rounded-full" />}
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${isActive ? 'text-terracotta-400' : ''}`}>{item.label}</span>
            </>)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
