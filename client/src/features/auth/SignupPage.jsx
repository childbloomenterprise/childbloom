import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { signupSchema } from '../../lib/validators';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

function LanguageSelector() {
  const { i18n: i18nHook } = useTranslation();
  const currentLang = i18nHook.language?.slice(0, 2) || 'en';

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('childbloom-lang', code);
  };

  return (
    <div className="mb-6">
      <p className="text-micro font-semibold uppercase tracking-wider text-center mb-3 text-white/30">
        Choose language / भाषा चुनें
      </p>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleChange(lang.code)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 border ${
              currentLang === lang.code
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      await signUp(data.email, data.password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-white/10 p-8 sm:p-10 text-center animate-scale-in shadow-2xl"
        style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-h2 font-serif text-white mb-2">{t('auth.checkEmail')}</h2>
        <p className="text-body text-white/40 mb-8 leading-relaxed">{t('auth.confirmationSent')}</p>
        <Link to="/login" className="text-white/70 font-semibold hover:text-white transition-colors">{t('auth.backToSignIn')}</Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 p-8 sm:p-10 shadow-2xl"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

      <LanguageSelector />

      <h2 className="text-h2 font-serif text-white text-center mb-1">{t('auth.createAccount')}</h2>
      <p className="text-body text-white/40 text-center mb-8">{t('auth.startJourney')}</p>

      {error && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-2.5 animate-scale-in border border-red-500/20 text-red-400" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-caption">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label={t('auth.email')} type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label={t('auth.password')} type="password" placeholder="At least 6 characters" error={errors.password?.message} {...register('password')} />
        <Input label={t('auth.confirmPassword')} type="password" placeholder="Repeat your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={loading} className="w-full" size="lg" variant="primary">
          {t('auth.createAccount')}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-micro uppercase tracking-wider text-white/30">{t('auth.or')}</span>
        </div>
      </div>

      <p className="text-body text-white/40 text-center">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-white/80 font-semibold hover:text-white transition-colors">{t('auth.signIn')}</Link>
      </p>
    </div>
  );
}
