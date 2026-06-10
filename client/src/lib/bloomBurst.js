// bloomBurst — ChildBloom's signature micro-celebration.
// A tiny burst of petals/leaves wherever a parent completes a log. Uses the
// Web Animations API (no injected keyframes → CSP-safe) and respects
// prefers-reduced-motion. Fire-and-forget: bloomBurst() or celebrate().

const PETAL_COLORS = [
  'var(--brand, #1f5e3a)',
  'var(--brand-soft, #6a9a7a)',
  'var(--gold, #C9A35A)',
  'var(--accent-soft, #f3d9c9)',
  'var(--brand-wash, #e3efe7)',
];

function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// Burst `count` petals from (x, y) in viewport coordinates.
// Defaults to the lower-center of the screen (where save buttons live).
export function bloomBurst({ x, y, count = 14 } = {}) {
  if (typeof document === 'undefined' || reducedMotion()) return;

  const originX = x ?? window.innerWidth / 2;
  const originY = y ?? window.innerHeight * 0.72;

  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '500',
    overflow: 'hidden',
  });
  document.body.appendChild(layer);

  let pending = count;
  const cleanup = () => {
    pending -= 1;
    if (pending <= 0) layer.remove();
  };

  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    const size = 7 + Math.random() * 7;
    const color = PETAL_COLORS[i % PETAL_COLORS.length];
    Object.assign(petal.style, {
      position: 'absolute',
      left: `${originX}px`,
      top: `${originY}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      // Petal silhouette: rounded on three corners, pointed on one.
      borderRadius: '70% 70% 70% 0',
      willChange: 'transform, opacity',
    });
    layer.appendChild(petal);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.9;
    const distance = 56 + Math.random() * 78;
    const dx = Math.cos(angle) * distance;
    // Bias upward, then petals "fall" a little at the end.
    const dy = Math.sin(angle) * distance - 30;
    const spin = (Math.random() - 0.5) * 540;
    const duration = 650 + Math.random() * 350;

    const anim = petal.animate(
      [
        { transform: 'translate(-50%, -50%) rotate(0deg) scale(0.4)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy}px)) rotate(${spin * 0.7}deg) scale(1)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 34}px)) rotate(${spin}deg) scale(0.85)`,
          opacity: 0,
        },
      ],
      { duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    );
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }

  // Safety net in case animations never finish (backgrounded tab).
  setTimeout(() => layer.remove(), 1600);
}

// Burst + a soft success haptic in one call — use after any successful log.
export function celebrate(opts) {
  try { navigator.vibrate?.([12, 40, 18]); } catch { /* unsupported */ }
  bloomBurst(opts);
}
