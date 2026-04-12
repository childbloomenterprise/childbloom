import { useReveal } from '../../../hooks/useReveal';

const STEPS = [
  {
    num: '01',
    title: 'Add your child',
    desc: 'Tell us your child\'s name and birthday — or your pregnancy week. That\'s it. You\'re in.',
  },
  {
    num: '02',
    title: 'Get your first weekly letter',
    desc: 'Every week, a personal letter arrives. What\'s happening in their brain. What you can do. What\'s coming next.',
  },
  {
    num: '03',
    title: 'Ask Dr. Bloom anything',
    desc: 'A 3am worry. A feeding question. A milestone you\'re not sure about. Dr. Bloom answers — calmly, in your language.',
  },
  {
    num: '04',
    title: 'Watch them grow',
    desc: 'Growth charts. Vaccine logs. Meal records. Every week, a richer picture of your child\'s journey.',
  },
];

export default function HowItWorksSection() {
  const ref = useReveal();

  return (
    <section id="how" style={{ backgroundColor: '#1a1a18' }} className="py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={ref} className="reveal text-center mb-20">
          <p
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#1D9E75', letterSpacing: '0.15em' }}
          >
            Three minutes to start
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#F7F4EF',
              lineHeight: 1.1,
            }}
          >
            understands us.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {STEPS.map((step, i) => (
            <StepItem key={step.num} step={step} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepItem({ step, delay }) {
  const ref = useReveal();

  return (
    <div ref={ref} className="reveal flex flex-col" style={{ animationDelay: `${delay}ms` }}>
      {/* Giant numeral */}
      <div
        className="font-serif mb-4 select-none"
        style={{
          fontSize: '5rem',
          fontWeight: 800,
          lineHeight: 1,
          color: '#F7F4EF',
          opacity: 0.08,
          letterSpacing: '-0.04em',
        }}
      >
        {step.num}
      </div>
      {/* Step title */}
      <h3
        className="font-serif mb-3"
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#F7F4EF',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {step.title}
      </h3>
      {/* Description */}
      <p
        className="font-sans"
        style={{
          fontSize: '0.9375rem',
          lineHeight: 1.65,
          color: '#F7F4EF',
          opacity: 0.5,
        }}
      >
        {step.desc}
      </p>
    </div>
  );
}
