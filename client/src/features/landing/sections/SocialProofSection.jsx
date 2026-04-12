import { useReveal } from '../../../hooks/useReveal';

const QUOTES = [
  {
    quote:
      'I was up at 3am worried about Arjun\'s feeding schedule. Dr. Bloom answered in Malayalam and told me exactly what to expect. I cried with relief.',
    name: 'Anjali M.',
    location: 'Thrissur, Kerala',
    child: 'Arjun, 6 weeks old',
    initials: 'AM',
  },
  {
    quote:
      'The food tracker had ragi kanji as the first suggestion for 6 months. That\'s when I knew someone who actually knew Indian babies built this.',
    name: 'Priya R.',
    location: 'Chennai, Tamil Nadu',
    child: 'Kavya, 8 months old',
    initials: 'PR',
  },
  {
    quote:
      'Zara was waking every 45 minutes. I typed it into Dr. Bloom at midnight and got a calm, thorough explanation. No panic. Just answers.',
    name: 'Rohan K.',
    location: 'Bengaluru, Karnataka',
    child: 'Zara, 4 months old',
    initials: 'RK',
  },
];

const STATS = [
  { value: '4.9★', label: 'rating' },
  { value: '12k+', label: 'families' },
  { value: '3', label: 'languages' },
  { value: '0', label: 'unanswered questions' },
];

export default function SocialProofSection() {
  const ref = useReveal();

  return (
    <section className="py-24 px-5" style={{ backgroundColor: '#F0ECE6' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={ref} className="reveal text-center mb-16">
          <p
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#1D9E75', letterSpacing: '0.15em' }}
          >
            No surprises.
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#2A1C15',
              lineHeight: 1.15,
            }}
          >
            Parents who feel seen.
          </h2>
        </div>

        {/* Quote cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {QUOTES.map((q, i) => (
            <QuoteCard key={q.name} quote={q} delay={i * 100} />
          ))}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 rounded-3xl overflow-hidden"
          style={{ border: '1px solid rgba(232,196,184,0.6)' }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center py-8 px-4"
              style={{
                backgroundColor: 'white',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(232,196,184,0.6)' : 'none',
              }}
            >
              <span
                className="font-serif mb-1"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#2A1C15',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.value}
              </span>
              <span
                className="font-sans text-center"
                style={{ fontSize: '0.8125rem', color: '#3D2B23', opacity: 0.5, fontWeight: 500 }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ quote, delay }) {
  const ref = useReveal();

  return (
    <div
      ref={ref}
      className="reveal rounded-3xl p-7 flex flex-col gap-5"
      style={{
        animationDelay: `${delay}ms`,
        backgroundColor: 'white',
        border: '1px solid rgba(232,196,184,0.4)',
        boxShadow: '0 2px 16px rgba(61,43,35,0.05)',
      }}
    >
      <p
        className="font-serif"
        style={{
          fontSize: '1.0625rem',
          fontStyle: 'italic',
          lineHeight: 1.7,
          color: '#2A1C15',
          opacity: 0.9,
          flex: 1,
        }}
      >
        "{quote.quote}"
      </p>
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(232,196,184,0.4)' }}>
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full font-sans font-semibold shrink-0"
          style={{
            width: 38,
            height: 38,
            backgroundColor: 'rgba(29,158,117,0.12)',
            color: '#1D9E75',
            fontSize: '0.75rem',
          }}
        >
          {quote.initials}
        </div>
        <div>
          <p className="font-sans font-semibold" style={{ fontSize: '0.875rem', color: '#2A1C15', lineHeight: 1.3 }}>
            {quote.name}
          </p>
          <p className="font-sans" style={{ fontSize: '0.75rem', color: '#3D2B23', opacity: 0.5 }}>
            {quote.location} · {quote.child}
          </p>
        </div>
      </div>
    </div>
  );
}
