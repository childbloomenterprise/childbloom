import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useChildStore from '../stores/childStore';

export function useAuth() {
  const { setSession, setProfile, clearSession, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        localStorage.setItem('sb-access-token', session.access_token);
        fetchProfile(session.user.id);
      } else {
        localStorage.removeItem('sb-access-token');
        clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  async function signIn(email, password) {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
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
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    clearSession();
    useChildStore.getState().setChildren([]);
    useChildStore.getState().setSelectedChildId(null);
  }

  async function updateProfile(updates) {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  return { signIn, signUp, signOut, updateProfile, fetchProfile };
}
