import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';

export function usePremium() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['premium', user?.id],
    enabled: !!user?.id && !user?.is_anonymous,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('premium_subscriptions')
        .select('status, premium_until')
        .eq('user_id', user.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  const premiumUntil = data?.premium_until ? new Date(data.premium_until) : null;
  const isPremium = !!premiumUntil && data?.status === 'active' && premiumUntil > new Date();

  return { isPremium, premiumUntil, isLoading };
}
