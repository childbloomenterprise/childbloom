/**
 * Scene props — household objects drawn once, reused everywhere.
 * All drawn around local (0,0) at a natural size for the 440×320 stage;
 * scenes position them with transforms.
 */
import { g, Spec } from './figures';

/* universal prohibition sign — red ring + slash */
export function NoSign({ x = 0, y = 0, r = 30 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="0" cy="0" r={r} fill="none" stroke="#C42B1C" strokeWidth={r * 0.16} />
      <line x1={-r * 0.62} y1={-r * 0.62} x2={r * 0.62} y2={r * 0.62}
        stroke="#C42B1C" strokeWidth={r * 0.16} strokeLinecap="round" />
    </g>
  );
}

/* phone in hand — call for help */
export function Phone({ uid }) {
  return (
    <g>
      <rect x="-16" y="-30" width="32" height="58" rx="7" fill="#2B3440" />
      <rect x="-12" y="-25" width="24" height="44" rx="3" fill="#A8C6E8" />
      <Spec uid={uid} cx="-4" cy="-16" rx="7" ry="10" opacity="0.5" />
      <circle cx="0" cy="23" r="2.6" fill="#5A6678" />
      {/* green call dot on screen */}
      <circle cx="0" cy="6" r="7" fill="#2FA45A" />
      <path d="M -2.6,4 Q -3.4,7.2 0,8.8 Q 3.2,10 4,7.4 L 2,5.6 Q 0.8,6.4 -0.6,5.2 Q -1.6,3.8 -1,3 Z" fill="#fff" />
    </g>
  );
}

/* analogue clock face — timing matters */
export function ClockFace({ uid, minute = 120 }) {
  return (
    <g>
      <circle cx="0" cy="0" r="26" fill="#FFFDF8" stroke="#6B5640" strokeWidth="3" />
      <circle cx="0" cy="0" r="2.4" fill="#6B5640" />
      {[0, 90, 180, 270].map(a => (
        <line key={a} x1="0" y1="-22" x2="0" y2="-18.5" stroke="#6B5640" strokeWidth="2"
          transform={`rotate(${a})`} strokeLinecap="round" />
      ))}
      <line x1="0" y1="2" x2="0" y2="-13" stroke="#6B5640" strokeWidth="2.6" strokeLinecap="round"
        transform={`rotate(${minute})`} />
      <line x1="0" y1="2" x2="0" y2="-18" stroke="#C42B1C" strokeWidth="1.8" strokeLinecap="round"
        transform={`rotate(${minute * 2})`} className="sc-bob" />
    </g>
  );
}

/* hospital — building with cross */
export function HospitalIcon({ uid }) {
  return (
    <g>
      <rect x="-44" y="-28" width="88" height="58" rx="5" fill="#E9EFF5" stroke="#9FB2C4" strokeWidth="2" />
      <rect x="-14" y="2" width="28" height="28" rx="3" fill="#7A95AE" />
      <rect x="-36" y="-18" width="14" height="12" rx="2" fill="#BCD0E2" />
      <rect x="22" y="-18" width="14" height="12" rx="2" fill="#BCD0E2" />
      <rect x="-36" y="0" width="14" height="12" rx="2" fill="#BCD0E2" />
      <rect x="22" y="0" width="14" height="12" rx="2" fill="#BCD0E2" />
      {/* cross sign */}
      <circle cx="0" cy="-14" r="11" fill="#C42B1C" />
      <rect x="-2.6" y="-21" width="5.2" height="14" rx="1.5" fill="#fff" />
      <rect x="-7" y="-16.6" width="14" height="5.2" rx="1.5" fill="#fff" />
    </g>
  );
}

/* running tap with animated stream — the workhorse of burns/bites */
export function TapStream({ uid, length = 110 }) {
  return (
    <g>
      {/* tap body */}
      <path d="M -34,-12 Q -34,-26 -18,-26 L 10,-26 Q 22,-26 22,-14 L 22,-4 L 8,-4 L 8,-12 Q 8,-14 4,-14 L -18,-14 Q -22,-14 -22,-10 L -22,0 L -34,0 Z"
        fill="#9FB2C4" />
      <Spec uid={uid} cx="-6" cy="-22" rx="12" ry="3" opacity="0.6" />
      {/* handle */}
      <rect x="-10" y="-38" width="16" height="8" rx="4" fill="#7A95AE" />
      {/* falling water — dashes flow downward */}
      <path className="sc-flow" d={`M 15,-2 q -2,${length * 0.4} 0,${length}`} fill="none"
        stroke={g(uid, 'water')} strokeWidth="13" strokeLinecap="round"
        strokeDasharray="14 8" opacity="0.85" />
      {/* splash at the bottom */}
      <path d={`M 4,${length} q 11,8 24,0`} fill="none" stroke="#7FB1E8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

/* drinking cup with straw */
export function Cup({ uid }) {
  return (
    <g>
      <path d="M -14,-16 L 14,-16 L 11,18 Q 10,22 0,22 Q -10,22 -11,18 Z" fill="#D8E8F5" stroke="#9FB2C4" strokeWidth="2" />
      <line x1="4" y1="-30" x2="10" y2="-14" stroke="#E8896A" strokeWidth="3.5" strokeLinecap="round" />
      <Spec uid={uid} cx="-5" cy="-6" rx="4" ry="9" opacity="0.6" />
    </g>
  );
}

/* cloth-wrapped cold pack */
export function IcePack({ uid }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="24" ry="15" fill="#BFE0F2" stroke="#8FB9D6" strokeWidth="2" />
      <path d="M -10,-4 L -4,-4 M -7,-7 L -7,-1 M 4,2 L 10,2 M 7,-1 L 7,5" stroke="#5E97D1" strokeWidth="2" strokeLinecap="round" />
      <path d="M -24,-2 Q -28,-8 -22,-12 M 24,-2 Q 28,-8 22,-12" fill="none" stroke="#8FB9D6" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/* medicine bottle with warning */
export function PillBottle({ uid, warn = true }) {
  return (
    <g>
      <rect x="-15" y="-12" width="30" height="40" rx="5" fill="#E8A33D" />
      <rect x="-11" y="-22" width="22" height="12" rx="3" fill="#B9762A" />
      <rect x="-11" y="-2" width="22" height="18" rx="2" fill="#FFF8EC" />
      <Spec uid={uid} cx="-7" cy="4" rx="3" ry="9" opacity="0.5" />
      {warn && (
        <g transform="translate(0,7)">
          <path d="M 0,-7 L 7,5 L -7,5 Z" fill="#C42B1C" />
          <rect x="-1.1" y="-3" width="2.2" height="4.5" rx="1" fill="#fff" />
          <circle cx="0" cy="3" r="1.2" fill="#fff" />
        </g>
      )}
    </g>
  );
}

/* adrenaline auto-injector — orange tip down, blue cap up */
export function EpiPen({ uid, cap = false }) {
  return (
    <g>
      {/* body */}
      <rect x="-9" y="-44" width="18" height="64" rx="8" fill="#E8C63D" />
      <rect x="-9" y="-44" width="7" height="64" rx="3.5" fill="rgba(255,255,255,0.35)" />
      {/* orange tip (needle end — to the thigh) */}
      <rect x="-10.5" y="16" width="21" height="16" rx="6" fill="#E0732B" />
      <Spec uid={uid} cx="-3" cy="22" rx="4" ry="3" opacity="0.5" />
      {/* blue safety cap at the top */}
      {cap && <rect x="-10.5" y="-58" width="21" height="16" rx="6" fill="#3D6BB5" />}
      {/* viewing window */}
      <rect x="-4" y="-24" width="8" height="22" rx="3" fill="#F8F2DC" stroke="#B9962A" strokeWidth="1" />
    </g>
  );
}

/* fine-tipped tweezers */
export function Tweezers({ uid }) {
  return (
    <g>
      <path d="M -4,-36 Q -10,-34 -8,-26 L -1.5,2 L 0,8 L 1.5,2 L 8,-26 Q 10,-34 4,-36 Q 0,-38 -4,-36 Z"
        fill="#B7C4D0" />
      <path d="M -4,-33 L -1,-6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

/* digital thermometer */
export function Thermometer({ uid }) {
  return (
    <g>
      <rect x="-5" y="-34" width="10" height="56" rx="5" fill="#E9EFF5" stroke="#9FB2C4" strokeWidth="1.5" />
      <rect x="-3" y="-28" width="6" height="12" rx="2" fill="#CDE0EE" />
      <circle cx="0" cy="26" r="7" fill="#C42B1C" />
      <rect x="-2" y="-10" width="4" height="34" rx="2" fill="#C42B1C" />
    </g>
  );
}

/* soft blanket draped over a side-lying body (drawn to fit FigureSideLying) */
export function BlanketOver({ uid }) {
  return (
    <g>
      <path d="M 150,212 Q 200,182 268,192 Q 318,200 340,232 Q 344,248 330,254 Q 270,264 210,260 Q 168,256 154,240 Q 146,224 150,212 Z"
        fill="#E8B86A" opacity="0.95" />
      <path d="M 168,218 Q 230,196 320,218" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 176,236 Q 240,220 322,238" fill="none" stroke="rgba(120,70,20,0.25)" strokeWidth="2.5" strokeLinecap="round" />
      {/* stitched hem */}
      <path d="M 154,238 Q 230,258 330,250" fill="none" stroke="#B9853B" strokeWidth="2" strokeDasharray="5 4" opacity="0.7" />
    </g>
  );
}

/* folded cushion */
export function Cushion({ uid }) {
  return (
    <g>
      <path d="M -34,4 Q -38,-10 -22,-14 Q 0,-19 22,-14 Q 38,-10 34,4 Q 30,14 0,15 Q -30,14 -34,4 Z" fill="#D8A8B8" />
      <path d="M -26,-6 Q 0,-12 26,-6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M -28,6 Q 0,11 28,6" fill="none" stroke="rgba(120,50,70,0.3)" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/* small steady flame */
export function Flame({ uid }) {
  return (
    <g>
      <path className="sc-rise" d="M 0,12 Q -12,2 -8,-10 Q -5,-18 0,-24 Q 2,-14 8,-10 Q 14,-2 8,8 Q 4,13 0,12 Z" fill="#E8762B" />
      <path className="sc-rise" style={{ animationDelay: 'calc(0.4s * var(--spd))' }}
        d="M 0,9 Q -6,3 -3,-5 Q -1,-10 1,-13 Q 2,-6 5,-3 Q 8,2 4,7 Q 2,9 0,9 Z" fill="#F5C242" />
    </g>
  );
}

/* sun with rays */
export function Sun({ uid }) {
  return (
    <g>
      <circle cx="0" cy="0" r="16" fill="#F5C242" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <line key={a} x1="0" y1="-21" x2="0" y2="-27" stroke="#F5C242" strokeWidth="3.5"
          strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

/* hand fan / fanning paddle */
export function FanPaddle({ uid }) {
  return (
    <g>
      <path d="M -22,-30 Q 0,-44 22,-30 Q 28,-16 22,-4 Q 0,4 -22,-4 Q -28,-16 -22,-30 Z" fill="#A8C6A0" />
      <path d="M -14,-28 L -8,-6 M 0,-32 L 0,-4 M 14,-28 L 8,-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      <rect x="-3" y="-2" width="6" height="26" rx="3" fill="#7E9A76" />
    </g>
  );
}

/* roll of cling film with translucent sheet */
export function ClingFilm({ uid }) {
  return (
    <g>
      <rect x="-30" y="-8" width="60" height="16" rx="8" fill="#C9D4DE" />
      <Spec uid={uid} cx="0" cy="-3" rx="22" ry="3" opacity="0.55" />
      <path d="M -28,8 L -28,46 L 28,46 L 28,8" fill="rgba(190,215,235,0.4)" stroke="rgba(150,180,205,0.7)" strokeWidth="1.5" />
    </g>
  );
}

/* folded gauze pad */
export function GauzePad({ uid }) {
  return (
    <g>
      <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#FFFDF8" stroke="#D8CDBA" strokeWidth="1.5" />
      <path d="M -12,-6 H 12 M -12,0 H 12 M -12,6 H 12" stroke="#E4DBC8" strokeWidth="1.5" />
    </g>
  );
}

/* wooden broom-handle / stick (electric shock rescue) */
export function WoodStick({ uid, length = 130 }) {
  return (
    <g>
      <rect x="0" y="-6" width={length} height="12" rx="6" fill="#C99A5B" />
      <path d={`M 6,-2 H ${length - 8}`} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
      <path d={`M 10,3 H ${length - 14}`} stroke="rgba(110,60,20,0.3)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

/* wall socket with plug and live cable */
export function PlugSocket({ uid, live = true }) {
  return (
    <g>
      <rect x="-22" y="-26" width="44" height="52" rx="6" fill="#E9EFF5" stroke="#9FB2C4" strokeWidth="2" />
      <circle cx="-7" cy="-6" r="3" fill="#5A6678" />
      <circle cx="7" cy="-6" r="3" fill="#5A6678" />
      <rect x="-3" y="6" width="6" height="8" rx="2" fill="#5A6678" />
      {/* plug + cable */}
      <rect x="-12" y="24" width="24" height="16" rx="5" fill="#4A5564" />
      <path d="M 0,40 Q 6,62 -8,76" fill="none" stroke="#4A5564" strokeWidth="5" strokeLinecap="round" />
      {live && (
        <g className="sc-flicker">
          <path d="M -20,32 L -28,40 L -22,41 L -30,52" fill="none" stroke="#F5C242" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20,34 L 27,42 L 21,43 L 28,54" fill="none" stroke="#F5C242" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/* a bee/wasp sting in skin (scrape-it-out scene) */
export function StingMark({ uid }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="11" ry="7" fill="#E8927A" opacity="0.6" />
      <line x1="0" y1="2" x2="0" y2="-10" stroke="#5A4632" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="0" cy="-11" r="2.4" fill="#3E2E1E" />
    </g>
  );
}

/* Realistic child forearm + relaxed hand, resting palm-down on a surface.
   Used as the canvas for wounds, stings, cling film, water cooling.
   Wound `mark` zone sits on the forearm around (230,206). Hand and
   fingers at the left; elbow runs off-frame to the upper right. */
export function ForearmCloseUp({ uid, mark = null }) {
  const sk = g(uid, 'iskinL');
  return (
    <g>
      {/* soft contact shadow under the whole arm */}
      <ellipse cx="232" cy="252" rx="150" ry="13" fill="#33200E" opacity="0.18" filter={g(uid, 'blur6')} />

      {/* ── forearm: wrist (left, ~x178) widening to the elbow off-frame (right) ── */}
      <path d="M 176,228
               Q 176,210 196,202 Q 250,184 312,184 Q 348,184 372,196
               L 380,236 Q 352,250 312,250 Q 250,250 200,244 Q 178,242 176,228 Z"
        fill={sk} />
      {/* rounded top ridge — where the light lands, gives the cylinder its roll */}
      <path d="M 192,206 Q 250,190 312,190 Q 344,190 366,200"
        fill="none" stroke="rgba(255,243,224,0.7)" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
      <path d="M 200,200 Q 256,186 314,187" fill="none" stroke="rgba(255,250,238,0.55)" strokeWidth="3" strokeLinecap="round" />
      {/* underside form-shadow — the arm turns away from the light here */}
      <path d="M 196,240 Q 256,248 320,246 Q 352,245 372,236"
        fill="none" stroke="#9C5B28" strokeWidth="9" strokeLinecap="round" opacity="0.22" />
      {/* soft muscle/tendon hint along the forearm */}
      <path d="M 236,224 Q 286,218 336,222" fill="none" stroke="#B97A40" strokeWidth="2" strokeLinecap="round" opacity="0.22" />

      {/* ── wrist crease ── */}
      <path d="M 182,214 Q 188,228 184,240" fill="none" stroke="#A8632E" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M 190,212 Q 196,228 191,242" fill="none" stroke="#A8632E" strokeWidth="1.2" strokeLinecap="round" opacity="0.28" />

      {/* ── back of the hand ── */}
      <path d="M 116,206 Q 120,194 140,194 Q 164,194 178,206 Q 186,216 180,230
               Q 172,244 150,244 Q 126,244 116,232 Q 110,220 116,206 Z" fill={g(uid, 'iskin')} />
      {/* knuckle ridge + tendon fan toward the fingers */}
      <path d="M 124,210 Q 138,204 156,206" fill="none" stroke="rgba(255,243,224,0.6)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 128,222 L 116,214 M 138,224 L 126,214 M 148,224 L 138,213 M 158,222 L 150,212"
        fill="none" stroke="#B97A40" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />

      {/* ── four fingers, slightly fanned, pointing left ── */}
      {[
        { y: 196, len: 30, w: 8.5 },
        { y: 207, len: 34, w: 9 },
        { y: 219, len: 32, w: 9 },
        { y: 231, len: 26, w: 8 },
      ].map((f, i) => (
        <g key={i}>
          <path d={`M 124,${f.y} q -${f.len},${i < 2 ? -2 : 3} -${f.len + 6},${i < 2 ? -1 : 2}
                    q -5,0 -5,${f.w / 2} q 0,${f.w / 2} 5,${f.w / 2}
                    q ${f.len * 0.4},1 ${f.len + 4},-1 Z`} fill={g(uid, 'iskin')} />
          {/* nail */}
          <ellipse cx={124 - f.len - 3} cy={f.y + (i < 2 ? -1 : 2)} rx="3" ry="2.2" fill="rgba(255,238,218,0.75)" />
          {/* knuckle crease */}
          <path d={`M ${124 - f.len * 0.45},${f.y - 2} q 0,${f.w} 0,${f.w}`} fill="none" stroke="#A8632E" strokeWidth="0.9" opacity="0.3" />
        </g>
      ))}

      {/* thumb tucked on the near/lower side */}
      <path d="M 134,238 Q 124,250 110,250 Q 102,250 104,242 Q 108,234 120,232 Q 128,232 134,238 Z" fill={g(uid, 'iskin')} />
      <ellipse cx="106" cy="246" rx="2.8" ry="2" fill="rgba(255,238,218,0.7)" />

      {/* specular sheen on the back of the hand */}
      <Spec uid={uid} cx="146" cy="208" rx="13" ry="6" opacity="0.45" />

      {mark}
    </g>
  );
}
