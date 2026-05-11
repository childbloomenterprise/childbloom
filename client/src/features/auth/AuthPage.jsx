import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useAuthStore from '../../stores/authStore';
import { LogoMark } from '../../components/ui/LogoMark';

const BG = '#0F2318';
const GREEN = '#1D9E75';

function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '12px',
                    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginBottom: '8px' }}>
      {children}
    </label>
  );
}

function AuthInput({ type = 'text', value, onChange, placeholder, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
        style={{
          width: '100%',
          padding: right ? '15px 48px 15px 16px' : '15px 16px',
          borderRadius: '14px',
          border: `1.5px solid ${focused ? 'rgba(29,158,117,0.60)' : 'rgba(255,255,255,0.10)'}`,
          background: 'rgba(255,255,255,0.06)',
          color: 'white',
          fontSize: '17px',
          fontWeight: 500,
          outline: 'none',
          colorScheme: 'dark',
          transition: 'border-color 0.18s',
          boxSizing: 'border-box',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {right && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          {right}
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        const profile = useAuthStore.getState().profile;
        navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
      } else {
        await signUp(email, password);
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const canSubmit = email.trim() && password.length >= 6 && (mode === 'signin' || name.trim().length >= 2);

  return (
    <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                    height: '60px', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={22} />
          <span style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>ChildBloom</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: '6px 12px',
                   color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer' }}>
          Continue as guest
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 20px 120px', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '30px', color: 'white',
                     fontWeight: 600, lineHeight: 1.15, marginBottom: 8, fontStyle: 'italic' }}>
          {mode === 'signin' ? 'Welcome back.' : 'Start your baby\'s story.'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px', marginBottom: 32 }}>
          {mode === 'signin' ? 'Sign in to continue with Bloom.' : 'Free forever for the basics.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <FieldLabel>Your name</FieldLabel>
              <AuthInput value={name} onChange={setName} placeholder="Your first name" />
            </div>
          )}

          <div>
            <FieldLabel>Email address</FieldLabel>
            <AuthInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>

          <div>
            <FieldLabel>Password</FieldLabel>
            <AuthInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              right={
                <button onClick={() => setShowPassword(v => !v)} onKeyDown={handleKeyDown}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <EyeIcon show={showPassword} />
                </button>
              }
            />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}>
            <p style={{ color: '#FCA5A5', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button onClick={handleGoogle}
          style={{ width: '100%', height: 50, borderRadius: 14, background: 'white', border: 'none',
                   cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   gap: 10, fontSize: 15, fontWeight: 600, color: '#1a1a1a', transition: 'opacity 0.2s' }}
          onMouseDown={e => e.currentTarget.style.opacity = '0.85'}
          onMouseUp={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={{ background: 'none', border: 'none', color: GREEN, fontSize: 14,
                     fontWeight: 600, cursor: 'pointer', padding: 0 }}>
            {mode === 'signin' ? 'Sign up →' : 'Sign in →'}
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '0 20px',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 32px)',
                    background: `linear-gradient(to top, ${BG} 70%, transparent)` }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          style={{
            width: '100%', height: 54, borderRadius: 16, border: 'none',
            background: canSubmit && !loading ? GREEN : 'rgba(255,255,255,0.07)',
            color: canSubmit && !loading ? 'white' : 'rgba(255,255,255,0.22)',
            fontSize: 16, fontWeight: 600, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit && !loading ? '0 4px 20px rgba(29,158,117,0.30)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}>
          {loading ? (
            <>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
              {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
            </>
          ) : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
