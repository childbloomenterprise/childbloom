import { useNavigate, useLocation } from 'react-router-dom';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from './CBIcon';
import CBLogoMark from './CBLogoMark';
import { T } from './tokens';

export default function CBTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const child = useSelectedChild();
  const childId = child?.id;
  const session = useAuthStore((s) => s.session);

  const timelinePath = childId ? `/child/${childId}/updates` : (session ? '/dashboard' : '/auth');
  const carePath     = '/care';
  const profilePath  = session ? '/settings' : '/auth';

  const tabs = [
    { id: 'home',     label: 'Home',     icon: 'home',        path: '/dashboard' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline',    path: timelinePath },
    { id: 'bloom',    label: 'Bloom AI', icon: null,          path: '/ask', center: true },
    { id: 'care',     label: 'Care',     icon: 'care',        path: carePath },
    { id: 'profile',  label: 'You',      icon: 'user',        path: profilePath },
  ];

  function getActive() {
    const p = location.pathname;
    if (p === '/dashboard' || p === '/') return 'home';
    if (p.includes('/updates') || p.includes('/weekly-update')) return 'timeline';
    if (p === '/ask') return 'bloom';
    if (p.includes('/health') || p.includes('/vaccinations') || p.startsWith('/emergency')) return 'care';
    if (p === '/settings') return 'profile';
    return '';
  }

  const active = getActive();

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
      padding: `0 16px max(env(safe-area-inset-bottom, 12px), 12px)`,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: T.surface,
        borderRadius: 24,
        boxShadow: '0 8px 24px rgba(11,23,20,0.08), 0 32px 64px rgba(11,23,20,0.06), 0 0 0 1px rgba(11,23,20,0.05)',
        padding: '8px 6px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          if (tab.center) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                style={{
                  width: 52, height: 52, borderRadius: 999,
                  background: isActive ? T.brandDark || '#0e3320' : T.brand,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -24,
                  boxShadow: isActive
                    ? '0 4px 20px rgba(15,61,46,0.55), 0 0 0 3px rgba(15,61,46,0.15)'
                    : '0 4px 16px rgba(15,61,46,0.45)',
                  flexShrink: 0,
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onTouchEnd={e => e.currentTarget.style.transform = isActive ? 'scale(1.08)' : 'scale(1)'}
              >
                <CBLogoMark size={22} color="#fff" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 10px', minWidth: 56,
                color: isActive ? T.brand : T.ink300,
                transition: 'color 0.2s ease, transform 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2,
                  background: T.brand, animation: 'scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
                }} />
              )}
              <div style={{ transform: isActive ? 'scale(1.12)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <CBIcon name={tab.icon} size={22} stroke={isActive ? 2.2 : 1.6} />
              </div>
              <span style={{
                fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                fontSize: 10, fontWeight: isActive ? 700 : 600, letterSpacing: '-0.005em',
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
