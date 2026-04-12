import { useNavigate } from 'react-router-dom';
import { LogoWordmark } from '../../components/ui/LogoMark';

const NAV = [
  { label: 'Features', anchor: 'features' },
  { label: 'How it works', anchor: 'how' },
  { label: 'Pricing', anchor: 'pricing' },
  { label: 'Privacy', path: '/privacy' },
];

export default function LandingFooter() {
  const navigate = useNavigate();

  const handle = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="py-8 px-5"
      style={{
        backgroundColor: '#F7F4EF',
        borderTop: '1px solid rgba(232,196,184,0.5)',
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <LogoWordmark iconSize={28} />

        <div className="flex items-center gap-6">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => handle(item)}
              className="font-sans text-sm transition-opacity duration-200"
              style={{ color: '#3D2B23', opacity: 0.5 }}
              onMouseEnter={(e) => (e.target.style.opacity = 0.9)}
              onMouseLeave={(e) => (e.target.style.opacity = 0.5)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p
          className="font-sans text-sm"
          style={{ color: '#3D2B23', opacity: 0.4 }}
        >
          Made with care in India.
        </p>
      </div>
    </footer>
  );
}
