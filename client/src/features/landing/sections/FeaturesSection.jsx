import { useReveal } from '../../../hooks/useReveal';

const FEATURES = [
  {
    num: '01',
    title: 'Dr. Bloom',
    emotion: 'always there',
    body: 'Your paediatrician, available at 3am. Ask anything — in English, Malayalam, or Tamil. She knows your child by name.',
  },
  {
    num: '02',
    title: 'Weekly letters',
    emotion: 'personal',
    body: 'Every week, a letter about what\'s happening in your child\'s world. Not a report. A letter, written for you.',
  },
  {
    num: '03',
    title: 'Growth tracking',
    emotion: 'reassuring',
    body: 'WHO-standard charts. Log weight and height in one tap. See exactly where your child stands — and feel calm about it.',
  },
  {
    num: '04',
    title: 'Indian food',
    emotion: 'familiar',
    body: 'Ragi kanji to dal khichdi. Every food your child\'s grandmother would approve. A database built for Indian kitchens.',
  },
  {
    num: '05',
    title: 'Vaccination',
    emotion: 'on time',
    body: 'IAP schedule, built in. A gentle reminder 7 days before every check-up. Never miss a vaccine again.',
  },
  {
    num: '06',
    title: 'Parent check-in',
    emotion: 'for you',
    body: 'Every week, we ask how you are. Not just how the baby is. Because a calm parent is the best thing for a growing child.',
    highlight: true,
  },
];

function FeatureCard({ num, title, emotion, body, highlight, delay }) {
  return (
    <div
      className="reveal rounded-3xl p-7 flex flex-col gap-3 transition-all duration-300"
      style={{
        animationDelay: `${delay}ms`,
        backgroundColor: highlight ? '#1D9E75' : 'white',
        border: highlight ? 'none' : '1px solid rgba(232,196,184,0.5)',
        boxShadow: highlight
          ? '0 8px 32px rgba(29,158,117,0.25)'
          : '0 2px 12px rgba(61,43,35,0.05)',
      }}
    >
      <span
        className="font-sans text-xs font-semibold tracking-widest"
        style={{ color: highlight ? 'rgba(255,255,255,0.65)' : '#1D9E75', letterSpacing: '0.12em' }}
      >
        {num}
      </span>
      <div>
        <h3
          className="font-serif"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: highlight ? '#fff' : '#2A1C15',
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
          }}
        >
          {title}{' '}
          <em
            style={{
              fontStyle: 'italic',
              fontWeight: 400,
              color: highlight ? 'rgba(255,255,255,0.8)' : '#3D2B23',
              opacity: 0.75,
            }}
          >
            — {emotion}
          </em>
        </h3>
      </div>
      <p
        className="font-sans"
        style={{
          fontSize: '0.9375rem',
          lineHeight: 1.65,
          color: highlight ? 'rgba(255,255,255,0.85)' : '#3D2B23',
          opacity: highlight ? 1 : 0.75,
        }}
      >
        {body}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  const ref = useReveal();

  return (
    <section id="features" className="py-24 px-5" style={{ backgroundColor: '#F7F4EF' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={ref} className="reveal text-center mb-16">
          <p
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#1D9E75', letterSpacing: '0.15em' }}
          >
            Finally, together
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#2A1C15',
              lineHeight: 1.1,
            }}
          >
            Everything a growing child needs.{' '}
            <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>And their parent.</em>
          </h2>
        </div>

        {/* Grid — 2 cols × 3 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.num} {...f} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
