import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelectedChild } from '../../hooks/useChild';
import CBIcon from './CBIcon';
import { T } from './tokens';

export default function CBTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const child = useSelectedChild();
  const childId = child?.id;

  const tabs = [
    { id: 'home',    icon: 'home',    iconF: 'home-fill',   label: 'Today',     path: '/dashboard' },
    { id: 'growth',  icon: 'chart',   iconF: 'chart-fill',  label: 'Growth',    path: childId ? `/child/${childId}/growth` : null },
    { id: 'ask',     icon: 'sparkle', iconF: 'sparkle',     label: 'Dr. Bloom', path: '/ask', center: true },
    { id: 'health',  icon: 'shield',  iconF: 'shield-fill', label: 'Health',    path: childId ? `/child/${childId}/vaccinations` : null },
    { id: 'profile', icon: 'user',    iconF: 'user',        label: 'Settings',  path: '/settings' },
  ];

  function activeTab() {
    const p = location.pathname;
    if (p === '/dashboard' || p === '/') return 'home';
    if (p.includes('/growth') || p.includes('/development')) return 'growth';
    if (p === '/ask') return 'ask';
    if (p.includes('/health') || p.includes('/vaccinations')) return 'health';
    if (p === '/settings') return 'profile';
    return 'home';
  }

  const active = activeTab();

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `0.5px solid ${T.ink100}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', padding: '8px 0 6px' }}>
        {tabs.map(t => {
          const isActive = active === t.id;
          const handleClick = () => {
            if (t.path) navigate(t.path);
          };

          if (t.center) {
            return (
              <button key={t.id} onClick={handleClick}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.forest700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CBIcon name={t.icon} size={18} stroke={2} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.forest700, letterSpacing: '-0.01em' }}>{t.label}</span>
              </button>
            );
          }

          return (
            <button key={t.id} onClick={handleClick}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px 4px', color: isActive ? T.forest600 : T.ink300 }}>
              <CBIcon name={isActive ? t.iconF : t.icon} size={22} stroke={isActive ? 0 : 1.7} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.01em' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* safe area spacer */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}
