import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const profile = useAuthStore.getState().profile;
        navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
      }
    });

    // Fallback: if session already exists, redirect immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const profile = useAuthStore.getState().profile;
        navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100dvh', background: '#0F2318', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(29,158,117,0.25)',
                    borderTopColor: '#1D9E75', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 500 }}>Signing you in…</p>
    </div>
  );
}
