import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden flex flex-col">
      {/* Subtle background shapes — no blobs, just gentle gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-forest-50/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-terracotta-50/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-forest-700 rounded-2xl shadow-elevated mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-display font-serif text-forest-700">{t('app.name')}</h1>
            <p className="text-body text-gray-500 mt-2">{t('app.tagline')}</p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Outlet />
          </div>
        </div>
      </div>

      <footer className="py-5 text-center relative z-10">
        <p className="text-micro text-gray-400 max-w-sm mx-auto px-4 uppercase tracking-wider">
          {t('app.disclaimer')}
        </p>
      </footer>
    </div>
  );
}
