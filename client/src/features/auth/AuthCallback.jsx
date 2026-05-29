import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

async function resolveDestination(session) {
  if (!session?.user?.id) return '/onboarding';
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', session.user.id)
    .single();
  return profile?.onboarding_complete ? '/dashboard' : '/onboarding';
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const dest = await resolveDestination(session);
        navigate(dest, { replace: true });
      }
    });

    // Fallback: if session already exists, redirect immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await resolveDestination(session);
        navigate(dest, { replace: true });
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
