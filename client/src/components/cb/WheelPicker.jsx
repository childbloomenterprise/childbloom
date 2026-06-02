// WheelPicker — iOS-style momentum scroll wheel.
// Direct DOM manipulation during scroll = 60fps with zero React re-renders mid-drag.
// Haptic feedback via navigator.vibrate() where supported (Android Chrome, some iOS PWA).
// Keyboard accessible via ARIA slider role.

import { useRef, useEffect, memo } from 'react';
import { T, FONTS } from './tokens';

const DEFAULT_ROW_H  = 46;
const DEFAULT_VISIBLE = 5; // must be odd

// Generate once at module level — callers can import and pass directly.
// 501 items (0–500 ml). Module-scoped = never recreated.
export const ML_ITEMS = Array.from({ length: 501 }, (_, i) => ({
  value: i,
  label: String(i),
}));

// Generic helper for any integer range.
export function rangeItems(from, to, step = 1) {
  const out = [];
  for (let v = from; v <= to; v += step) {
    out.push({ value: v, label: String(v) });
  }
  return out;
}

function WheelPicker({
  items,           // [{ value: any, label: string }]
  selectedIndex,   // controlled — 0-based
  onChange,        // (newIndex: number) => void
  rowH     = DEFAULT_ROW_H,
  visibleRows = DEFAULT_VISIBLE,
  unit     = '',   // fixed label shown in the selection band (e.g. "ml")
  style,
}) {
  const containerH = visibleRows * rowH;
  const padH       = Math.floor(visibleRows / 2) * rowH; // rows above/below center

  const minT = padH - (items.length - 1) * rowH;
  const maxT = padH;

  function indexToT(i) { return padH - i * rowH; }
  function tToIndex(t) {
    return Math.max(0, Math.min(items.length - 1, Math.round((padH - t) / rowH)));
  }

  const listRef    = useRef(null);
  const curT       = useRef(indexToT(selectedIndex));
  const isDragging = useRef(false);
  const startY     = useRef(0);
  const startT     = useRef(0);
  const velRef     = useRef(0);   // px / ms
  const prevY      = useRef(0);
  const prevTime   = useRef(0);
  const lastIdx    = useRef(selectedIndex);
  const raf        = useRef(null);

  // ── Style individual rows based on distance from center ──────────────────
  function styleRows(centerIdx) {
    if (!listRef.current) return;
    const children = listRef.current.children;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      const d = Math.abs(i - centerIdx);
      const ch = children[i];
      if (d === 0) {
        ch.style.fontSize   = '22px';
        ch.style.fontWeight = '700';
        ch.style.opacity    = '1';
        ch.style.color      = 'var(--ink-900)';
      } else if (d === 1) {
        ch.style.fontSize   = '17px';
        ch.style.fontWeight = '500';
        ch.style.opacity    = '0.55';
        ch.style.color      = 'var(--ink-500)';
      } else if (d === 2) {
        ch.style.fontSize   = '14px';
        ch.style.fontWeight = '400';
        ch.style.opacity    = '0.25';
        ch.style.color      = 'var(--ink-400)';
      } else {
        ch.style.opacity    = '0';
      }
    }
  }

  function applyT(t, animate = false) {
    if (!listRef.current) return;
    listRef.current.style.transition = animate
      ? 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none';
    listRef.current.style.transform = `translateY(${t}px)`;
    curT.current = t;
    styleRows(tToIndex(t));
  }

  function snapTo(idx, triggerCb = true) {
    const t = indexToT(Math.max(0, Math.min(items.length - 1, idx)));
    applyT(t, true);
    if (triggerCb && idx !== lastIdx.current) {
      lastIdx.current = idx;
      onChange(idx);
      try { navigator.vibrate?.(10); } catch (_) {}
    }
  }

  // ── Sync when selectedIndex prop changes from outside ────────────────────
  useEffect(() => {
    if (isDragging.current) return;
    if (selectedIndex === lastIdx.current) return;
    const t = indexToT(selectedIndex);
    if (Math.abs(curT.current - t) > 2) applyT(t, true);
    else applyT(t, false);
    lastIdx.current = selectedIndex;
  }, [selectedIndex, items.length]);

  // ── Initial position (mount) ─────────────────────────────────────────────
  useEffect(() => {
    applyT(indexToT(selectedIndex));
    lastIdx.current = selectedIndex;
  }, []); // eslint-disable-line

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // ── Touch handlers ───────────────────────────────────────────────────────
  function onTouchStart(e) {
    cancelAnimationFrame(raf.current);
    isDragging.current = true;
    const y = e.touches[0].clientY;
    startY.current  = y;
    startT.current  = curT.current;
    prevY.current   = y;
    prevTime.current = Date.now();
    velRef.current  = 0;
    if (listRef.current) listRef.current.style.transition = 'none';
  }

  function onTouchMove(e) {
    e.preventDefault();
    const y   = e.touches[0].clientY;
    const now = Date.now();
    const dt  = now - prevTime.current;
    if (dt > 0) velRef.current = (y - prevY.current) / dt;
    prevY.current   = y;
    prevTime.current = now;

    let rawT = startT.current + (y - startY.current);
    // Rubber-band at boundaries (iOS feel)
    if (rawT > maxT) rawT = maxT + (rawT - maxT) * 0.12;
    if (rawT < minT) rawT = minT + (rawT - minT) * 0.12;

    applyT(rawT);

    // Per-item haptic as finger crosses each row boundary
    const idx = tToIndex(rawT);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      try { navigator.vibrate?.(8); } catch (_) {}
    }
  }

  function onTouchEnd() {
    isDragging.current = false;
    const v = velRef.current; // px/ms

    if (Math.abs(v) < 0.05) {
      snapTo(tToIndex(curT.current));
      return;
    }

    // Momentum: exponential velocity decay, snap when speed drops
    let vel = v * 14; // scaling for natural feel
    let last = Date.now();

    function frame() {
      const now  = Date.now();
      const dt16 = (now - last) / 16; // normalised to 60fps frame
      last = now;

      vel *= Math.pow(0.90, dt16);

      let nextT = curT.current + vel * dt16;
      if (nextT > maxT) { nextT = maxT; vel = 0; }
      if (nextT < minT) { nextT = minT; vel = 0; }

      applyT(nextT);

      const idx = tToIndex(nextT);
      if (idx !== lastIdx.current) {
        lastIdx.current = idx;
        try { navigator.vibrate?.(8); } catch (_) {}
      }

      if (Math.abs(vel) > 0.5) {
        raf.current = requestAnimationFrame(frame);
      } else {
        snapTo(tToIndex(nextT));
      }
    }
    raf.current = requestAnimationFrame(frame);
  }

  // ── Mouse support (desktop testing) ─────────────────────────────────────
  const mouseDown = useRef(false);
  function onMouseDown(e) {
    mouseDown.current = true;
    startY.current = e.clientY;
    startT.current = curT.current;
    prevY.current  = e.clientY;
    prevTime.current = Date.now();
    velRef.current = 0;
    cancelAnimationFrame(raf.current);
    if (listRef.current) listRef.current.style.transition = 'none';
  }
  function onMouseMove(e) {
    if (!mouseDown.current) return;
    const dt = Date.now() - prevTime.current;
    if (dt > 0) velRef.current = (e.clientY - prevY.current) / dt;
    prevY.current = e.clientY;
    prevTime.current = Date.now();
    let rawT = startT.current + (e.clientY - startY.current);
    if (rawT > maxT) rawT = maxT + (rawT - maxT) * 0.12;
    if (rawT < minT) rawT = minT + (rawT - minT) * 0.12;
    applyT(rawT);
    const idx = tToIndex(rawT);
    if (idx !== lastIdx.current) lastIdx.current = idx;
  }
  function onMouseUp() {
    if (!mouseDown.current) return;
    mouseDown.current = false;
    snapTo(tToIndex(curT.current));
  }

  const valAtSelected = items[selectedIndex]?.value ?? 0;

  return (
    <div
      role="group"
      aria-label={unit ? `${unit} picker` : 'Value picker'}
      style={{ position: 'relative', height: containerH, overflow: 'hidden', userSelect: 'none', touchAction: 'none', cursor: 'ns-resize', ...style }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Selection band — two thin lines */}
      <div aria-hidden style={{ position: 'absolute', top: padH, left: 0, right: 0, height: rowH, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, zIndex: 2, pointerEvents: 'none' }} />

      {/* Fixed unit label in selection zone */}
      {unit && (
        <div aria-hidden style={{ position: 'absolute', top: padH, right: 28, height: rowH, display: 'flex', alignItems: 'center', zIndex: 4, pointerEvents: 'none' }}>
          <span style={{ fontSize: 14, color: T.ink400, fontFamily: FONTS.sans, fontWeight: 500 }}>{unit}</span>
        </div>
      )}

      {/* Top gradient */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: padH + rowH * 0.6, background: `linear-gradient(to bottom, var(--surface) 15%, transparent)`, zIndex: 3, pointerEvents: 'none' }} />
      {/* Bottom gradient */}
      <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: padH + rowH * 0.6, background: `linear-gradient(to top, var(--surface) 15%, transparent)`, zIndex: 3, pointerEvents: 'none' }} />

      {/* Scrolling item list */}
      <div
        ref={listRef}
        style={{ willChange: 'transform', touchAction: 'none' }}
        aria-hidden
      >
        {items.map((item) => (
          <div
            key={item.value}
            style={{
              height: rowH,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONTS.sans,
              pointerEvents: 'none',
              transition: 'font-size 0.08s, opacity 0.08s',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* ARIA slider — visually hidden, keyboard + screen reader entry */}
      <input
        type="range"
        min={items[0]?.value ?? 0}
        max={items[items.length - 1]?.value ?? 0}
        value={valAtSelected}
        step={items.length > 1 ? Math.abs((items[1]?.value ?? 1) - (items[0]?.value ?? 0)) : 1}
        aria-label={unit ? `${unit} amount: ${valAtSelected}` : `Value: ${valAtSelected}`}
        onChange={(e) => {
          const v = Number(e.target.value);
          const idx = items.findIndex(it => it.value === v);
          if (idx >= 0) { onChange(idx); snapTo(idx, false); }
        }}
        style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'default', zIndex: 10 }}
      />
    </div>
  );
}

export default memo(WheelPicker);
