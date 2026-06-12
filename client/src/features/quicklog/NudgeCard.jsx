// NudgeCard — autonomous capture. When the week's rhythm says a feed
// probably happened and nothing was logged, the app asks instead of waiting:
//   "Was there a feed around 3:05 pm?"  [✓ Yes, log it]  [✗ No]
// ✓ writes a food_logs row BACKDATED to the predicted time (cloning the last
//   feed's type/duration), with the standard 4-second undo.
// ✗ suppresses the nudge for the rest of the day (localStorage only).

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { track } from '../../lib/analytics';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Body, Mono } from '../../components/cb/primitives';
import { useLogReward } from '../../hooks/useLogReward';
import {
  computeFeedNudge, readNudgeDismissedDay, dismissNudgeForToday,
} from '../../lib/predictionNudge';

export default function NudgeCard({ childId, foodLogs7d = [], lastFeed }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { reward } = useLogReward(childId);
  const [hidden, setHidden] = useState(false);
  const [justSaved, setJustSaved] = useState(null);
  const undoTimeout = useRef(null);
  const shownTracked = useRef(false);

  const nudge = computeFeedNudge({
    foodLogs7d,
    dismissedDay: readNudgeDismissedDay(childId),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      const at = nudge.predictedAt;
      const payload = {
        child_id: childId,
        user_id: user.id,
        logged_date: format(at, 'yyyy-MM-dd'),
        logged_at: at.toISOString(),
        food_name: lastFeed?.food_name || lastFeed?.food_type || 'bottle',
        food_type: lastFeed?.food_type || 'bottle',
        duration_minutes: lastFeed?.duration_minutes ?? null,
        notes: null,
      };
      const { data, error } = await supabase.from('food_logs').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newLog) => {
      qc.invalidateQueries({ queryKey: ['food-logs-today', childId] });
      qc.invalidateQueries({ queryKey: ['food-logs-7d', childId] });
      qc.invalidateQueries({ queryKey: ['food-logs-recent', childId] });
      track('nudge_confirmed', { gapMin: nudge?.gapMin });
      reward({ source: 'nudge', types: ['feed'] });
      setJustSaved({ id: newLog.id });
      clearTimeout(undoTimeout.current);
      undoTimeout.current = setTimeout(() => { setJustSaved(null); setHidden(true); }, 4000);
    },
  });

  const undo = async () => {
    if (!justSaved?.id) return;
    clearTimeout(undoTimeout.current);
    const id = justSaved.id;
    setJustSaved(null);
    await supabase.from('food_logs').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['food-logs-today', childId] });
    qc.invalidateQueries({ queryKey: ['food-logs-7d', childId] });
  };

  const dismiss = () => {
    dismissNudgeForToday(childId);
    track('nudge_dismissed', { gapMin: nudge?.gapMin });
    setHidden(true);
  };

  if (!nudge || hidden || !user?.id) return null;

  if (!shownTracked.current) {
    shownTracked.current = true;
    track('nudge_shown', { gapMin: nudge.gapMin });
  }

  const timeLabel = format(nudge.predictedAt, 'h:mm a');

  if (justSaved) {
    return (
      <div style={{
        background: T.brandWash, border: `0.5px solid ${T.brandSoft}55`,
        borderRadius: RADIUS.lg, padding: '12px 14px', fontFamily: FONTS.sans, marginTop: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <Body size={13} color={T.ink900} weight={600}>
          {t('nudge.saved', 'Feed logged for {{time}}', { time: timeLabel })} ✓
        </Body>
        <button onClick={undo} style={{
          border: 'none', background: 'transparent', color: T.brand,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans, padding: '4px 8px',
        }}>
          {t('nudge.undo', 'Undo')}
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('nudge.aria', 'Suggested feed log')}
      style={{
        background: T.surface, border: `0.5px solid ${T.line}`,
        borderRadius: RADIUS.lg, padding: '14px', fontFamily: FONTS.sans, marginTop: 14,
      }}
    >
      <Mono size={9} color={T.ink300} style={{ letterSpacing: '0.12em' }}>
        {t('nudge.eyebrow', 'FROM THIS WEEK’S RHYTHM').toUpperCase()}
      </Mono>
      <div style={{ marginTop: 6 }}>
        <Body size={14} color={T.ink900} weight={600}>
          {t('nudge.question', 'Was there a feed around {{time}}?', { time: timeLabel })}
        </Body>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => !confirm.isPending && confirm.mutate()}
          disabled={confirm.isPending}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: RADIUS.md, border: 'none',
            background: T.brand, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: confirm.isPending ? 'default' : 'pointer', fontFamily: FONTS.sans,
          }}
        >
          {confirm.isPending ? t('nudge.saving', 'Logging…') : t('nudge.yes', 'Yes, log it')}
        </button>
        <button
          onClick={dismiss}
          style={{
            padding: '10px 16px', borderRadius: RADIUS.md,
            border: `0.5px solid ${T.line}`, background: 'transparent',
            color: T.ink500, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans,
          }}
        >
          {t('nudge.no', 'No')}
        </button>
      </div>
      {confirm.isError && (
        <Body size={11} color="#dc2626" style={{ marginTop: 8 }}>
          {t('nudge.error', 'Could not save. Check your connection.')}
        </Body>
      )}
    </div>
  );
}
