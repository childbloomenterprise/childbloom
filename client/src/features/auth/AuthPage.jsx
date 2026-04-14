import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { LogoWordmark } from '../../components/ui/LogoMark';

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

export default function AuthPage() {
  const navigate = useNavigate();
  const session   = useAuthStore(s => s.session);
  const isLoading = useAuthStore(s => s.isLoading);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && session) navigate('/dashboard', { replace: true });
  }, [session, isLoading, navigate]);

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
    } catch {
      setError('Could not connect to Google. Please try again.');
      setGoogleLoading(false);
    }
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
        <div className="w-full max-w-sm animate-fade-in-up">

          {/* Brand */}
          <div className="text-center mb-10">
            <LogoWordmark iconSize={64} className="justify-center mb-4" />
            <p style={{ color: 'rgba(61,43,35,0.50)', fontSize: '15px', lineHeight: 1.5 }}>
              Your child's growth companion,<br />from pregnancy to age 7
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border transition-all duration-200 active:scale-[0.98]"
            style={{
              height: '60px',
              background: 'white',
              borderColor: '#E0E0E0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {googleLoading
              ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : <GoogleIcon />
            }
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#3D2B23' }}>
              {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </span>
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl p-3.5 flex items-start gap-2.5 animate-scale-in border"
                 style={{ background: 'rgba(220,53,69,0.08)', borderColor: 'rgba(220,53,69,0.25)', color: '#B91C1C' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <p className="text-center text-xs mt-8" style={{ color: 'rgba(61,43,35,0.35)', lineHeight: 1.6 }}>
            Free to use. No credit card required.<br />
            By continuing you agree to our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
