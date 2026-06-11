import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSvgId } from './figures';

/**
 * Shared stage every SOS scene renders inside.
 *
 * - Soft room backdrop + perspective floor → depth without weight.
 * - `caption` is split on '·' into wrapping HTML chips below the svg
 *   (text never lives inside the svg, so it can't clip or resist i18n).
 * - `badges` places numbered HTML cues over the frame:
 *   [{ x: '52%', y: '30%', label: '5', ghost: true }]
 * - Slow-mo toggle drives the --spd custom property; the .slow-mode
 *   wrapper on the topic page drives the same variable via CSS.
 */
export default function SceneStage({
  caption,
  accent = '#DC2626',
  compact = false,
  badges,
  showSpeedToggle = true,
  zoom = 1.22,
  children,
}) {
  const { t } = useTranslation();
  const uid = useSvgId();
  const [slow, setSlow] = useState(false);
  // Scene coordinate space is always 440×320 with the floor at y≈250;
  // compact mode scales the whole svg down instead of moving the floor.
  const floorY = 250;

  return (
    <div className="scene-stage" data-slow={slow || undefined} style={{ '--accent': accent }}>
      <div className="scene-frame">
        <svg viewBox="0 0 440 320" role="img" aria-label={caption || undefined}
          style={compact ? { maxHeight: 185, margin: '0 auto' } : undefined}>
          <defs>
            {/* room tone — warm light falling from the top */}
            <radialGradient id={`${uid}-room`} cx="50%" cy="12%" r="95%">
              <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#F6EFE4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E3D5C2" stopOpacity="0.55" />
            </radialGradient>
            {/* floor */}
            <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EFE5D6" />
              <stop offset="100%" stopColor="#DCCBB4" />
            </linearGradient>
            <radialGradient id={`${uid}-pool`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF8EC" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFF8EC" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="440" height="320" fill={`url(#${uid}-room)`} />
          {/* soft out-of-focus horizon band */}
          <rect x="0" y={floorY - 14} width="440" height="14" fill="#CDB99E" opacity="0.25" />
          {/* floor plane */}
          <rect x="0" y={floorY} width="440" height={320 - floorY} fill={`url(#${uid}-floor)`} />
          {/* light pool where the action happens */}
          <ellipse cx="220" cy={floorY + 10} rx="190" ry="26" fill={`url(#${uid}-pool)`} />

          {/* zoom about the action centre (220, 256) so figures fill the stage */}
          <g transform={`translate(${220 - 220 * zoom},${256 - 256 * zoom}) scale(${zoom})`}>
            {children}
          </g>
        </svg>

        {badges?.map((b, i) => (
          <span key={i}
            className={`scene-badge${b.ghost ? ' scene-badge--ghost' : ''}`}
            style={{ left: b.x, top: b.y }}>
            {b.label}
          </span>
        ))}

        {showSpeedToggle && (
          <button type="button" className="scene-speed" aria-pressed={slow}
            onClick={() => setSlow(s => !s)}>
            {slow ? t('sos.scenes.speedNormal') : t('sos.scenes.speedSlow')}
          </button>
        )}
      </div>

      {caption && (
        <div className="scene-caption">
          {String(caption).split('·').map((chip, i) => (
            <span key={i} className="scene-chip">{chip.trim()}</span>
          ))}
        </div>
      )}
    </div>
  );
}
