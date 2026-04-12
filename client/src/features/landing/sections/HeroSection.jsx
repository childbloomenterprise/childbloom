import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-16 overflow-hidden"
      style={{ backgroundColor: '#F7F4EF' }}
    >
      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(29,158,117,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          animation: 'grid-drift 14s ease-in-out infinite',
        }}
      />

      {/* Soft radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto stagger-children">
        {/* Eyebrow */}
        <p
          className="font-sans text-xs font-semibold tracking-widest uppercase mb-8"
          style={{ color: '#1D9E75', letterSpacing: '0.15em' }}
        >
          AI child development companion
        </p>

        {/* Headline */}
        <h1
          className="font-serif mb-6"
          style={{
            fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#2A1C15',
            fontWeight: 700,
          }}
        >
          Your child grows.
          <br />
          <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>You bloom too.</em>
        </h1>

        {/* Subhead */}
        <p
          className="font-sans mx-auto mb-10"
          style={{
            fontSize: '1.125rem',
            lineHeight: 1.65,
            color: '#3D2B23',
            opacity: 0.75,
            maxWidth: '480px',
          }}
        >
          The companion that helps Indian parents feel calm, confident, and connected — from pregnancy to age 7.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={() => navigate('/auth')}
            className="font-sans font-semibold px-8 py-4 rounded-full transition-all duration-200 w-full sm:w-auto"
            style={{ backgroundColor: '#2A1C15', color: '#F7F4EF', fontSize: '1rem' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a1a18'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2A1C15'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Start for free
          </button>
          <button
            onClick={() => scrollTo('how')}
            className="font-sans font-semibold px-8 py-4 rounded-full transition-all duration-200 w-full sm:w-auto"
            style={{
              backgroundColor: 'transparent',
              color: '#2A1C15',
              fontSize: '1rem',
              border: '1.5px solid rgba(42,28,21,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(42,28,21,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(42,28,21,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            See how it works
          </button>
        </div>

        {/* Trust micro-copy */}
        <p
          className="font-sans text-xs"
          style={{ color: '#3D2B23', opacity: 0.45, letterSpacing: '0.02em' }}
        >
          Free to start · No credit card · WHO · IAP · AAP · Malayalam · Tamil
        </p>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #F7F4EF)',
        }}
      />
    </section>
  );
}
