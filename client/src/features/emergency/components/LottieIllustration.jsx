/**
 * LottieIllustration.jsx
 * Renders brand-animated Lottie illustrations for Child Bloom SOS emergencies.
 * Each illustration maps to a pre-built Lottie JSON file with brand colors.
 * Falls back to null if an unknown key is requested.
 */
import Lottie from 'lottie-react';

// Animation JSON imports (Vite resolves these at build time)
import infantCpr        from '../animations/infant-cpr.json';
import childCpr         from '../animations/child-cpr.json';
import chokingInfant    from '../animations/choking-infant.json';
import chokingChild     from '../animations/choking-child.json';
import recoveryPosition from '../animations/recovery-position.json';
import bleeding         from '../animations/bleeding.json';
import electricShock    from '../animations/electric-shock.json';
import burnCooling      from '../animations/burn-cooling.json';
import poisoning        from '../animations/poisoning.json';
import fever            from '../animations/fever.json';
import biteWound        from '../animations/bite-wound.json';

/** Maps illustration keys (from emergencies.js) → Lottie animation data */
const LOTTIE_MAP = {
  HandPlacementInfant: infantCpr,
  HandPlacementChild:  childCpr,
  BackBlowInfant:      chokingInfant,
  HeimlichChild:       chokingChild,
  RecoveryPosition:    recoveryPosition,
  BleedingPressure:    bleeding,
  ElectricShock:       electricShock,
  BurnCooling:         burnCooling,
  PoisoningPill:       poisoning,
  FeverThermometer:    fever,
  BiteWound:           biteWound,
};

/**
 * LottieIllustration
 * @param {string}  illustrationKey  - key from LOTTIE_MAP
 * @param {boolean} slowMode         - if true, play at 0.4× speed
 * @param {number}  size             - width & height in px (default 280)
 */
export default function LottieIllustration({ illustrationKey, slowMode = false, size = 280 }) {
  const animData = LOTTIE_MAP[illustrationKey];
  if (!animData) return null;

  return (
    <Lottie
      animationData={animData}
      loop
      autoplay
      speed={slowMode ? 0.4 : 1}
      style={{ width: size, height: size }}
      aria-label={illustrationKey}
    />
  );
}

/** Convenience: check if we have a Lottie for a given key */
export function hasLottie(illustrationKey) {
  return Boolean(LOTTIE_MAP[illustrationKey]);
}
