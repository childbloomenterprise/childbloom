import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, AIBubble,
} from '../../components/cb/primitives';
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
    <div style={{ position: 'relative', height: ITEM_H * 5, borderRadius: RADIUS.md, background: 'rgba(0,0,0,0.02)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2, background: `linear-gradient(to bottom, ${T.surface} 30%, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2, background: `linear-gradient(to top, ${T.surface} 30%, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: ITEM_H * 2, left: 12, right: 12, height: ITEM_H, borderRadius: RADIUS.sm, background: T.brandWash, border: `1px solid ${T.brandSoft}`, zIndex: 1, pointerEvents: 'none' }} />
      <div ref={ref} onScroll={handleScroll} style={{
        height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
        paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none',
      }}>
        {values.map(v => {
          const isSel = v === selected;
          return (
            <div key={v} style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', fontFamily: FONTS.sans,
              fontSize: isSel ? 24 : 17, fontWeight: isSel ? 700 : 400,
              color: isSel ? T.brand : T.ink300, letterSpacing: isSel ? '-0.02em' : 0,
              transition: 'all 0.15s ease', userSelect: 'none', cursor: 'pointer',
            }}
              onClick={() => { onChange(v); const idx = values.indexOf(v); ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' }); }}
            >
              {v} <span style={{ fontSize: isSel ? 14 : 12, marginLeft: 4, opacity: 0.6 }}>min</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        position: 'relative', overflow: 'hidden', padding: '16px 8px',
        borderRadius: RADIUS.lg, border: `2px solid ${isSel ? type.color : 'transparent'}`,
        background: isSel ? type.bg : 'rgba(0,0,0,0.03)',
        cursor: type.soon ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
        opacity: type.soon ? 0.4 : 1,
        transform: pressed ? 'scale(0.91)' : isSel ? 'scale(1.04)' : 'scale(1)',
        transition: pressed
          ? 'transform 0.08s ease'
          : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background 0.2s',
        boxShadow: isSel ? `0 6px 20px ${type.color}28` : 'none',
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', left: r.x - 10, top: r.y - 10, width: 20, height: 20, borderRadius: '50%', background: type.color + '44', animation: 'cb-ripple 0.7s ease-out forwards', pointerEvents: 'none' }} />
      ))}
      <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, background: isSel ? type.color : 'rgba(0,0,0,0.06)', color: isSel ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.22s', animation: isSel ? 'cb-pop 0.35s ease' : 'none' }}>
        <CBIcon name={type.icon} size={22} stroke={1.8} />
      </div>
      <Body size={12} color={isSel ? type.color : T.ink500} weight={600}>{type.label}</Body>
      {type.soon && <div style={{ position: 'absolute', top: 5, right: 5, padding: '2px 5px', borderRadius: 5, background: T.line, fontSize: 7, fontWeight: 700, color: T.ink400 }}>SOON</div>}
    </button>
  );
}

function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.28s ease', zIndex: 200, backdropFilter: open ? 'blur(3px)' : 'none', WebkitBackdropFilter: open ? 'blur(3px)' : 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderRadius: '28px 28px 0 0', padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 24px), 36px)', transform: open ? 'translateY(0)' : 'translateY(105%)', transition: 'transform 0.44s cubic-bezier(0.32,0.72,0,1)', zIndex: 201, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}>
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
  const lastFeed  = todayLogs[0];
  const feedsToday  = todayLogs.length;
  const feedsTarget = 8;
  const feeds24 = todayLogs.slice(0, 8);

  const addMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { error } = await supabase.from('food_logs').insert({
        child_id: childId, user_id: user.id,
        logged_date: today, logged_at: now,
        food_name: feedType, food_type: feedType,
        duration_minutes: duration, notes: notes || null,
      });
      if (error) throw error;
      return { id: crypto.randomUUID(), child_id: childId, user_id: user.id, logged_date: today, logged_at: now, food_type: feedType, duration_minutes: duration, notes: notes || null };
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
    onError: (err) => setSaveError(err?.message || 'Could not save. Check your connection and try again.'),
  });

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <style>{ANIM}</style>

      {/* Header */}
      <div style={{ paddingTop: 52 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <Eyebrow color={T.ink300}>FEEDING</Eyebrow>
          <Spacer h={4} />
          <Display size={34} italic weight={600} lh={1.05}>Nourishment</Display>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Hero — 24h ring + stats */}
        <Card p={20}>
          <HRow gap={14} align="center">
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                {Array.from({ length: 24 }).map((_, h) => {
                  const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
                  const r1 = 58, r2 = h % 6 === 0 ? 52 : 55;
                  return <line key={h} x1={65 + Math.cos(a) * r1} y1={65 + Math.sin(a) * r1} x2={65 + Math.cos(a) * r2} y2={65 + Math.sin(a) * r2} stroke={T.line} strokeWidth={h % 6 === 0 ? 1.2 : 0.6} />;
                })}
                <circle cx="65" cy="65" r="48" fill="none" stroke={T.brandWash} strokeWidth="10" />
                {feeds24.map((f, i) => {
                  const hr = new Date(f.logged_at).getHours() + new Date(f.logged_at).getMinutes() / 60;
                  const dur = (f.duration_minutes || 15) / 60;
                  const a0 = (hr / 24) * Math.PI * 2 - Math.PI / 2;
                  const a1 = ((hr + dur) / 24) * Math.PI * 2 - Math.PI / 2;
                  const x0 = 65 + Math.cos(a0) * 48, y0 = 65 + Math.sin(a0) * 48;
                  const x1 = 65 + Math.cos(a1) * 48, y1 = 65 + Math.sin(a1) * 48;
                  return <path key={i} d={`M${x0},${y0} A48,48 0 0,1 ${x1},${y1}`} fill="none" stroke={T.brand} strokeWidth="10" strokeLinecap="round" />;
                })}
                <text x="65" y="14" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12a</text>
                <text x="121" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6a</text>
                <text x="65" y="123" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12p</text>
                <text x="9" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6p</text>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>{feedsToday}</div>
                <Mono size={10} color={T.ink300} style={{ marginTop: 2 }}>of {feedsTarget} today</Mono>
              </div>
            </div>

            <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
              {lastFeed ? (
                <>
                  <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}>Last feed</Mono>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 24, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                    {timeAgo(lastFeed.logged_at)}
                  </div>
                  <Body size={12} color={T.ink500}>
                    {lastFeed.food_type}{lastFeed.duration_minutes ? ` · ${lastFeed.duration_minutes} min` : ''}
                  </Body>
                </>
              ) : (
                <Body size={14} color={T.ink300}>No feeds logged today</Body>
              )}
              <Spacer h={4} />
              <Button variant="primary" size="sm" icon="plus" onClick={() => openSheet()}>Log feed</Button>
            </Stack>
          </HRow>
        </Card>

        <Spacer h={16} />

        {/* Quick tap */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {FEED_TYPES.map(t => (
            <button key={t.id} onClick={() => !t.soon && openSheet(t.id)}
              style={{ padding: '12px 6px', borderRadius: RADIUS.md, background: T.surface, border: `0.5px solid ${T.line}`, cursor: t.soon ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', opacity: t.soon ? 0.45 : 1 }}>
              <div style={{ color: t.color }}><CBIcon name={t.icon} size={20} /></div>
              <Body size={11} color={T.ink900} weight={600}>{t.label}</Body>
              {t.soon && <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 5px', borderRadius: 4, background: T.line, fontSize: 8, fontWeight: 700, color: T.ink500 }}>SOON</div>}
            </button>
          ))}
        </div>

        <Spacer h={18} />

        {/* Dr. Bloom insight */}
        {feedsToday > 0 && (
          <AIBubble lead="Pattern today" sparkle>
            {feedsToday >= feedsTarget
              ? `${child?.name} hit the daily feed target. Great job keeping up the rhythm.`
              : `${feedsToday} feeds so far — ${feedsTarget - feedsToday} more to reach today's target. Cluster feeds in the evening are normal.`}
          </AIBubble>
        )}

        <Spacer h={18} />

        {/* Today's feeds */}
        <HRow justify="space-between" align="baseline" style={{ marginBottom: 8 }}>
          <Display size={18} italic weight={600}>Today's feeds</Display>
          <Mono size={11} color={T.ink300}>{feedsToday} logged</Mono>
        </HRow>

        {todayLogs.length === 0 ? (
          <Card p={24} style={{ textAlign: 'center' }}>
            <Body size={14} color={T.ink300}>No feeds logged yet today.</Body>
          </Card>
        ) : (
          <Card p={0}>
            {todayLogs.map((f, i) => {
              const ft = FEED_TYPES.find(t => t.id === f.food_type);
              return (
                <div key={f.id}>
                  <HRow gap={10} style={{ padding: '12px 14px', animation: i === 0 ? 'cb-slide-in 0.32s ease-out' : 'none' }} align="center">
                    <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: ft ? ft.bg : T.brandWash, color: ft ? ft.color : T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CBIcon name={ft?.icon || 'bottle'} size={15} />
                    </div>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Body size={13} color={T.ink900} weight={600}>
                        {format(new Date(f.logged_at), 'h:mm a')}
                        <span style={{ color: T.ink300, fontWeight: 500 }}> · {f.food_type}</span>
                      </Body>
                      <Body size={11} color={T.ink500}>
                        {f.duration_minutes ? `${f.duration_minutes} min` : ''}{f.notes ? ` · ${f.notes}` : ''}
                      </Body>
                    </Stack>
                    {i === 0 && <div style={{ padding: '3px 8px', borderRadius: 999, background: T.brandWash, color: T.brand, fontSize: 10, fontWeight: 700 }}>{timeAgo(f.logged_at)}</div>}
                  </HRow>
                  {i < todayLogs.length - 1 && <Divider />}
                </div>
              );
            })}
          </Card>
        )}

        <Spacer h={24} />
      </div>

      {/* Log sheet */}
      <BottomSheet open={sheetOpen} onClose={closeSheet}>
        <Display size={22} italic weight={600} style={{ marginBottom: 20 }}>Log a feed</Display>

        <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'block' }}>Type</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
          {FEED_TYPES.map(t => <FeedTypeCard key={t.id} type={t} selected={feedType} onSelect={setFeedType} />)}
        </div>

        <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'block' }}>Duration — scroll to pick</Mono>
        <div style={{ marginBottom: 24 }}>
          <DrumRoll values={DURATIONS} selected={duration} onChange={setDuration} />
        </div>

        <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'block' }}>Notes (optional)</Mono>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. good latch, fussy…"
          style={{ width: '100%', padding: '13px 14px', borderRadius: RADIUS.md, border: `1.5px solid ${T.line}`, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: T.ink900, background: 'rgba(0,0,0,0.02)', fontFamily: FONTS.sans, marginBottom: 24, transition: 'border-color 0.18s' }}
          onFocus={e => e.target.style.borderColor = T.brandSoft}
          onBlur={e => e.target.style.borderColor = T.line}
        />

        {saveError && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: RADIUS.md, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 13, color: '#dc2626' }}>
            {saveError}
          </div>
        )}

        <button
          onClick={() => { if (!saved && !addMutation.isPending) addMutation.mutate(); }}
          disabled={addMutation.isPending || saved}
          style={{
            width: '100%', padding: '16px', borderRadius: RADIUS.lg, border: 'none',
            background: saved ? '#22c55e' : T.brand, color: '#fff', fontSize: 16, fontWeight: 600,
            cursor: saved || addMutation.isPending ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.3s, transform 0.12s', fontFamily: FONTS.sans,
            transform: addMutation.isPending ? 'scale(0.97)' : 'scale(1)',
            boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.35)' : '0 4px 20px rgba(0,0,0,0.15)',
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
          ) : 'Save feed'}
        </button>
      </BottomSheet>
    </div>
  );
}
