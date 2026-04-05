import { useTranslation } from 'react-i18next';
import useAuthStore from '../../stores/authStore';
import { format } from 'date-fns';

export default function Header() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    // Exact dock bg treatment applied to header
    <header
      className="sticky top-0 z-30 safe-area-top"
      style={{
        background: 'rgba(0, 0, 0, 0.40)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="min-w-0">
          <h2 className="text-body-lg font-serif font-semibold text-white truncate">
            {greeting()},{' '}
            <span className="text-white/60">{firstName}</span>
          </h2>
          <p className="text-micro text-white/30 mt-0.5 uppercase tracking-wider">
            {format(new Date(), 'EEE, MMM d, yyyy')}
          </p>
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform flex-shrink-0 border border-white/20"
          style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <span className="text-xs sm:text-sm font-bold text-white">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
