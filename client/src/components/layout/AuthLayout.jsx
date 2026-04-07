import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoWordmark } from '../ui/LogoMark';

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    // 60% (#F7F4EF) — warm cream canvas
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: '#F7F4EF' }}>
      {/* Soft ambient shapes using 30% blush */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(232,196,184,0.6) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(143,186,200,0.20) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(232,196,184,0.45) 0%, transparent 70%)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <div className="flex flex-col items-center mb-10 animate-fade-in-up">
            <LogoWordmark iconSize={52} className="mb-4" />
            <p className="text-body text-center" style={{ color: 'rgba(61,43,35,0.50)' }}>{t('app.tagline')}</p>
          </div>

          {/* Form */}
          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Outlet />
          </div>
        </div>
      </div>

      <footer className="py-5 text-center relative z-10">
        <p className="text-micro max-w-sm mx-auto px-4 uppercase tracking-wider" style={{ color: 'rgba(61,43,35,0.30)' }}>
          {t('app.disclaimer')}
        </p>
      </footer>
    </div>
  );
}
