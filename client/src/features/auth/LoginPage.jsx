import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '../../lib/validators';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Exact dock container treatment
    <div
      className="rounded-2xl border border-white/10 p-8 sm:p-10 shadow-2xl"
      style={{
        background: 'rgba(0, 0, 0, 0.40)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <h2 className="text-h2 font-serif text-white text-center mb-1">{t('auth.welcomeBack')}</h2>
      <p className="text-body text-white/40 text-center mb-8">{t('auth.signInContinue')}</p>

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
        <Input label={t('auth.password')} type="password" placeholder="Enter your password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={loading} className="w-full" size="lg" variant="primary">
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-micro uppercase tracking-wider text-white/30" style={{ background: 'transparent' }}>
            {t('auth.or')}
          </span>
        </div>
      </div>

      <p className="text-body text-white/40 text-center">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-white/80 font-semibold hover:text-white transition-colors">
          {t('auth.signUpFree')}
        </Link>
      </p>
    </div>
  );
}
