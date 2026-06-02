// "Note something you noticed" — the gentle logging sheet for Bloom Path.
// Single textarea, optional area chip, autosaves to localStorage,
// "Save quietly" CTA. Honors focus trap + Escape close.

import { useEffect, useRef, useState } from 'react';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Display, Mono, Body, Spacer, Stack } from '../../components/cb/primitives';
import { BLOOM_AREAS } from '../../lib/bloomAreas';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const DRAFT_KEY = (childId) => `cb_bloom_draft_${childId || 'none'}`;

export default function BloomMomentSheet({ open, onClose, childId, defaultArea = null, onSave, isSaving }) {
  const [note, setNote] = useState('');
  const [area, setArea] = useState(defaultArea);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const draftTimer = useRef(null);

  useFocusTrap(dialogRef, open, onClose);

  // Load draft on open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(childId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.savedAt && Date.now() - new Date(parsed.savedAt).getTime() < 24 * 3600 * 1000) {
          setNote(parsed.note || '');
          setArea(parsed.area || defaultArea);
          return;
        }
      }
    } catch {}
    setNote('');
    setArea(defaultArea);
    setError('');
  }, [open, childId, defaultArea]);

  // Autosave draft
  useEffect(() => {
    if (!open) return;
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(childId), JSON.stringify({
          note, area, savedAt: new Date().toISOString(),
        }));
      } catch {}
    }, 350);
    return () => clearTimeout(draftTimer.current);
  }, [note, area, childId, open]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSave = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setError('A few words is enough — anything you noticed.');
      return;
    }
    setError('');
    try {
      await onSave({ note: trimmed, area });
      try { localStorage.removeItem(DRAFT_KEY(childId)); } catch {}
    } catch (e) {
      setError('Could not save. Check your connection.');
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(11,23,20,0.42)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.26s ease', zIndex: 200,
          backdropFilter: open ? 'blur(3px)' : 'none',
          WebkitBackdropFilter: open ? 'blur(3px)' : 'none',
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Note a bloom moment"
        tabIndex={-1}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: T.surface, borderRadius: '28px 28px 0 0',
          padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 24px), 36px)',
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.44s cubic-bezier(0.32,0.72,0,1)',
          zIndex: 201, maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 18px' }} aria-hidden="true" />

        <Display size={22} italic weight={600}>Something you noticed?</Display>
        <Spacer h={4} />
        <Body size={13} color={T.ink500} lh={1.5}>
          A few words is enough. Whatever felt new or sweet today.
        </Body>
        <Spacer h={18} />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Adoa held the rattle for ten whole seconds…"
          aria-label="What you noticed"
          autoFocus
          rows={4}
          maxLength={600}
          style={{
            width: '100%', padding: '14px',
            borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`,
            background: 'rgba(0,0,0,0.02)',
            fontSize: 15, color: T.ink900, fontFamily: FONTS.sans,
            outline: 'none', resize: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.18s',
          }}
          onFocus={(e) => e.target.style.borderColor = T.brandSoft}
          onBlur={(e) => e.target.style.borderColor = T.line}
        />

        <Spacer h={18} />

        <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
          Which area? (optional)
        </Mono>
        <div role="radiogroup" aria-label="Bloom area" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <AreaChip label="Not sure" selected={area === null} accent={T.ink400} onClick={() => setArea(null)} />
          {BLOOM_AREAS.map(a => (
            <AreaChip
              key={a.key}
              label={a.short}
              selected={area === a.key}
              accent={a.accent}
              onClick={() => setArea(a.key)}
            />
          ))}
        </div>

        {error && (
          <>
            <Spacer h={14} />
            <Body size={12} color="#B45309">{error}</Body>
          </>
        )}

        <Spacer h={20} />

        <button
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Save bloom moment quietly"
          style={{
            width: '100%', padding: '15px', borderRadius: RADIUS.lg, border: 'none',
            background: T.brand, color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: isSaving ? 'default' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            fontFamily: FONTS.sans, letterSpacing: '-0.005em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            transition: 'transform 0.12s ease',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onPointerUp={e => e.currentTarget.style.transform = ''}
          onPointerLeave={e => e.currentTarget.style.transform = ''}
        >
          {isSaving ? 'Saving…' : 'Save quietly'}
        </button>

        <Spacer h={8} />
        <Body size={10} color={T.ink300} style={{ textAlign: 'center' }}>
          Draft autosaves as you type · Only you and Dr. Bloom see this
        </Body>
      </div>
    </>
  );
}

function AreaChip({ label, selected, accent, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`Area: ${label}`}
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${selected ? accent : T.line}`,
        background: selected ? accent + '22' : T.surface,
        color: selected ? accent : T.ink700,
        fontSize: 12, fontWeight: 600, fontFamily: FONTS.sans,
        transition: 'all 0.16s ease',
      }}
    >
      {label}
    </button>
  );
}
