import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useUiStore from '../stores/uiStore';

/**
 * Subscribes to the `notifications` table for the signed-in parent.
 * On a new `connection_request` INSERT, fires a drBloom toast with a
 * direct link to the inbox. Only fires for live inserts (not history),
 * so the parent isn't flooded with toasts for old notifications on load.
 *
 * Depends on:
 * - notifications table being in the supabase_realtime publication ✓ (migration 015)
 * - RLS policy: recipient_id = auth.uid() ✓
 */
export function useNotifications() {
  const user      = useAuthStore((s) => s.user);
  const addToast  = useUiStore((s) => s.addToast);
  const navigate  = useNavigate();
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!user?.id) return;

    // Record mount time so we only toast notifications created after mount
    // (guards against old unread rows triggering on every app open).
    mountedAt.current = Date.now();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new;
          if (!n) return;

          // Only show toast for rows that arrived after this session started.
          // created_at from the DB is an ISO string; compare to mount timestamp.
          const createdMs = n.created_at ? new Date(n.created_at).getTime() : Date.now();
          if (createdMs < mountedAt.current - 5000) return;

          if (n.type === 'connection_request') {
            addToast({
              type:      'drBloom',
              message:   n.title ?? 'A doctor requested access to your child\'s data.',
              duration:  12000,
              onLink:    () => navigate('/inbox'),
              linkLabel: 'View in Doctor Inbox →',
            });
          } else if (n.type === 'streak_risk') {
            // Agent: streak about to break — one log saves it. The Timeline
            // tab (/child/:id/updates) hosts QuickLogBar + TodayHub.
            const childId = n.data?.child_id;
            addToast({
              type:      'info',
              message:   n.title ?? 'Your logging streak needs one log today',
              duration:  10000,
              onLink:    () => navigate(childId ? `/child/${childId}/updates` : '/dashboard'),
              linkLabel: 'Log something →',
            });
          } else if (n.type === 'recap_ready') {
            // Agent: weekly Bloom Recap is ready (card sits on the Timeline).
            const childId = n.data?.child_id;
            addToast({
              type:      'info',
              message:   n.title ?? 'Your weekly Bloom Recap is ready',
              duration:  10000,
              onLink:    () => navigate(childId ? `/child/${childId}/updates` : '/dashboard'),
              linkLabel: 'See the week →',
            });
          } else {
            // Generic fallback for any future notification types
            addToast({
              type:    'info',
              message: n.title ?? 'New notification',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, addToast, navigate]);
}
