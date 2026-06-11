/**
 * Shared parameterized scenes — reused across multiple emergencies
 * (CPR ×2, drowning, electric shock, seizure all borrow from these).
 * Every scene renders inside <SceneStage>'s svg; figures are drawn for
 * the 440×320 space with the floor at y≈250-262.
 */
import {
  useSvgId, g, FigureDefs,
  InfantSupine, ChildSupine, FigureSideLying,
  HandTwoFinger, HandHeelStacked, HandChinLift, HandOnForehead,
  AdultHeadBreath, HandOpenPalm,
  TargetGlow, PulseRing, MotionArrow, ContactShadow,
} from './figures';

const isInfant = (v) => v !== 'child';
const Body = ({ variant, ...rest }) => isInfant(variant)
  ? <InfantSupine {...rest} />
  : <ChildSupine {...rest} />;

/* chest compression point per body */
const CHEST = { infant: { x: 206, y: 210 }, child: { x: 214, y: 208 } };
const MOUTH = { infant: { x: 144, y: 212 }, child: { x: 135, y: 222 } };
const chest = (v) => (isInfant(v) ? CHEST.infant : CHEST.child);
const mouth = (v) => (isInfant(v) ? MOUTH.infant : MOUTH.child);

/* ── 1 · response + breathing check ───────────────────────── */
export function SceneBreathCheck({ variant = 'infant' }) {
  const uid = useSvgId();
  const c = chest(variant);
  const m = mouth(variant);
  return (
    <>
      <FigureDefs uid={uid} />
      <Body variant={variant} uid={uid} chestAnim="sc-breathe" footAnim={isInfant(variant) ? 'sc-tap' : ''} />

      {/* tapping hand — sole of the foot for infants, shoulder for children */}
      {isInfant(variant) ? (
        <g transform="translate(336,243) rotate(-24) scale(0.92)">
          <g className="sc-tap"><HandChinLift uid={uid} /></g>
        </g>
      ) : (
        <g transform="translate(172,192) rotate(35) scale(0.92)">
          <g className="sc-tap"><HandChinLift uid={uid} /></g>
        </g>
      )}

      {/* watch the chest — soft dashed focus ring over the chest */}
      <ellipse cx={c.x} cy={c.y + 14} rx="44" ry="22" fill="none"
        stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 6" opacity="0.6" />

      {/* breath wisps near the mouth — is air moving? */}
      <g>
        <path className="sc-float" d={`M ${m.x + 8},${m.y - 18} q 6,-8 1,-15`} fill="none"
          stroke="#5E97D1" strokeWidth="3" strokeLinecap="round" />
        <path className="sc-float" d={`M ${m.x + 18},${m.y - 14} q 6,-8 1,-14`} fill="none"
          stroke="#5E97D1" strokeWidth="2.4" strokeLinecap="round"
          style={{ animationDelay: 'calc(0.7s * var(--spd))' }} />
      </g>
    </>
  );
}

/* ── 2 · lay flat on a firm surface ───────────────────────── */
export function SceneLayFlat({ variant = 'infant' }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      {/* firm mat under the body — visibly hard and flat */}
      <rect x="108" y="252" width={isInfant(variant) ? 248 : 296} height="10" rx="5" fill="#C9AE8C" />
      <rect x="108" y="252" width={isInfant(variant) ? 248 : 296} height="4" rx="2" fill="#E2CCAC" />
      <g className="sc-bob">
        <Body variant={variant} uid={uid} y={-6} />
      </g>
      {/* settle-down arrows either side */}
      <MotionArrow uid={uid} d="M 96,196 q -6,18 2,34" />
      <MotionArrow uid={uid} d={`M ${isInfant(variant) ? 364 : 402},196 q 6,18 -2,34`} />
    </>
  );
}

/* ── 3 · hand placement (hover above the target) ──────────── */
export function ScenePlaceHands({ variant = 'infant' }) {
  const uid = useSvgId();
  const c = chest(variant);
  const Hand = isInfant(variant) ? HandTwoFinger : HandHeelStacked;
  return (
    <>
      <FigureDefs uid={uid} />
      <Body variant={variant} uid={uid} />
      <TargetGlow uid={uid} cx={c.x} cy={c.y + 5} r={26} />
      {/* nipple-line guide — dashed tick above the target */}
      <path d={`M ${c.x + 22},${c.y - 8} q -10,-4 -20,-3`} fill="none"
        stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="3 4" opacity="0.7" />
      <g transform={`translate(${c.x},${c.y - 10})`}>
        <g className="sc-bob"><Hand uid={uid} /></g>
      </g>
    </>
  );
}

/* ── 4/5 · compressions (also the metronome step) ─────────── */
export function SceneCompress({ variant = 'infant', ghost = true }) {
  const uid = useSvgId();
  const c = chest(variant);
  const Hand = isInfant(variant) ? HandTwoFinger : HandHeelStacked;
  return (
    <>
      <FigureDefs uid={uid} />
      <Body variant={variant} uid={uid} />
      <TargetGlow uid={uid} cx={c.x} cy={c.y + 5} r={24} />
      {/* compression dent shading — appears exactly when the press lands */}
      <ellipse className="sc-dent" cx={c.x} cy={c.y + 2} rx="14" ry="4" fill="#8E5526" opacity="0.5" />
      <PulseRing cx={c.x} cy={c.y} r={20} />
      {/* ghost trail of the pressing hand */}
      {ghost && (
        <g transform={`translate(${c.x},${c.y - 2})`} aria-hidden="true">
          <g className="sc-ghost sc-press"><Hand uid={uid} /></g>
        </g>
      )}
      <g transform={`translate(${c.x},${c.y - 2})`}>
        <g className="sc-press"><Hand uid={uid} /></g>
      </g>
      {/* depth cue — small down arrow beside the chest */}
      <path d={`M ${c.x + 56},${c.y - 26} v 16`} fill="none" stroke="var(--accent)"
        strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} opacity="0.9" />
    </>
  );
}

/* ── 6 · open the airway (head tilt + chin lift) ──────────── */
export function SceneHeadTilt({ variant = 'infant' }) {
  const uid = useSvgId();
  const inf = isInfant(variant);
  const fore = inf ? { x: 116, y: 196 } : { x: 112, y: 206 };
  const chin = inf ? { x: 148, y: 222 } : { x: 138, y: 228 };
  return (
    <>
      <FigureDefs uid={uid} />
      <Body variant={variant} uid={uid} headAnim="sc-tilt" />
      {/* hand steadying the crown of the head */}
      <g transform={`translate(${fore.x - 2},${fore.y - 4}) scale(0.8)`}>
        <HandOnForehead uid={uid} />
      </g>
      {/* fingertip lifting the chin — finger only, keeps the face clear */}
      <g transform={`translate(${chin.x + 2},${chin.y + 5}) rotate(10)`}>
        <HandChinLift uid={uid} fingerOnly />
      </g>
      {/* tilt-direction arc — back and away from the face */}
      <MotionArrow uid={uid} d={`M ${fore.x - 10},${fore.y - 36} a 34,34 0 0 0 -20,22`} width={3} />
    </>
  );
}

/* ── 7 · rescue breaths ───────────────────────────────────── */
export function SceneRescueBreath({ variant = 'infant' }) {
  const uid = useSvgId();
  const inf = isInfant(variant);
  const m = mouth(variant);
  return (
    <>
      <FigureDefs uid={uid} />
      <Body variant={variant} uid={uid} chestAnim="sc-puff" />

      {/* chest-rise dashed outline — what success looks like */}
      <path d={inf
        ? 'M 162,206 Q 196,190 238,200'
        : 'M 156,206 Q 200,188 252,202'}
        fill="none" stroke="#3E9B6E" strokeWidth="2" strokeDasharray="4 5" opacity="0.75"
        className="sc-puff" style={{ transformOrigin: '50% 100%' }} />

      {/* nose pinch for children */}
      {!inf && (
        <g transform="translate(136,214) rotate(-15) scale(0.78)">
          <HandChinLift uid={uid} />
        </g>
      )}

      {/* rescuer head sealing the mouth (and nose, for infants) */}
      <g transform={`translate(${m.x},${m.y - 4})`}>
        <AdultHeadBreath uid={uid} />
      </g>

      {/* air flowing in — appears with each puff */}
      <g>
        <path className="sc-air" d={`M ${m.x - 26},${m.y - 30} q 14,2 20,16`} fill="none"
          stroke="#5E97D1" strokeWidth="3" strokeLinecap="round" />
        <path className="sc-air" d={`M ${m.x - 34},${m.y - 20} q 12,4 16,14`} fill="none"
          stroke="#5E97D1" strokeWidth="2.2" strokeLinecap="round"
          style={{ animationDelay: 'calc(0.12s * var(--spd))' }} />
      </g>
    </>
  );
}

/* ── 8 · keep cycling 30:2 ────────────────────────────────── */
export function SceneCycle302({ variant = 'infant' }) {
  const uid = useSvgId();
  const c = chest(variant);
  const m = mouth(variant);
  const Hand = isInfant(variant) ? HandTwoFinger : HandHeelStacked;
  return (
    <>
      <FigureDefs uid={uid} />

      {/* phase A — compressions (left, slightly larger) */}
      <g className="sc-phase-a">
        <g transform="translate(-58,16) scale(0.78)">
          <Body variant={variant} uid={uid} />
          <ellipse className="sc-dent" cx={c.x} cy={c.y + 2} rx="14" ry="4" fill="#8E5526" opacity="0.5" />
          <g transform={`translate(${c.x},${c.y - 2})`}>
            <g className="sc-press"><Hand uid={uid} /></g>
          </g>
        </g>
      </g>

      {/* phase B — breaths (right) */}
      <g className="sc-phase-b">
        <g transform="translate(178,16) scale(0.78)">
          <Body variant={variant} uid={uid} chestAnim="sc-puff" />
          <g transform={`translate(${m.x},${m.y - 4})`}>
            <AdultHeadBreath uid={uid} />
          </g>
        </g>
      </g>

      {/* continuous cycle loop between the two */}
      <g opacity="0.9">
        <path d="M 196,86 a 28,22 0 0 1 52,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
        <path d="M 248,108 a 28,22 0 0 1 -52,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
      </g>
    </>
  );
}

/* ── recovery position (used by 5 emergencies later) ──────── */
export function SceneRecoveryRoll({ variant = 'child' }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      {/* the side-lying end state — calm and settled */}
      <FigureSideLying uid={uid} variant={variant} />
      {/* faint ghost of the on-the-back start position, clear of the head */}
      <g opacity="0.1" transform="translate(30,-24)">
        <Body variant={variant} uid={uid} />
      </g>
      {/* rolling direction — over the top, toward the viewer's left */}
      <MotionArrow uid={uid} d="M 268,168 a 64,50 0 0 0 -96,6" width={3.5} />
      {/* open airway — calm green breath wisps, never red on the face */}
      <path className="sc-float" d="M 100,196 q 6,-8 1,-15" fill="none"
        stroke="#3E9B6E" strokeWidth="3" strokeLinecap="round" />
      <path className="sc-float" d="M 110,192 q 6,-8 1,-14" fill="none"
        stroke="#3E9B6E" strokeWidth="2.4" strokeLinecap="round"
        style={{ animationDelay: 'calc(0.7s * var(--spd))' }} />
    </>
  );
}
