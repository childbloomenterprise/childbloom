// Form input primitives — shared across logging flows.
//
// Extracted from FoodTrackerPage, SleepQuickSheet, and WeeklyUpdatePage
// where three near-identical ChipRow implementations had drifted.

import { T, FONTS } from '../tokens';

/**
 * ChipRow — selectable chip group in a 4-column grid.
 * Replaces scroll-wheel pickers in favor of one-tap selection.
 *
 * Props:
 *   values:    array of values to render as chips
 *   selected:  currently selected value (or null)
 *   onChange:  (value) => void
 *   unit:      small text suffix shown after each value (e.g. "min", "h", "ml")
 *   ariaLabelPrefix: optional prefix for screen reader announcements
 */
export function ChipRow({ values, selected, onChange, unit, ariaLabelPrefix }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabelPrefix ? `${ariaLabelPrefix} options` : undefined}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
    >
      {values.map(v => {
        const isSel = v === selected;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isSel}
            aria-label={ariaLabelPrefix ? `${ariaLabelPrefix}: ${v} ${unit || ''}`.trim() : `${v} ${unit || ''}`.trim()}
            onClick={() => onChange(v)}
            style={{
              padding: '14px 4px', borderRadius: 14,
              border: isSel ? `1.5px solid ${T.brand}` : `0.5px solid ${T.line}`,
              background: isSel ? T.brandWash : T.surface,
              color: isSel ? T.brand : T.ink900,
              fontSize: 16, fontWeight: isSel ? 700 : 500,
              fontFamily: FONTS.sans, cursor: 'pointer',
              transition: 'all 0.14s ease', minHeight: 48,
              display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3,
            }}
          >
            {v}
            {unit && <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>{unit}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SegmentedToggle — iOS-style segmented control. Lower visual weight than ChipRow.
 * Use for binary or small (2-4) mutually exclusive options.
 */
export function SegmentedToggle({ value, onChange, options, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 6,
        padding: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 12,
      }}
    >
      {options.map(opt => {
        const isSel = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSel}
            aria-label={opt.label}
            onClick={() => onChange(opt.id)}
            style={{
              padding: '10px 4px', borderRadius: 9, border: 'none',
              background: isSel ? T.surface : 'transparent',
              boxShadow: isSel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              color: isSel ? T.brand : T.ink500,
              fontSize: 14, fontWeight: isSel ? 700 : 500,
              cursor: 'pointer', fontFamily: FONTS.sans,
              transition: 'all 0.14s ease', minHeight: 40,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
