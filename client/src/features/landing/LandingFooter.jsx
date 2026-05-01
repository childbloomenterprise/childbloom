import { useNavigate } from 'react-router-dom';
import { LogoWordmark } from '../../components/ui/LogoMark';

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '/privacy', isRoute: true },
];

/** E-E-A-T trust signals - tells Google this is expert health content */
const TRUST_BADGES = [
  { icon: '🏥', text: 'Guided by WHO guidelines' },
  { icon: '💉', text: 'IAP vaccination schedule' },
  { icon: '🔒', text: 'Data never sold' },
  { icon: '🇮🇳', text: 'Built for India' },
];

export default function LandingFooter() {
  const navigate = useNavigate();

  const handleClick = (e, item) => {
    if (item.isRoute) {
      e.preventDefault();
      navigate(item.href);
    } else {
      e.preventDefault();
      document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="px-5"
      style={{
        backgroundColor: '#F7F4EF',
        borderTop: '1px solid rgba(232,196,184,0.5)',
      }}
    >
      {/* E-E-A-T trust bar */}
      <div
        className="py-4"
        style={{ borderBottom: '1px solid rgba(232,196,184,0.35)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {TRUST_BADGES.map(({ icon, text }) => (
            <span
              key={text}
              className="flex items-center gap-1.5 font-sans text-xs font-medium"
              style={{ color: '#3D2B23', opacity: 0.65 }}
            >
              <span aria-hidden="true">{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Main footer row */}
      <div className="py-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <LogoWordmark iconSize={28} />

        <nav aria-label="Footer navigation">
          <div className="flex items-center gap-6">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleClick(e, item)}
                className="font-sans text-sm transition-opacity duration-200"
                style={{ color: '#3D2B23', opacity: 0.5, textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <p
          className="font-sans text-xs"
          style={{ color: '#3D2B23', opacity: 0.35 }}
        >
          {`© ${new Date().getFullYear()} ChildBloom · Made with care in India.`}
          <br />
          <span style={{ fontSize: '0.7rem' }}>
            Content is for informational purposes only — not a substitute for professional medical advice.
          </span>
        </p>
      </div>
    </footer>
  );
}
