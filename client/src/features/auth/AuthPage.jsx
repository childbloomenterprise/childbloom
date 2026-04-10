import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import useAuthStore from '../../stores/authStore';
import { LogoWordmark } from '../../components/ui/LogoMark';

// ── Google brand G logo ────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// ── Eye toggle icon ────────────────────────────────
function EyeIcon({ show }) {
  return show ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Map raw Supabase errors → friendly strings ─────
function mapError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid') || m.includes('credentials') || m.includes('wrong password'))
    return 'Incorrect email or password';
  if (m.includes('already registered') || m.includes('user already exists') || m.includes('email already'))
    return 'Account already exists. Try signing in.';
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'No connection. Check your internet.';
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first. Check your inbox.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a moment.';
  return 'Something went wrong. Please try again.';
}

// ── Password strength (weak / medium / strong) ─────
function getStrength(pwd) {
  if (!pwd) return null;
  if (pwd.length < 8) return 'weak';
  if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return 'strong';
  return 'medium';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const session   = useAuthStore(s => s.session);
  const isLoading = useAuthStore(s => s.isLoading);

  // Tab state
  const [tab, setTab] = useState('signin');

  // Google
  const [googleLoading, setGoogleLoading] = useState(false);

  // Shared error
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Sign-in fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Sign-up fields
  const [name, setName]                   = useState('');
  const [suEmail, setSuEmail]             = useState('');
  const [suPassword, setSuPassword]       = useState('');
  const [suConfirm, setSuConfirm]         = useState('');
  const [showSuPass, setShowSuPass]       = useState(false);
  const [showSuConfirm, setShowSuConfirm] = useState(false);
  const [signupDone, setSignupDone]       = useState(false);

  // Forgot password
  const [showForgot, setShowForgot]   = useState(false);
  const [resetEmail, setResetEmail]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent]     = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && session) navigate('/dashboard', { replace: true });
  }, [session, isLoading, navigate]);

  // ── Google OAuth ─────────────────────────────────
  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (err) throw err;
    } catch (err) {
      setError('Could not connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  // ── Email sign-in ────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      setFormLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(mapError(err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Email sign-up ────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (suPassword.length < 8)            { setError('Password must be at least 8 characters.'); return; }
    if (suPassword !== suConfirm)         { setError("Passwords don't match."); return; }
    try {
      setFormLoading(true);
      const { error: err } = await supabase.auth.signUp({
        email: suEmail,
        password: suPassword,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) throw err;
      setSignupDone(true);
    } catch (err) {
      setError(mapError(err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Forgot password ──────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  const strength = getStrength(suPassword);
  const strengthColor = { weak: '#EF4444', medium: '#F59E0B', strong: '#10B981' }[strength] || 'transparent';

  // ── Shared input style ────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(232,196,184,0.8)',
    background: 'rgba(247,244,239,0.85)',
    color: '#3D2B23',
    fontSize: '15px',
    outline: 'none',
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: '#F7F4EF' }}>
      {/* Ambient shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-60"
             style={{ background: 'radial-gradient(circle, rgba(232,196,184,0.6) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-50"
             style={{ background: 'radial-gradient(circle, rgba(143,186,200,0.20) 0%, transparent 70%)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-sm">

          {/* ── Brand ─────────────────────────────── */}
          <div className="text-center mb-8 animate-fade-in-up">
            <LogoWordmark iconSize={56} className="justify-center mb-3" />
            <p style={{ color: 'rgba(61,43,35,0.50)', fontSize: '14px' }}>
              Growing together, week by week
            </p>
          </div>

          {/* ── Sign-up success screen ─────────────── */}
          {signupDone ? (
            <div className="rounded-2xl border p-8 text-center animate-scale-in"
                 style={{ background: 'rgba(232,196,184,0.50)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.70)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ background: 'rgba(143,186,200,0.15)', border: '1px solid rgba(143,186,200,0.35)' }}>
                <svg className="w-7 h-7" style={{ color: '#8FBAC8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl mb-2" style={{ color: '#2A1C15' }}>Check your email</h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(61,43,35,0.55)' }}>
                We sent a confirmation link to <strong>{suEmail}</strong>. Click it to activate your account.
              </p>
              <button onClick={() => { setSignupDone(false); setTab('signin'); }}
                      className="text-sm font-semibold" style={{ color: '#8FBAC8' }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>

              {/* ── Google button ──────────────────── */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border transition-all duration-200 active:scale-[0.98] mb-5"
                style={{
                  height: '56px',
                  background: 'white',
                  borderColor: '#E0E0E0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {googleLoading
                  ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  : <GoogleIcon />
                }
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#3D2B23' }}>
                  {googleLoading ? 'Connecting…' : 'Continue with Google'}
                </span>
              </button>

              {/* ── Divider ────────────────────────── */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'rgba(61,43,35,0.12)' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs uppercase tracking-wider"
                        style={{ background: '#F7F4EF', color: 'rgba(61,43,35,0.40)' }}>
                    or continue with email
                  </span>
                </div>
              </div>

              {/* ── Email card ─────────────────────── */}
              <div className="rounded-2xl border p-6"
                   style={{ background: 'rgba(232,196,184,0.50)', backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.70)',
                            boxShadow: '0 4px 24px rgba(61,43,35,0.07)' }}>

                {/* Tab toggle */}
                <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(61,43,35,0.06)' }}>
                  {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([key, label]) => (
                    <button key={key} onClick={() => { setTab(key); setError(''); }}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                            style={tab === key
                              ? { background: 'white', color: '#2A1C15', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                              : { color: 'rgba(61,43,35,0.45)' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Error banner */}
                {error && (
                  <div className="rounded-xl p-3.5 mb-5 flex items-start gap-2.5 animate-scale-in border"
                       style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'rgba(220,53,69,0.25)', color: '#B91C1C' }}>
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* ── Sign-In form ──────────────────── */}
                {tab === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2A1C15' }}>Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                             placeholder="you@example.com" autoComplete="email"
                             className="input-field" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold" style={{ color: '#2A1C15' }}>Password</label>
                        <button type="button" onClick={() => setShowForgot(true)}
                                className="text-xs font-semibold" style={{ color: '#8FBAC8' }}>
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={password}
                               onChange={e => setPassword(e.target.value)}
                               placeholder="Enter your password" autoComplete="current-password"
                               className="input-field" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: 'rgba(61,43,35,0.40)' }}>
                          <EyeIcon show={showPass} />
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={formLoading}
                            className="w-full rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                            style={{ height: '52px', background: formLoading ? 'rgba(27,67,50,0.6)' : '#1B4332',
                                     boxShadow: '0 2px 12px rgba(27,67,50,0.25)', marginTop: '4px' }}>
                      {formLoading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                      Sign In
                    </button>
                  </form>
                )}

                {/* ── Sign-Up form ──────────────────── */}
                {tab === 'signup' && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2A1C15' }}>Your name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                             placeholder="Your full name" autoComplete="name" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2A1C15' }}>Email</label>
                      <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)}
                             placeholder="you@example.com" autoComplete="email" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2A1C15' }}>Password</label>
                      <div className="relative">
                        <input type={showSuPass ? 'text' : 'password'} value={suPassword}
                               onChange={e => setSuPassword(e.target.value)}
                               placeholder="At least 8 characters" autoComplete="new-password"
                               className="input-field" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowSuPass(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: 'rgba(61,43,35,0.40)' }}>
                          <EyeIcon show={showSuPass} />
                        </button>
                      </div>
                      {/* Strength bar */}
                      {suPassword.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                                 style={{
                                   background: (strength === 'weak' && i === 0) ||
                                               (strength === 'medium' && i <= 1) ||
                                               (strength === 'strong')
                                     ? strengthColor : 'rgba(61,43,35,0.12)'
                                 }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2A1C15' }}>Confirm password</label>
                      <div className="relative">
                        <input type={showSuConfirm ? 'text' : 'password'} value={suConfirm}
                               onChange={e => setSuConfirm(e.target.value)}
                               placeholder="Repeat your password" autoComplete="new-password"
                               className="input-field" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowSuConfirm(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: 'rgba(61,43,35,0.40)' }}>
                          <EyeIcon show={showSuConfirm} />
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={formLoading}
                            className="w-full rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                            style={{ height: '52px', background: formLoading ? 'rgba(27,67,50,0.6)' : '#1B4332',
                                     boxShadow: '0 2px 12px rgba(27,67,50,0.25)', marginTop: '4px' }}>
                      {formLoading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                      Create Account
                    </button>
                  </form>
                )}
              </div>

              <p className="text-center text-xs mt-5" style={{ color: 'rgba(61,43,35,0.38)' }}>
                ChildBloom is free. No credit card required.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Forgot-password bottom sheet ─────────────── */}
      {showForgot && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.28)' }}
               onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="rounded-t-3xl p-6 pt-4" style={{ background: '#F7F4EF', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(61,43,35,0.15)' }} />
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                       style={{ background: 'rgba(143,186,200,0.15)' }}>
                    <svg className="w-6 h-6" style={{ color: '#8FBAC8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl mb-2" style={{ color: '#2A1C15' }}>Check your email</h3>
                  <p className="text-sm mb-5" style={{ color: 'rgba(61,43,35,0.55)' }}>
                    Reset link sent to <strong>{resetEmail}</strong>
                  </p>
                  <button onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); }}
                          className="text-sm font-semibold" style={{ color: '#8FBAC8' }}>Done</button>
                </div>
              ) : (
                <>
                  <h3 className="font-serif text-xl mb-1" style={{ color: '#2A1C15' }}>Reset password</h3>
                  <p className="text-sm mb-5" style={{ color: 'rgba(61,43,35,0.55)' }}>
                    Enter your email and we'll send a reset link.
                  </p>
                  <form onSubmit={handleReset} className="space-y-4">
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                           placeholder="your@email.com" autoFocus className="input-field" />
                    <button type="submit" disabled={resetLoading || !resetEmail}
                            className="w-full rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                            style={{ height: '52px', background: '#1B4332', opacity: !resetEmail ? 0.5 : 1 }}>
                      {resetLoading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                      Send Reset Link
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
