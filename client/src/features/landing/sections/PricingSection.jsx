import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReveal } from '../../../hooks/useReveal';

const PLANS = [
  {
    id: 'seedling',
    name: 'Seedling',
    tagline: 'Free to start. Forever.',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Start for free',
    features: [
      'Dr. Bloom (10 questions/week)',
      'Weekly development letters',
      'Growth tracking (WHO charts)',
      'IAP vaccination schedule',
      '1 child profile',
      'English only',
    ],
    featured: false,
  },
  {
    id: 'pro',
    name: 'Bloom Pro',
    tagline: 'For parents who want more.',
    monthlyPrice: 299,
    annualPrice: 2499,
    annualNote: '2 months free',
    cta: 'Start Bloom Pro',
    features: [
      'Unlimited Dr. Bloom',
      'Voice input & output',
      'Indian food tracker',
      'Parent weekly check-in',
      '3 Indian languages',
      'Priority support',
    ],
    featured: true,
  },
  {
    id: 'family',
    name: 'Bloom Family',
    tagline: 'For growing families.',
    monthlyPrice: 499,
    annualPrice: 3999,
    annualNote: '2 months free',
    cta: 'Start Bloom Family',
    features: [
      'Everything in Bloom Pro',
      'Up to 4 child profiles',
      'Grandparent view access',
      'Year-end memory book PDF',
      'WhatsApp reminders',
      'Early access to new features',
    ],
    featured: false,
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const ref = useReveal();

  return (
    <section id="pricing" className="py-24 px-5" style={{ backgroundColor: '#F7F4EF' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div ref={ref} className="reveal text-center mb-12">
          <p
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#1D9E75', letterSpacing: '0.15em' }}
          >
            No surprises.
          </p>
          <h2
            className="font-serif mb-8"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#2A1C15',
              lineHeight: 1.15,
            }}
          >
            Simple, honest pricing.
          </h2>

          {/* Annual/Monthly toggle */}
          <div className="inline-flex items-center rounded-full p-1" style={{ backgroundColor: '#E8C4B8', gap: 2 }}>
            {['Monthly', 'Annual'].map((label) => {
              const active = (label === 'Annual') === isAnnual;
              return (
                <button
                  key={label}
                  onClick={() => setIsAnnual(label === 'Annual')}
                  className="font-sans text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: active ? 'white' : 'transparent',
                    color: active ? '#2A1C15' : '#3D2B23',
                    opacity: active ? 1 : 0.6,
                    boxShadow: active ? '0 1px 4px rgba(61,43,35,0.1)' : 'none',
                  }}
                >
                  {label}
                  {label === 'Annual' && (
                    <span
                      className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#1D9E75', color: 'white', fontSize: '0.625rem' }}
                    >
                      SAVE 30%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} isAnnual={isAnnual} onCta={() => navigate('/auth')} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, isAnnual, onCta, delay }) {
  const ref = useReveal();
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const isFree = price === 0;

  return (
    <div
      ref={ref}
      className="reveal rounded-3xl p-7 flex flex-col"
      style={{
        animationDelay: `${delay}ms`,
        backgroundColor: plan.featured ? '#2A1C15' : 'white',
        border: plan.featured ? 'none' : '1px solid rgba(232,196,184,0.5)',
        boxShadow: plan.featured ? '0 16px 48px rgba(29,158,117,0.15)' : '0 2px 12px rgba(61,43,35,0.05)',
        position: 'relative',
      }}
    >
      {/* Most popular badge */}
      {plan.featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 font-sans text-xs font-semibold px-4 py-1.5 rounded-full"
          style={{ backgroundColor: '#1D9E75', color: 'white', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
        >
          Most popular
        </div>
      )}

      {/* Plan name */}
      <div className="mb-6">
        <p
          className="font-sans text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: plan.featured ? 'rgba(255,255,255,0.5)' : '#1D9E75', letterSpacing: '0.1em' }}
        >
          {plan.name}
        </p>
        <p
          className="font-sans"
          style={{ fontSize: '0.9rem', color: plan.featured ? 'rgba(255,255,255,0.6)' : '#3D2B23', opacity: plan.featured ? 1 : 0.65 }}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mb-8">
        <div className="flex items-end gap-1">
          {isFree ? (
            <span
              className="font-serif"
              style={{ fontSize: '2.75rem', fontWeight: 700, color: plan.featured ? '#fff' : '#2A1C15', lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              Free
            </span>
          ) : (
            <>
              <span
                className="font-sans font-semibold"
                style={{ fontSize: '1.125rem', color: plan.featured ? 'rgba(255,255,255,0.6)' : '#3D2B23', opacity: 0.7, marginBottom: 4 }}
              >
                ₹
              </span>
              <span
                className="font-serif"
                style={{ fontSize: '2.75rem', fontWeight: 700, color: plan.featured ? '#fff' : '#2A1C15', lineHeight: 1, letterSpacing: '-0.03em' }}
              >
                {price.toLocaleString('en-IN')}
              </span>
              <span
                className="font-sans mb-1.5"
                style={{ fontSize: '0.875rem', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#3D2B23', opacity: 0.6 }}
              >
                /{isAnnual ? 'year' : 'mo'}
              </span>
            </>
          )}
        </div>
        {isAnnual && plan.annualNote && (
          <p
            className="font-sans text-xs mt-1 font-medium"
            style={{ color: plan.featured ? '#1D9E75' : '#1D9E75' }}
          >
            {plan.annualNote}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <div
              className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
              style={{
                width: 16,
                height: 16,
                backgroundColor: plan.featured ? 'rgba(29,158,117,0.3)' : 'rgba(29,158,117,0.1)',
              }}
            >
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                <path
                  d="M1 3.5L3 5.5L7 1"
                  stroke={plan.featured ? '#3DD68C' : '#1D9E75'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="font-sans"
              style={{
                fontSize: '0.875rem',
                color: plan.featured ? 'rgba(255,255,255,0.8)' : '#3D2B23',
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onCta}
        className="w-full font-sans font-semibold py-3.5 rounded-2xl transition-all duration-200"
        style={{
          backgroundColor: plan.featured ? '#1D9E75' : '#2A1C15',
          color: 'white',
          fontSize: '0.9375rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = plan.featured ? '#0F6E56' : '#1a1a18';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = plan.featured ? '#1D9E75' : '#2A1C15';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {plan.cta}
      </button>
    </div>
  );
}
