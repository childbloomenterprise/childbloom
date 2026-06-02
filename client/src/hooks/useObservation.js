// Server-side observation hook with client-side fallback.
//
// Returns: { observation, source }
//   observation: { kind, eyebrow, headline, body, tone } | null
//   source:      'server' | 'client-fallback' | 'none'
//
// Strategy:
//   1. Try /api/insights/observation (cached server-side, 6h TTL)
//   2. On failure (network, 5xx, auth), fall back to client-side detectFeedPattern
//   3. If both empty → null

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { detectFeedPattern } from '../lib/feedPatterns';

const API_BASE = ''; // same-origin in production; Vite proxies in dev

export function useObservation({ childId, childName, foodLogs7d, sleepLogs7d, enabled = true }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['observation', childId],
    queryFn: async () => {
      const token = localStorage.getItem('sb-access-token');
      if (!token) throw new Error('no_token');
      const res = await fetch(`${API_BASE}/api/insights/observation?childId=${encodeURIComponent(childId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      return res.json();
    },
    enabled: !!childId && enabled,
    staleTime: 30 * 60 * 1000,   // 30 minutes — server caches 6h, but client refresh on tab focus is fine
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Server returned something
  if (data?.observation) {
    return { observation: data.observation, source: 'server', isLoading };
  }

  // Server returned null (no pattern) — try client-side as a backup
  if (data && data.observation === null) {
    const clientPattern = detectFeedPattern({
      foodLogs: foodLogs7d || [],
      sleepLogs: sleepLogs7d || [],
      childName,
    });
    return { observation: clientPattern, source: clientPattern ? 'client-fallback' : 'none', isLoading };
  }

  // Server errored or still loading — use client-side detector immediately so
  // the dashboard renders with something useful while server comes back.
  if (isError || isLoading) {
    const clientPattern = detectFeedPattern({
      foodLogs: foodLogs7d || [],
      sleepLogs: sleepLogs7d || [],
      childName,
    });
    return { observation: clientPattern, source: clientPattern ? 'client-fallback' : 'none', isLoading };
  }

  return { observation: null, source: 'none', isLoading };
}
