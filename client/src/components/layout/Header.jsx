import { useTranslation } from 'react-i18next';
import useUiStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import { MenuIcon } from '../../assets/icons';
import { format } from 'date-fns';

export default function Header() {
  const { t } = useTranslation();
  const { toggleSidebar } = useUiStore();
  const profile = useAuthStore((s) => s.profile);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-xl border-b border-cream-300/50 safe-area-top">
      <div className="flex items-center justify-between px-4 sm:px-5 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-cream-200 rounded-xl transition-colors duration-200 active:scale-95 flex-shrink-0" aria-label="Toggle menu">
            <MenuIcon className="w-5 h-5 text-forest-600" />
          </button>
          <div className="min-w-0">
            <h2 className="text-body-lg font-serif font-semibold text-forest-700 truncate">
              {greeting()}, <span className="text-terracotta-400">{firstName}</span>
            </h2>
            <p className="text-micro text-gray-400 mt-0.5 uppercase tracking-wider">
              {format(new Date(), 'EEE, MMM d')}<span className="hidden sm:inline">, {format(new Date(), 'yyyy')}</span>
            </p>
          </div>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-forest-700 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
          <span className="text-xs sm:text-sm font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}
