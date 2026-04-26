import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SEVERITY = {
  critical: {
    key: 'emergency.critical',
    bg: 'rgba(220,38,38,0.10)',
    border: 'rgba(220,38,38,0.30)',
    badge: '#DC2626',
    badgeBg: 'rgba(220,38,38,0.12)',
    dot: '#DC2626',
  },
  urgent: {
    key: 'emergency.urgent',
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.30)',
    badge: '#B45309',
    badgeBg: 'rgba(217,119,6,0.12)',
    dot: '#D97706',
  },
  manageable: {
    key: 'emergency.manageable',
    bg: 'rgba(22,101,52,0.07)',
    border: 'rgba(22,101,52,0.20)',
    badge: '#166534',
    badgeBg: 'rgba(22,101,52,0.10)',
    dot: '#16A34A',
  },
};

const SECTIONS = [
  {
    id: 'infantCpr',
    severity: 'critical',
    titleKey: 'emergency.infantCpr',
    steps: [
      'Lay infant on a firm, flat surface.',
      'Place 2 fingers on the center of the chest, just below the nipple line.',
      'Push down about 4 cm (1.5 inches) — hard and fast.',
      'Give 30 chest compressions at a rate of 100–120 per minute.',
      'Tilt head back gently, lift chin, and give 2 small puffs — just enough to see the chest rise.',
      'Repeat: 30 compressions → 2 breaths. Continue until help arrives.',
    ],
  },
  {
    id: 'childCpr',
    severity: 'critical',
    titleKey: 'emergency.childCpr',
    steps: [
      'Lay child flat on their back.',
      'Place the heel of one hand on the center of the chest (lower half of breastbone).',
      'Push down about 5 cm (2 inches) — hard and fast.',
      'Give 30 chest compressions at 100–120 per minute.',
      'Tilt head back, lift chin, seal your mouth over theirs, give 2 rescue breaths.',
      'Repeat: 30 compressions → 2 breaths. Do not stop until help arrives.',
    ],
  },
  {
    id: 'chokingInfant',
    severity: 'critical',
    titleKey: 'emergency.chokingInfant',
    steps: [
      'Hold infant face-down on your forearm, head lower than chest.',
      'Give 5 firm back blows between shoulder blades with the heel of your hand.',
      'Flip infant face-up. Give 5 chest thrusts with 2 fingers on center of chest.',
      'Look in the mouth — remove object ONLY if you can clearly see it.',
      'Repeat back blows and chest thrusts until object is out or infant loses consciousness.',
      'If unconscious, begin infant CPR and call 112 immediately.',
    ],
  },
  {
    id: 'chokingChild',
    severity: 'critical',
    titleKey: 'emergency.chokingChild',
    steps: [
      'Kneel or stand behind the child.',
      'Give 5 back blows between shoulder blades with the heel of your hand.',
      'If ineffective: make a fist, place just above the navel, grasp with other hand.',
      'Give 5 firm upward abdominal thrusts (Heimlich maneuver).',
      'Alternate 5 back blows and 5 abdominal thrusts.',
      'If child becomes unconscious, start child CPR and call 112.',
    ],
  },
  {
    id: 'fever',
    severity: 'urgent',
    titleKey: 'emergency.fever',
    steps: [
      'Call doctor immediately if: under 3 months with any fever, or any child with fever above 40°C (104°F).',
      'Also call if: fever lasts more than 3 days, child is very lethargic, has rash, stiff neck, or difficulty breathing.',
      'Give paracetamol (not aspirin) as per your doctor\'s dosing instructions.',
      'Dress child lightly — no bundling. Ensure good ventilation.',
      'Offer fluids frequently — breast milk, ORS, or water.',
      'Sponge with lukewarm (not cold) water if child is very uncomfortable.',
    ],
  },
  {
    id: 'allergicReaction',
    severity: 'critical',
    titleKey: 'emergency.allergicReaction',
    steps: [
      'Call 112 immediately for any sign of anaphylaxis.',
      'Signs: throat swelling, difficulty breathing, hives + vomiting, sudden drop in energy.',
      'If prescribed: use EpiPen into outer thigh — through clothing is fine.',
      'Lay child flat with legs raised (unless breathing is difficult — then sit upright).',
      'Stay with child. A second reaction can occur 4–8 hours later.',
      'After EpiPen use, go to hospital even if child seems better.',
    ],
  },
  {
    id: 'burns',
    severity: 'urgent',
    titleKey: 'emergency.burns',
    steps: [
      'Run cool (not cold) running water over the burn for 20 minutes.',
      'Do NOT use ice, butter, toothpaste, or any home remedy.',
      'Remove clothing and jewellery near the burn — unless stuck to skin.',
      'Cover loosely with a clean, non-fluffy cloth or cling film.',
      'Call 112 or go to hospital for: burns larger than a palm, burns on face/hands/genitals, deep burns, chemical/electrical burns.',
      'Keep child warm to prevent shock. Give sips of water if conscious.',
    ],
  },
  {
    id: 'seizure',
    severity: 'urgent',
    titleKey: 'emergency.seizure',
    steps: [
      'Stay calm. Most febrile seizures in children last under 2 minutes and are not dangerous.',
      'Lay child on their side (recovery position) on a soft, safe surface.',
      'Clear the area of hard or sharp objects.',
      'Do NOT put anything in the child\'s mouth. Do NOT hold them down.',
      'Time the seizure. Call 112 if: seizure lasts more than 5 minutes, child has difficulty breathing, or it is the first seizure ever.',
      'After seizure: child will be sleepy — let them rest. Call your doctor.',
    ],
  },
];

function AccordionCard({ section, isOpen, onToggle, t }) {
  const sev = SEVERITY[section.severity];
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isOpen ? sev.bg : 'rgba(255,255,255,0.85)',
        border: `1px solid ${isOpen ? sev.border : 'rgba(220,213,205,0.6)'}`,
        boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors duration-150"
        aria-expanded={isOpen}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: sev.dot }}
        />
        <span className="flex-1 text-sm font-semibold text-forest-700 leading-snug">
          {t(section.titleKey)}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: sev.badge, background: sev.badgeBg }}
          >
            {t(SEVERITY[section.severity].key)}
          </span>
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{
              color: '#8E8E93',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="w-full h-px mb-4" style={{ background: sev.border }} />
          <ol className="space-y-3">
            {section.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: sev.badgeBg, color: sev.badge }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function EmergencyGuidePage() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="pb-28">
      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{
          background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
          boxShadow: '0 4px 20px rgba(185,28,28,0.25)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-white leading-tight">
              {t('emergency.title')}
            </h1>
          </div>
        </div>
        <p className="text-sm text-red-100 leading-relaxed font-medium">
          {t('emergency.callFirst')}
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 mb-4">
        {Object.entries(SEVERITY).map(([key, sev]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: sev.dot }} />
            <span className="text-[11px] font-medium text-gray-500">{t(sev.key)}</span>
          </div>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="space-y-2.5">
        {SECTIONS.map((section) => (
          <AccordionCard
            key={section.id}
            section={section}
            isOpen={openId === section.id}
            onToggle={() => toggle(section.id)}
            t={t}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div
        className="mt-5 rounded-2xl p-4"
        style={{ background: 'rgba(247,244,239,0.8)', border: '1px solid rgba(220,213,205,0.5)' }}
      >
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          This guide is for first-aid reference only. Always follow the advice of your child's doctor and local emergency services.
        </p>
      </div>

      {/* Sticky call button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center lg:pl-72"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)', padding: '12px 16px max(env(safe-area-inset-bottom, 16px), 16px)' }}
      >
        <a
          href="tel:112"
          className="flex items-center justify-center gap-2.5 w-full max-w-sm rounded-2xl py-4 font-bold text-white text-base transition-all duration-150 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            boxShadow: '0 6px 24px rgba(220,38,38,0.40)',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {t('emergency.callEmergency')}
        </a>
      </div>
    </div>
  );
}
