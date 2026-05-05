import { useState, useRef, useEffect, useCallback } from 'react';
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

const ANIM = `
  @keyframes cb-ripple { from{transform:scale(1);opacity:.7} to{transform:scale(22);opacity:0} }
  @keyframes cb-slide-in { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes cb-spin { to{transform:rotate(360deg)} }
  @keyframes cb-pop { 0%{transform:scale(.88)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes cb-check { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
`;

const DURATIONS = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 45, 60];
const ITEM_H = 52;

const FEED_TYPES = [
  { id: 'breast', label: 'Breast', icon: 'heart',  color: '#1E7A55', bg: '#E8F5EF' },
  { id: 'bottle', label: 'Bottle', icon: 'bottle', color: '#0A84FF', bg: '#E5F1FF' },
  { id: 'pump',   label: 'Pump',   icon: 'leaf',   color: '#AF52DE', bg: '#F3E8FF' },
  { id: 'solid',  label: 'Solid',  icon: 'sun',    color: '#FF9500', bg: '#FFF0DC', soon: true },
];

function timeAgo(dateStr) {
  const mins = differenceInMinutes(new Date(), new Date(dateStr));
  if (mins < 60) return `${mins}m ago`;
  return `${differenceInHours(new Date(), new Date(dateStr))}h ago`;
}

// iOS drum-roll scroll picker
function DrumRoll({ values, selected, onChange }) {
  const ref = useRef(null);
  const timerRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const idx = values.indexOf(selected);
      if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H;
    }
  }, []);

  const handleScroll = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, values.length - 1));
      onChange(values[clamped]);
    }, 80);
  }, [values, onChange]);

  return (
    <div style={{ position: 'relative', height: ITEM_H * 5, borderRadius: 16, background: 'rgba(0,0,0,0.02)', overflow: 'hidden' }}>
      {/* Top fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2, background: 'linear-gradient(to bottom, #fff 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2, background: 'linear-gradient(to top, #fff 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Selection highlight band */}
      <div style={{ position: 'absolute', top: ITEM_H * 2, left: 12, right: 12, height: ITEM_H, borderRadius: 12, background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.15)', zIndex: 1, pointerEvents: 'none' }} />
      {/* Scroll container */}
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          paddingTop: ITEM_H * 2,
          paddingBottom: ITEM_H * 2,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
        }}
      >
        {values.map(v => {
          const isSel = v === selected;
          return (
            <div
              key={v}
              style={{
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                fontSize: isSel ? 24 : 17,
                fontWeight: isSel ? 700 : 400,
                color: isSel ? T.forest700 : T.ink300,
                letterSpacing: isSel ? '-0.02em' : 0,
                transition: 'all 0.15s ease',
                userSelect: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                onChange(v);
                const idx = values.indexOf(v);
                ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
              }}
            >
              {v} <span style={{ fontSize: isSel ? 14 : 12, marginLeft: 4, opacity: 0.6 }}>min</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Feed type card with circle ripple + spring press
function FeedTypeCard({ type, selected, onSelect }) {
  const [ripples, setRipples] = useState([]);
  const [pressed, setPressed] = useState(false);
  const isSel = selected === type.id;

  const handleTap = (e) => {
    if (type.soon) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(ri => ri.id !== id)), 700);
    onSelect(type.id);
  };

  return (
    <button
      onPointerDown={() => !type.soon && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={handleTap}
      disabled={type.soon}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '16px 8px',
        borderRadius: 20,
        border: `2px solid ${isSel ? type.color : 'transparent'}`,
        background: isSel ? type.bg : 'rgba(0,0,0,0.03)',
        cursor: type.soon ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        opacity: type.soon ? 0.4 : 1,
        transform: pressed ? 'scale(0.91)' : isSel ? 'scale(1.04)' : 'scale(1)',
        transition: pressed
          ? 'transform 0.08s ease'
          : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background 0.2s',
        boxShadow: isSel ? `0 6px 20px ${type.color}28` : 'none',
      }}
    >
      {/* Ripple circles */}
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute',
          left: r.x - 10, top: r.y - 10,
          width: 20, height: 20,
          borderRadius: '50%',
          background: type.color + '44',
          animation: 'cb-ripple 0.7s ease-out forwards',
          pointerEvents: 'none',
        }} />
      ))}
      {/* Icon bubble */}
      <div style={{
        width: 46, height: 46, borderRadius: 15,
        background: isSel ? type.color : 'rgba(0,0,0,0.06)',
        color: isSel ? '#fff' : '#888',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.22s',
        animation: isSel ? 'cb-pop 0.35s ease' : 'none',
      }}>
        <CBIcon name={type.icon} size={22} stroke={1.8} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? type.color : T.ink500 }}>{type.label}</div>
      {type.soon && (
        <div style={{ position: 'absolute', top: 5, right: 5, padding: '2px 5px', borderRadius: 5, background: T.ink100, fontSize: 7, fontWeight: 700, color: T.ink400 }}>SOON</div>
      )}
    </button>
  );
}

// Animated bottom sheet
function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.42)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.28s ease',
        zIndex: 200,
        backdropFilter: open ? 'blur(3px)' : 'none',
        WebkitBackdropFilter: open ? 'blur(3px)' : 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 24px), 36px)',
        transform: open ? 'translateY(0)' : 'translateY(105%)',
        transition: 'transform 0.44s cubic-bezier(0.32,0.72,0,1)',
        zIndex: 201,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
      }}>
        {/* Drag pill */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        {children}
      </div>
    </>
  );
}

export default function FoodTrackerPage() {
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedType, setFeedType] = useState('breast');
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openSheet = (type) => { setFeedType(type || 'breast'); setSheetOpen(true); setSaveError(''); };
  const closeSheet = () => { if (!addMutation.isPending) setSheetOpen(false); };

  const { data: logs = [] } = useQuery({
    queryKey: ['food-logs', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs').select('*')
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
  const feeds24 = todayLogs.slice(0, 8);

  const addMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { error } = await supabase.from('food_logs').insert({
        child_id: childId,
        user_id: user.id,
        logged_date: today,
        logged_at: now,
        food_name: feedType,
        food_type: feedType,
        duration_minutes: duration,
        notes: notes || null,
      });
      if (error) throw error;
      // Return synthetic object — avoids RLS read-back issues
      return {
        id: crypto.randomUUID(),
        child_id: childId,
        user_id: user.id,
        logged_date: today,
        logged_at: now,
        food_type: feedType,
        duration_minutes: duration,
        notes: notes || null,
      };
    },
    onSuccess: (newLog) => {
      setSaveError('');
      queryClient.setQueryData(['food-logs', childId], (old = []) => [newLog, ...(old || [])]);
      queryClient.invalidateQueries({ queryKey: ['food-logs', childId] });
      setSaved(true);
      setTimeout(() => {
        setSheetOpen(false);
        setTimeout(() => { setSaved(false); setNotes(''); setDuration(15); setFeedType('breast'); }, 400);
      }, 900);
    },
    onError: (err) => {
      setSaveError(err?.message || 'Could not save. Check your connection and try again.');
    },
  });

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif" }}>
      <style>{ANIM}</style>

      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle eyebrow="FEEDING" title="Nourishment" />
      </div>

      {/* Hero — 24h ring + stats */}
      <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 20, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
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
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 600, color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>{feedsToday}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>of {feedsTarget} today</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {lastFeed ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Last feed</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 600, color: T.ink900, marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                {timeAgo(lastFeed.logged_at)}
              </div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 4 }}>
                {lastFeed.food_type}{lastFeed.duration_minutes ? ` · ${lastFeed.duration_minutes} min` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: T.ink300 }}>No feeds logged today</div>
          )}
          <button onClick={() => openSheet()}
            style={{ marginTop: 12, padding: '10px 14px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CBIcon name="plus" size={14} stroke={2.4} /> Log feed
          </button>
        </div>
      </div>

      {/* Quick tap — feed type shortcuts */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {FEED_TYPES.map(t => (
          <button key={t.id}
            onClick={() => !t.soon && openSheet(t.id)}
            style={{ padding: '12px 6px', borderRadius: 14, background: '#fff', border: 'none', cursor: t.soon ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', opacity: t.soon ? 0.45 : 1 }}>
            <div style={{ color: t.color }}><CBIcon name={t.icon} size={20} /></div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.ink900 }}>{t.label}</div>
            {t.soon && <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 5px', borderRadius: 4, background: T.ink100, fontSize: 8, fontWeight: 700, color: T.ink500 }}>SOON</div>}
          </button>
        ))}
      </div>

      {/* Dr. Bloom pattern insight */}
      {feedsToday > 0 && (
        <div style={{ margin: '18px 16px 0', padding: '14px 16px', background: T.forest50, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <CBLogoMark size={14} color={T.forest700} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.forest700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Pattern today</span>
          </div>
          <p style={{ fontFamily: "'Fraunces',serif", fontSize: 14.5, color: T.forest900, fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
            {feedsToday >= feedsTarget
              ? `${child?.name} hit the daily feed target. Great job keeping up the rhythm.`
              : `${feedsToday} feeds so far — ${feedsTarget - feedsToday} more to reach today's target. Cluster feeds in the evening are normal.`}
          </p>
        </div>
      )}

      {/* Today's feed list */}
      <div style={{ margin: '18px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 8px' }}>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: T.ink900, letterSpacing: '-0.015em', margin: 0 }}>Today's feeds</h3>
          <span style={{ fontSize: 11, color: T.ink300, fontWeight: 600 }}>{feedsToday} logged</span>
        </div>
        {todayLogs.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', textAlign: 'center', color: T.ink300, fontSize: 14 }}>
            No feeds logged yet today.
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {todayLogs.map((f, i) => {
              const ft = FEED_TYPES.find(t => t.id === f.food_type);
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < todayLogs.length - 1 ? `0.5px solid ${T.ink100}` : 'none', gap: 10, animation: i === 0 ? 'cb-slide-in 0.32s ease-out' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: ft ? ft.bg : T.forest50, color: ft ? ft.color : T.forest600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CBIcon name={ft?.icon || 'bottle'} size={15} />
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
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />

      {/* ── Interactive log sheet ── */}
      <BottomSheet open={sheetOpen} onClose={closeSheet}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 600, color: T.ink900, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
          Log a feed
        </h2>

        {/* Feed type */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {FEED_TYPES.map(t => (
              <FeedTypeCard key={t.id} type={t} selected={feedType} onSelect={setFeedType} />
            ))}
          </div>
        </div>

        {/* Duration drum roll */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Duration — scroll to pick
          </div>
          <DrumRoll values={DURATIONS} selected={duration} onChange={setDuration} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Notes (optional)</div>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. good latch, fussy…"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 13, border: `1.5px solid ${T.ink100}`, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: T.ink900, background: 'rgba(0,0,0,0.02)', transition: 'border-color 0.18s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(29,158,117,0.5)'}
            onBlur={e => e.target.style.borderColor = T.ink100}
          />
        </div>

        {/* Error */}
        {saveError && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 13, color: '#dc2626' }}>
            {saveError}
          </div>
        )}

        {/* Save */}
        <button
          onClick={() => { if (!saved && !addMutation.isPending) addMutation.mutate(); }}
          disabled={addMutation.isPending || saved}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 18,
            border: 'none',
            background: saved ? '#22c55e' : T.forest700,
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: saved || addMutation.isPending ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.3s, transform 0.12s',
            transform: addMutation.isPending ? 'scale(0.97)' : 'scale(1)',
            boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.35)' : '0 4px 20px rgba(29,158,117,0.30)',
          }}
        >
          {saved ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" strokeDasharray="24" style={{ animation: 'cb-check 0.3s ease forwards' }} />
              </svg>
              Saved!
            </>
          ) : addMutation.isPending ? (
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'cb-spin 0.7s linear infinite' }} />
          ) : (
            'Save feed'
          )}
        </button>
      </BottomSheet>
    </div>
  );
}
