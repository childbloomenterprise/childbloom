import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogoMark } from '../../components/ui/LogoMark';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session (handles both email confirm + OAuth)
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error || !session) {
          navigate('/auth', { replace: true });
          return;
        }

        const user = session.user;

        // For Google sign-in, persist profile data from Google metadata
        if (user.app_metadata?.provider === 'google') {
          await supabase.from('profiles').update({
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
        }

        // Fast path: check localStorage before hitting DB
        if (localStorage.getItem('cb_onboarded')) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // DB check: has this user completed onboarding?
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (profile?.onboarding_complete) {
          localStorage.setItem('cb_onboarded', 'true');
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch {
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  // Loading UI while processing
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6"
         style={{ background: '#F7F4EF' }}>
      <LogoMark size={64} className="animate-bloom-breathe" />
      <p className="text-sm font-medium" style={{ color: 'rgba(61,43,35,0.55)' }}>
        Setting up your account…
      </p>
      {/* Animated teal progress bar */}
      <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(143,186,200,0.20)' }}>
        <div className="h-full rounded-full animate-gradient"
             style={{ background: 'linear-gradient(90deg, #8FBAC8, #1B4332, #8FBAC8)', backgroundSize: '200% 100%' }} />
      </div>
    </div>
  );
}
