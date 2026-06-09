// CBTabBar — iOS-style bottom navigation with fluid scroll behaviour.
//
// Scroll physics:
//   • Scrolling down  → dock sinks below the screen (translateY + opacity fade)
//                       using a fast ease-in  — like water pulling it down.
//   • Scrolling up    → dock surfaces with a spring bounce
//                       using cubic-bezier(0.34,1.56,0.64,1) — like water rising.
//   • Idle 1.4s       → dock floats back regardless of direction.
//   • At page top     → always fully visible, no hide.
//
// Mobile optimisations:
//   • env(safe-area-inset-bottom) on the outer container.
//   • All tap targets ≥ 44 × 44 px.
//   • WebkitTapHighlightColor: transparent on every button.
//   • Pointer-events: none on outer div so backdrop doesn't intercept taps.

import { useNavigate, useLocation } from 'react-router-dom';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from './CBIcon';
import CBLogoMark from './CBLogoMark';
import { T } from './tokens';
import { useScrollVisibility } from '../../hooks/useScrollVisibility';
import useUiStore from '../../stores/uiStore';

export default function CBTabBar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const child     = useSelectedChild();
  const childId   = child?.id;
  const session   = useAuthStore((s) => s.session);
  const { visible: scrollVisible, atTop } = useScrollVisibility();

  // Hide the dock entirely while a modal/bottom-sheet is open. The dock is a
  // sibling of the page in AppLayout and PageTransition wraps each page in a
  // stacking context, so otherwise the dock paints OVER the sheet and covers
  // its Save button (the classic "have to scroll to save" bug).
  const modalOpen = useUiStore((s) => s.modalCount > 0);
  const visible = scrollVisible && !modalOpen;

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
    if (
      p === '/care' ||
      p.includes('/health') ||
      p.includes('/vaccinations') ||
      p.includes('/bloom') ||
      p === '/achievements' ||
      p.startsWith('/emergency')
    ) return 'care';
    if (p === '/settings' || p === '/family') return 'profile';
    return '';
  }

  const active = getActive();

  // ── Fluid dock animation values ────────────────────────────────────────
  // Hide: fast ease-in (water pulling it down)
  // Show: spring overshoot (water rising back up)
  const hideTransition = 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.22s ease';
  const showTransition = 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1), opacity 0.32s ease';

  const transform = visible
    ? 'translateY(0) scale(1)'
    : 'translateY(calc(100% + 20px)) scale(0.97)';

  const opacity = visible ? 1 : 0;

  return (
    // Outer: fixed positioned, pointer-events:none so backdrop never intercepts
    <div style={{
      position: 'fixed',
      left: 0, right: 0, bottom: 0,
      zIndex: 100,
      // Safe-area bottom padding — correct for notch phones, home-indicator
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 16, paddingRight: 16,
      paddingTop: 8,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
      // Fluid motion
      transform,
      opacity,
      transition: visible ? showTransition : hideTransition,
      willChange: 'transform, opacity',
    }}>
      {/* Inner pill */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: T.surface,
        borderRadius: 24,
        // Layered shadow — more depth when fully visible, less when surfacing
        boxShadow: visible
          ? '0 8px 24px rgba(11,23,20,0.10), 0 32px 64px rgba(11,23,20,0.07), 0 0 0 1px rgba(11,23,20,0.05)'
          : '0 4px 12px rgba(11,23,20,0.06)',
        padding: '6px 6px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        pointerEvents: 'auto',
        // Very slight glass blur — gives "floating on water" depth
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'box-shadow 0.3s ease',
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          if (tab.center) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                style={{
                  width: 52, height: 52, borderRadius: 999,
                  background: isActive ? T.brandDark || '#0e3320' : T.brand,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22,
                  boxShadow: isActive
                    ? '0 4px 20px rgba(15,61,46,0.55), 0 0 0 3px rgba(15,61,46,0.15)'
                    : '0 4px 16px rgba(15,61,46,0.45)',
                  flexShrink: 0,
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                  // Large touch target
                  minWidth: 52, minHeight: 52,
                }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)'; try { navigator.vibrate?.(6); } catch(_){} }}
                onTouchEnd={e => { e.currentTarget.style.transform = isActive ? 'scale(1.08)' : 'scale(1)'; }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e => e.currentTarget.style.transform = isActive ? 'scale(1.08)' : 'scale(1)'}
              >
                <CBLogoMark size={22} color="#fff" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                // Minimum 44×44 touch target (iOS HIG)
                padding: '8px 10px', minWidth: 56, minHeight: 44,
                color: isActive ? T.brand : T.ink300,
                transition: 'color 0.2s ease, transform 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.88)'; try { navigator.vibrate?.(4); } catch(_){} }}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2,
                  background: T.brand,
                  animation: 'scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
                }} />
              )}
              <div style={{
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
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
