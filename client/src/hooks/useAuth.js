import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useChildStore from '../stores/childStore';
import { track, identifyUser, resetAnalytics } from '../lib/analytics';

// Tie analytics to a signed-in (non-anonymous) user, no-op otherwise.
function identifyFromSession(session) {
  const user = session?.user;
  if (user && !user.is_anonymous) identifyUser(user.id, user.email);
}

export function useAuth() {
  const { setSession, setProfile, clearSession, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;
      setSession(session);
      identifyFromSession(session);
      if (session?.access_token) {
        localStorage.setItem('sb-access-token', session.access_token);
      }
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        localStorage.setItem('sb-access-token', session.access_token);
        identifyFromSession(session);
        fetchProfile(session.user.id);
      } else {
        localStorage.removeItem('sb-access-token');
        clearSession();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }

  async function signIn(email, password) {
    setLoading(true);
    let result;
    try {
      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (fetchErr) {
      // Safari/iOS "Load failed" — retry once after brief delay
      const msg = fetchErr?.message || '';
      if (msg === 'Load failed' || msg.includes('fetch') || msg.includes('network')) {
        await new Promise((r) => setTimeout(r, 500));
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        setLoading(false);
        throw fetchErr;
      }
    }
    setLoading(false);
    const { data, error } = result;
    if (error) throw error;
    if (data?.user) await fetchProfile(data.user.id);
    return data;
  }

  async function signUp(email, password) {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) throw error;
    track('sign_up', { method: 'email' });
    if (data?.user) identifyUser(data.user.id, email);
    return data;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    clearSession();
    useChildStore.getState().setChildren([]);
    useChildStore.getState().setSelectedChildId(null);
    resetAnalytics();   // clear PostHog identity so the next user starts fresh
  }

  async function updateProfile(updates) {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  return { signIn, signUp, signInWithGoogle, signOut, updateProfile, fetchProfile };
}
