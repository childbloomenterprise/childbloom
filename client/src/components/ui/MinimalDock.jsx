import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, TrendingUp, BookOpen, MessageCircle, Settings, ClipboardList, Utensils, HeartPulse, LogOut } from 'lucide-react';
import { LogoMark } from './LogoMark';

// Dock item — exact interaction from prompt, colors from 60/30/10 palette
function DockNavItem({ to, icon, label }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Icon button */}
          <div
            className={`
              relative flex items-center justify-center
              w-11 h-11 rounded-lg
              backdrop-blur-[2px]
              border
              transition-all duration-300 ease-out
              cursor-pointer
              ${(isHovered || isActive)
                ? 'scale-110 -translate-y-1'
                : 'hover:scale-105 hover:-translate-y-0.5'
              }
            `}
            style={{
              background: isActive
                ? 'rgba(143, 186, 200, 0.30)'        // 10% teal — active
                : isHovered
                  ? 'rgba(143, 186, 200, 0.18)'      // 10% teal faint — hover
                  : 'rgba(247, 244, 239, 0.55)',      // 60% cream — rest
              borderColor: isActive
                ? 'rgba(143, 186, 200, 0.55)'
                : isHovered
                  ? 'rgba(143, 186, 200, 0.35)'
                  : 'rgba(255, 255, 255, 0.75)',
              boxShadow: (isHovered || isActive)
                ? '0 4px 16px rgba(143,186,200,0.22)'
                : undefined,
              transitionProperty: 'box-shadow, transform, background, border-color',
            }}
          >
            <div
              className="transition-all duration-300"
              style={{
                color: isActive
                  ? '#8FBAC8'                        // 10% teal — active icon
                  : isHovered
                    ? '#7AAEC0'
                    : 'rgba(61, 43, 35, 0.55)',       // dark brown muted — rest
                transform: (isHovered || isActive) ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {icon}
            </div>
          </div>

          {/* Tooltip — right side for vertical dock */}
          <div
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-normal whitespace-nowrap pointer-events-none z-50 transition-all duration-200 border"
            style={{
              background: 'rgba(42, 28, 21, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#F7F4EF',
              borderColor: 'rgba(255,255,255,0.08)',
              opacity: isHovered ? 1 : 0,
              transform: `translateY(-50%) translateX(${isHovered ? '0' : '-4px'})`,
            }}
          >
            {label}
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rotate-45 -translate-x-1/2" style={{ background: 'rgba(42,28,21,0.85)' }} />
            </div>
          </div>

          {/* Active right pill */}
          {isActive && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-px w-0.5 h-5 rounded-l-full"
              style={{ background: '#8FBAC8' }}
            />
          )}
        </div>
      )}
    </NavLink>
  );
}

function DockActionItem({ icon, label, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className={`
          relative flex items-center justify-center
          w-11 h-11 rounded-lg backdrop-blur-[2px] border
          transition-all duration-300 ease-out cursor-pointer
          ${isHovered ? 'scale-110 -translate-y-1' : 'hover:scale-105 hover:-translate-y-0.5'}
        `}
        style={{
          background: isHovered ? 'rgba(220,53,69,0.12)' : 'rgba(247,244,239,0.55)',
          borderColor: isHovered ? 'rgba(220,53,69,0.25)' : 'rgba(255,255,255,0.75)',
          boxShadow: isHovered ? '0 4px 16px rgba(220,53,69,0.12)' : undefined,
          transitionProperty: 'box-shadow, transform, background, border-color',
        }}
      >
        <div className="transition-all duration-300" style={{ color: isHovered ? '#C0392B' : 'rgba(61,43,35,0.45)', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
          {icon}
        </div>
      </div>

      <div
        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-normal whitespace-nowrap pointer-events-none z-50 transition-all duration-200 border"
        style={{
          background: 'rgba(42,28,21,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#F7F4EF',
          borderColor: 'rgba(255,255,255,0.08)',
          opacity: isHovered ? 1 : 0,
          transform: `translateY(-50%) translateX(${isHovered ? '0' : '-4px'})`,
        }}
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rotate-45 -translate-x-1/2" style={{ background: 'rgba(42,28,21,0.85)' }} />
        </div>
      </div>
    </div>
  );
}

export default function MinimalDock() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const { signOut } = useAuth();
  const [hoveredAny, setHoveredAny] = useState(false);
  const childId = child?.id;

  const navItems = [
    { id: 'dashboard', to: '/dashboard',                      icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
    ...(childId ? [
      { id: 'weekly', to: `/child/${childId}/weekly-update`,  icon: <ClipboardList size={20} />,  label: t('nav.weeklyUpdate') },
      { id: 'growth', to: `/child/${childId}/growth`,         icon: <TrendingUp size={20} />,     label: t('nav.growth') },
      { id: 'food',   to: `/child/${childId}/food`,           icon: <Utensils size={20} />,       label: t('nav.foodTracker') },
      { id: 'health', to: `/child/${childId}/health`,         icon: <HeartPulse size={20} />,     label: t('nav.health') },
    ] : []),
    { id: 'guides',   to: '/guides',                          icon: <BookOpen size={20} />,       label: t('nav.guides') },
    { id: 'ask',      to: '/ask',                             icon: <MessageCircle size={20} />,  label: t('nav.askAi') },
    { id: 'settings', to: '/settings',                        icon: <Settings size={20} />,       label: t('nav.settings') },
  ];

  return (
    <div className="relative flex-shrink-0">
      {/* Dock container — 30% color (#E8C4B8), exact structure from prompt */}
      <div
        className={`
          flex flex-col items-center gap-3 px-4 py-6
          rounded-2xl
          backdrop-blur-xl
          border
          shadow-2xl
          transition-all duration-500 ease-out
          ${hoveredAny ? 'scale-105' : ''}
        `}
        style={{
          background: 'rgba(232, 196, 184, 0.55)',   // 30% — dock bg
          borderColor: 'rgba(255, 255, 255, 0.70)',
          boxShadow: '0 8px 32px rgba(61,43,35,0.10), 0 2px 8px rgba(61,43,35,0.06)',
        }}
        onMouseEnter={() => setHoveredAny(true)}
        onMouseLeave={() => setHoveredAny(false)}
      >
        {/* App logo mark */}
        <LogoMark size={44} className="mb-1 rounded-xl" />

        {/* Divider */}
        <div className="w-6 h-px mb-1" style={{ background: 'rgba(61,43,35,0.15)' }} />

        {/* Nav items */}
        {navItems.map((item) => (
          <DockNavItem key={item.id} to={item.to} icon={item.icon} label={item.label} />
        ))}

        {/* Divider */}
        <div className="w-6 h-px mt-1" style={{ background: 'rgba(61,43,35,0.15)' }} />

        {/* Sign out */}
        <DockActionItem icon={<LogOut size={20} />} label={t('nav.signOut')} onClick={signOut} />
      </div>

      {/* Reflection — exact from prompt */}
      <div className="absolute top-full left-0 right-0 h-16 overflow-hidden mt-1 pointer-events-none">
        <div
          className={`
            flex flex-col items-center gap-3 px-4 py-6
            rounded-2xl backdrop-blur-xl border
            opacity-25
            transform scale-y-[-1]
            transition-all duration-500 ease-out
            ${hoveredAny ? 'scale-x-105 scale-y-[-1.05]' : ''}
          `}
          style={{
            background: 'rgba(232,196,184,0.30)',
            borderColor: 'rgba(255,255,255,0.50)',
          }}
        >
          {navItems.map((item) => (
            <div
              key={`ref-${item.id}`}
              className="flex items-center justify-center w-11 h-11 rounded-lg"
              style={{ background: 'rgba(247,244,239,0.40)' }}
            >
              <div style={{ color: 'rgba(61,43,35,0.35)' }}>{item.icon}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
