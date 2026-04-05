import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { signupSchema } from '../../lib/validators';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

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
      <Card className="p-8 sm:p-10 text-center shadow-elevated border-cream-200 animate-scale-in">
        <div className="w-16 h-16 bg-forest-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-h2 font-serif text-forest-700 mb-2">{t('auth.checkEmail')}</h2>
        <p className="text-body text-gray-500 mb-8 leading-relaxed">
          {t('auth.confirmationSent')}
        </p>
        <Link to="/login" className="text-terracotta-400 font-semibold hover:text-terracotta-500 text-body transition-colors">
          {t('auth.backToSignIn')}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 sm:p-10 shadow-elevated border-cream-200">
      <h2 className="text-h2 font-serif text-forest-700 text-center mb-1">{t('auth.createAccount')}</h2>
      <p className="text-body text-gray-500 text-center mb-8">{t('auth.startJourney')}</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-caption rounded-xl p-4 mb-6 flex items-center gap-2.5 animate-scale-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('auth.password')}
          type="password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t('auth.createAccount')}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-300" /></div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-micro text-gray-400 uppercase tracking-wider">{t('auth.or')}</span>
        </div>
      </div>

      <p className="text-body text-gray-500 text-center">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-terracotta-400 font-semibold hover:text-terracotta-500 transition-colors">
          {t('auth.signIn')}
        </Link>
      </p>
    </Card>
  );
}
