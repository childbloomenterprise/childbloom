import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoWordmark } from '../../components/ui/LogoMark';

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(247,244,239,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(232,196,184,0.4)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <LogoWordmark iconSize={34} />
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', id: 'features' },
            { label: 'How it works', id: 'how' },
            { label: 'Pricing', id: 'pricing' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="font-sans text-sm font-medium transition-colors duration-200"
              style={{ color: '#3D2B23', opacity: 0.7 }}
              onMouseEnter={(e) => (e.target.style.opacity = 1)}
              onMouseLeave={(e) => (e.target.style.opacity = 0.7)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="font-sans text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200"
            style={{ color: '#3D2B23' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(232,196,184,0.4)')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="font-sans text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: '#2A1C15',
              color: '#F7F4EF',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a1a18')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2A1C15')}
          >
            Get started
          </button>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => navigate('/auth')}
          className="md:hidden font-sans text-sm font-semibold px-4 py-2 rounded-full"
          style={{ backgroundColor: '#2A1C15', color: '#F7F4EF' }}
        >
          Start free
        </button>
      </div>
    </nav>
  );
}
