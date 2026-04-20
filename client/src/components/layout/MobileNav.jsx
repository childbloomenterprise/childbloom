import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { LayoutDashboard, TrendingUp, MessageCircle, MoreHorizontal, Plus, Clipboard, Apple, HeartPulse, CheckSquare, X } from 'lucide-react';

export default function MobileNav() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const childId = child?.id;

  const guardedNavigate = (path) => {
    closeAll();
    if (!session) { setShowGuestPrompt(true); return; }
    navigate(path);
  };

  const navItems = [
    { id: 'dashboard', to: '/dashboard',                                       icon: <LayoutDashboard size={20} />, label: t('nav.home') },
    { id: 'ask',       to: '/ask',                                             icon: <MessageCircle size={20} />,   label: 'Dr. Bloom' },
    { id: 'fab',       fab: true },
    { id: 'growth',    to: childId ? `/child/${childId}/growth` : '/dashboard', icon: <TrendingUp size={20} />,     label: t('nav.growth') },
    { id: 'more',      action: () => { setMoreDrawerOpen(true); },             icon: <MoreHorizontal size={20} />,  label: 'More' },
  ];

  const logActions = [
    { icon: <Clipboard size={18} />,  label: 'Weekly check-in', path: `/child/${childId}/weekly-update` },
    { icon: <TrendingUp size={18} />, label: 'Log measurement',  path: `/child/${childId}/growth` },
    { icon: <Apple size={18} />,      label: 'Log meal',          path: `/child/${childId}/food` },
    { icon: <HeartPulse size={18} />, label: 'Health record',    path: `/child/${childId}/health` },
  ];

  const moreActions = [
    { label: 'Development Index',    path: `/child/${childId}/development` },
    { label: t('nav.guides'),        path: '/guides' },
    { label: 'Health records',       path: `/child/${childId}/health` },
    { label: 'Update history',       path: `/child/${childId}/updates` },
    { label: t('nav.settings'),      path: '/settings' },
  ];

  const closeAll = () => { setLogDrawerOpen(false); setMoreDrawerOpen(false); };

  return (
    <>
      {/* Backdrop */}
      {(logDrawerOpen || moreDrawerOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={closeAll}
        />
      )}

      {/* Log drawer */}
      {logDrawerOpen && (
        <div
          className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(247,244,239,0.97)', border: '1px solid rgba(255,255,255,0.7)' }}
        >
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-forest-700">What would you like to log?</p>
            <button onClick={() => setLogDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2 pb-4">
            {logActions.map((action) => (
              <button
                key={action.label}
                onClick={() => guardedNavigate(action.path)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cream-200 hover:border-forest-300 hover:bg-forest-50/30 transition-all duration-200 text-left"
              >
                <span className="text-forest-600">{action.icon}</span>
                <span className="text-sm font-medium text-forest-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More drawer */}
      {moreDrawerOpen && (
        <div
          className="fixed bottom-[88px] right-4 z-50 w-48 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(247,244,239,0.97)', border: '1px solid rgba(255,255,255,0.7)' }}
        >
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">More</p>
          </div>
          <div className="p-2 pb-3 space-y-0.5">
            {moreActions.map((action) => (
              <button
                key={action.label}
                onClick={() => guardedNavigate(action.path)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
      >
        <div
          className="flex items-center gap-1 px-3 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl w-[calc(100%-2rem)] max-w-xs justify-between"
          style={{
            background: 'rgba(232, 196, 184, 0.70)',
            borderColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 32px rgba(61,43,35,0.12), 0 2px 8px rgba(61,43,35,0.07)',
          }}
        >
          {navItems.map((item) => {
            if (item.fab) {
              return (
                <button
                  key="fab"
                  onClick={() => { setMoreDrawerOpen(false); setLogDrawerOpen((v) => !v); }}
                  className="relative flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 hover:scale-105 shadow-lg"
                  style={{
                    width: '52px',
                    height: '52px',
                    background: logDrawerOpen
                      ? 'linear-gradient(135deg, #1B4332 0%, #0f2d1e 100%)'
                      : 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.40)',
                    marginTop: '-16px',
                  }}
                  aria-label="Log something"
                >
                  <Plus
                    size={22}
                    className="text-white transition-transform duration-200"
                    style={{ transform: logDrawerOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  />
                </button>
              );
            }

            if (item.action) {
              return (
                <button
                  key={item.id}
                  onClick={() => { setLogDrawerOpen(false); item.action(); }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200"
                  style={{ minWidth: '52px' }}
                >
                  <span style={{ color: moreDrawerOpen ? '#8FBAC8' : 'rgba(61,43,35,0.55)' }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px]" style={{ color: moreDrawerOpen ? '#8FBAC8' : 'rgba(61,43,35,0.45)' }}>
                    {item.label}
                  </span>
                </button>
              );
            }

            {/* Dashboard is public; all other nav items require auth */}
            if (item.id === 'dashboard') {
              return (
                <NavLink key={item.id} to={item.to} onClick={closeAll} style={{ minWidth: '52px' }}>
                  {({ isActive }) => (
                    <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200">
                      <span style={{ color: isActive ? '#2D6A4F' : 'rgba(61,43,35,0.55)', transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }}>{item.icon}</span>
                      <span className="text-[10px] font-medium" style={{ color: isActive ? '#2D6A4F' : 'rgba(61,43,35,0.45)' }}>{item.label}</span>
                    </div>
                  )}
                </NavLink>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => guardedNavigate(item.to)}
                style={{ minWidth: '52px' }}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200"
              >
                <span style={{ color: 'rgba(61,43,35,0.55)', transition: 'all 0.2s' }}>{item.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: 'rgba(61,43,35,0.45)' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Guest sign-in prompt */}
      {showGuestPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pb-28 px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGuestPrompt(false)} />
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: '#f7f4ef', border: '1px solid rgba(255,255,255,0.7)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#1C5628' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <p className="font-serif font-semibold text-forest-700" style={{ fontSize: 16 }}>Sign in to continue</p>
                <p className="text-xs text-gray-400">Track your baby's growth & milestones</p>
              </div>
              <button onClick={() => setShowGuestPrompt(false)} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowGuestPrompt(false); navigate('/auth'); }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: '#1C5628' }}
              >
                Create free account
              </button>
              <button
                onClick={() => { setShowGuestPrompt(false); navigate('/auth'); }}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-200"
                style={{ background: 'rgba(28,86,40,0.08)', color: '#1C5628' }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
