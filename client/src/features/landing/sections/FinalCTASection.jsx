import { useNavigate } from 'react-router-dom';
import { useReveal } from '../../../hooks/useReveal';

export default function FinalCTASection() {
  const navigate = useNavigate();
  const ref = useReveal();

  return (
    <section
      className="py-28 px-5 relative overflow-hidden"
      style={{ backgroundColor: '#1D9E75' }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div ref={ref} className="reveal relative z-10 text-center max-w-xl mx-auto">
        <h2
          className="font-serif mb-8"
          style={{
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'white',
            lineHeight: 1.1,
          }}
        >
          Your child's story{' '}
          <em style={{ fontStyle: 'italic' }}>starts this week.</em>
        </h2>

        <button
          onClick={() => navigate('/auth')}
          className="font-sans font-semibold px-10 py-4 rounded-full transition-all duration-200"
          style={{
            backgroundColor: 'white',
            color: '#1D9E75',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F7F4EF';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Start for free — no credit card
        </button>
      </div>
    </section>
  );
}
