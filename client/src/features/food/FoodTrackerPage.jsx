import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import { T } from '../../components/cb/tokens';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

function timeAgo(dateStr) {
  const mins = differenceInMinutes(new Date(), new Date(dateStr));
  if (mins < 60) return `${mins}m ago`;
  const hrs = differenceInHours(new Date(), new Date(dateStr));
  return `${hrs}h ago`;
}

const FEED_TYPES = [
  { id: 'breast', l: 'Breast', i: 'heart', c: '#1E7A55' },
  { id: 'bottle', l: 'Bottle', i: 'bottle', c: '#0A84FF' },
  { id: 'pump',   l: 'Pump',   i: 'leaf',   c: '#AF52DE' },
  { id: 'solid',  l: 'Solid',  i: 'sun',    c: '#FF9500', soon: true },
];

export default function FoodTrackerPage() {
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [showForm, setShowForm] = useState(false);
  const [feedType, setFeedType] = useState('breast');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['food-logs', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('child_id', childId)
        .order('logged_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });

  const todayLogs = logs.filter(l => l.logged_date === today);
  const lastFeed = todayLogs[0];
  const feedsToday = todayLogs.length;
  const feedsTarget = 8;

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('food_logs').insert({
        child_id: childId,
        user_id: user.id,
        logged_date: today,
        logged_at: new Date().toISOString(),
        food_type: feedType,
        quantity_ml: null,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs', childId] });
      queryClient.invalidateQueries({ queryKey: ['food-logs-today', childId] });
      setShowForm(false);
      setDuration('');
      setNotes('');
    },
  });

  // Build 24h feed arc data for SVG ring
  const feeds24 = todayLogs.slice(0, 8);

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle eyebrow="FEEDING" title="Nourishment" />
      </div>

      {/* Hero — feed ring + stats */}
      <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 20, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* 24h ring */}
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            {Array.from({ length: 24 }).map((_, h) => {
              const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
              const r1 = 58, r2 = h % 6 === 0 ? 52 : 55;
              return <line key={h} x1={65 + Math.cos(a) * r1} y1={65 + Math.sin(a) * r1} x2={65 + Math.cos(a) * r2} y2={65 + Math.sin(a) * r2} stroke={T.ink100} strokeWidth={h % 6 === 0 ? 1.2 : 0.6} />;
            })}
            <circle cx="65" cy="65" r="48" fill="none" stroke={T.forest50} strokeWidth="10" />
            {feeds24.map((f, i) => {
              const hr = new Date(f.logged_at).getHours() + new Date(f.logged_at).getMinutes() / 60;
              const dur = (f.duration_minutes || 15) / 60;
              const a0 = (hr / 24) * Math.PI * 2 - Math.PI / 2;
              const a1 = ((hr + dur) / 24) * Math.PI * 2 - Math.PI / 2;
              const x0 = 65 + Math.cos(a0) * 48, y0 = 65 + Math.sin(a0) * 48;
              const x1 = 65 + Math.cos(a1) * 48, y1 = 65 + Math.sin(a1) * 48;
              return <path key={i} d={`M${x0},${y0} A48,48 0 0,1 ${x1},${y1}`} fill="none" stroke={T.forest600} strokeWidth="10" strokeLinecap="round" />;
            })}
            <text x="65" y="14" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12a</text>
            <text x="121" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6a</text>
            <text x="65" y="123" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12p</text>
            <text x="9" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6p</text>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>{feedsToday}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>of {feedsTarget} today</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {lastFeed ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Last feed</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: T.ink900, marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                {timeAgo(lastFeed.logged_at)}
              </div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 4 }}>
                {lastFeed.food_type}{lastFeed.duration_minutes ? ` · ${lastFeed.duration_minutes} min` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: T.ink300 }}>No feeds logged today</div>
          )}
          <button onClick={() => setShowForm(!showForm)}
            style={{ marginTop: 12, padding: '10px 14px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CBIcon name="plus" size={14} stroke={2.4} /> Log feed
          </button>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {FEED_TYPES.map(t => (
              <button key={t.id} onClick={() => !t.soon && setFeedType(t.id)}
                style={{ padding: '12px 6px', borderRadius: 14, background: feedType === t.id ? T.forest50 : '#fafafa', border: `1.5px solid ${feedType === t.id ? T.forest500 : T.ink100}`, cursor: t.soon ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: t.soon ? 0.5 : 1, position: 'relative' }}>
                <CBIcon name={t.i} size={20} />
                <div style={{ fontSize: 11, fontWeight: 600, color: T.ink900 }}>{t.l}</div>
                {t.soon && <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 4px', borderRadius: 4, background: T.ink100, fontSize: 7, fontWeight: 700, color: T.ink500 }}>SOON</div>}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Duration (minutes)" value={duration} onChange={e => setDuration(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: `0.5px solid ${T.ink100}`, fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
          <input type="text" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: `0.5px solid ${T.ink100}`, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}
            style={{ width: '100%', padding: '12px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {addMutation.isPending ? 'Saving…' : 'Save feed'}
          </button>
        </div>
      )}

      {/* Feed type buttons */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {FEED_TYPES.map(t => (
          <button key={t.id} onClick={() => { if (!t.soon) { setFeedType(t.id); setShowForm(true); } }}
            style={{ padding: '12px 6px', borderRadius: 14, background: '#fff', border: 'none', cursor: t.soon ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', opacity: t.soon ? 0.5 : 1 }}>
            <div style={{ color: t.c }}><CBIcon name={t.i} size={20} /></div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.ink900 }}>{t.l}</div>
            {t.soon && <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 5px', borderRadius: 4, background: T.ink100, fontSize: 8, fontWeight: 700, color: T.ink500 }}>SOON</div>}
          </button>
        ))}
      </div>

      {/* Dr. Bloom insight */}
      {feedsToday > 0 && (
        <div style={{ margin: '18px 16px 0', padding: '14px 16px', background: T.forest50, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <CBLogoMark size={14} color={T.forest700} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.forest700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Pattern today</span>
          </div>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 14.5, color: T.forest900, fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
            {feedsToday >= feedsTarget
              ? `${child?.name} hit the daily feed target. Great job keeping up the rhythm.`
              : `${feedsToday} feeds so far — ${feedsTarget - feedsToday} more to reach today's target. Cluster feeds in the evening are normal.`
            }
          </p>
        </div>
      )}

      {/* Today's feed list */}
      <div style={{ margin: '18px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 8px' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.ink900, letterSpacing: '-0.015em', margin: 0 }}>Today's feeds</h3>
          <span style={{ fontSize: 11, color: T.ink300, fontWeight: 600 }}>{feedsToday} logged</span>
        </div>
        {todayLogs.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', textAlign: 'center', color: T.ink300, fontSize: 14 }}>
            No feeds logged yet today.
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {todayLogs.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < todayLogs.length - 1 ? `0.5px solid ${T.ink100}` : 'none', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.forest50, color: T.forest600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CBIcon name="bottle" size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink900 }}>
                    {format(new Date(f.logged_at), 'h:mm a')}
                    <span style={{ color: T.ink300, fontWeight: 500 }}> · {f.food_type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
                    {f.duration_minutes ? `${f.duration_minutes} min` : ''}{f.notes ? ` · ${f.notes}` : ''}
                  </div>
                </div>
                {i === 0 && <div style={{ padding: '3px 8px', borderRadius: 99, background: T.forest100, color: T.forest700, fontSize: 10, fontWeight: 700 }}>{timeAgo(f.logged_at)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
