import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, TrendingUp, BookOpen, MessageCircle, Settings, ClipboardList, Utensils, HeartPulse, LogOut } from 'lucide-react';

// Exact dock item component from the prompt — adapted for vertical + right-side tooltip
function DockItem({ to, icon, label, onClick, isActive }) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Icon button — exact from prompt */}
      <div
        className={`
          relative flex items-center justify-center
          w-11 h-11 rounded-lg
          bg-white/5 backdrop-blur-[2px]
          border border-white/10
          transition-all duration-300 ease-out
          cursor-pointer
          shadow-none
          ${(isHovered || isActive)
            ? 'scale-110 bg-white/10 border-white/20 -translate-y-1 shadow-lg shadow-white/10'
            : 'hover:scale-105 hover:bg-white/7 hover:-translate-y-0.5'
          }
        `}
        style={{
          boxShadow: (isHovered || isActive)
            ? '0 4px 24px 0 rgba(255,255,255,0.08)'
            : undefined,
          transitionProperty: 'box-shadow, transform, background, border-color',
        }}
      >
        <div className={`
          text-white transition-all duration-300
          ${(isHovered || isActive) ? 'scale-105 drop-shadow-[0_1px_4px_rgba(255,255,255,0.10)]' : 'text-white/70'}
        `}>
          {icon}
        </div>
      </div>

      {/* Tooltip — right side for vertical dock */}
      <div className={`
        absolute left-full ml-3 top-1/2 -translate-y-1/2
        px-2.5 py-1 rounded-md
        bg-black/70 backdrop-blur
        text-white text-xs font-normal
        border border-white/5
        transition-all duration-200
        pointer-events-none
        whitespace-nowrap
        z-50
        ${isHovered
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-1'
        }
        shadow-sm
      `}>
        {label}
        {/* Arrow pointing left */}
        <div className="absolute right-full top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-black/70 rotate-45 border-l border-b border-white/5 -translate-x-1/2" />
        </div>
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1 h-4 rounded-l-full bg-white/60" />
      )}
    </div>
  );

  if (onClick) return content;

  return (
    <NavLink to={to}>
      {({ isActive: navActive }) => (
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`
              relative flex items-center justify-center
              w-11 h-11 rounded-lg
              bg-white/5 backdrop-blur-[2px]
              border border-white/10
              transition-all duration-300 ease-out
              cursor-pointer
              shadow-none
              ${(isHovered || navActive)
                ? 'scale-110 bg-white/10 border-white/20 -translate-y-1 shadow-lg shadow-white/10'
                : 'hover:scale-105 hover:bg-white/7 hover:-translate-y-0.5'
              }
            `}
            style={{
              boxShadow: (isHovered || navActive)
                ? '0 4px 24px 0 rgba(255,255,255,0.08)'
                : undefined,
              transitionProperty: 'box-shadow, transform, background, border-color',
            }}
          >
            <div className={`
              transition-all duration-300
              ${(isHovered || navActive)
                ? 'text-white scale-105 drop-shadow-[0_1px_4px_rgba(255,255,255,0.10)]'
                : 'text-white/60'
              }
            `}>
              {icon}
            </div>
          </div>

          {/* Tooltip — right side */}
          <div className={`
            absolute left-full ml-3 top-1/2 -translate-y-1/2
            px-2.5 py-1 rounded-md
            bg-black/70 backdrop-blur
            text-white text-xs font-normal
            border border-white/5
            transition-all duration-200
            pointer-events-none
            whitespace-nowrap
            z-50
            ${isHovered
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-1'
            }
            shadow-sm
          `}>
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-black/70 rotate-45 border-l border-b border-white/5 -translate-x-1/2" />
            </div>
          </div>

          {/* Active pill */}
          {navActive && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-px w-0.5 h-5 rounded-l-full bg-white/70" />
          )}
        </div>
      )}
    </NavLink>
  );
}

// The dock itself — exact container from prompt, made vertical
export default function MinimalDock() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const { signOut } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const childId = child?.id;

  const navItems = [
    { id: 'dashboard', to: '/dashboard',                          icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
    ...(childId ? [
      { id: 'weekly',  to: `/child/${childId}/weekly-update`,     icon: <ClipboardList size={20} />,  label: t('nav.weeklyUpdate') },
      { id: 'growth',  to: `/child/${childId}/growth`,            icon: <TrendingUp size={20} />,     label: t('nav.growth') },
      { id: 'food',    to: `/child/${childId}/food`,              icon: <Utensils size={20} />,       label: t('nav.foodTracker') },
      { id: 'health',  to: `/child/${childId}/health`,            icon: <HeartPulse size={20} />,     label: t('nav.health') },
    ] : []),
    { id: 'guides',   to: '/guides',                              icon: <BookOpen size={20} />,       label: t('nav.guides') },
    { id: 'ask',      to: '/ask',                                 icon: <MessageCircle size={20} />,  label: t('nav.askAi') },
    { id: 'settings', to: '/settings',                            icon: <Settings size={20} />,       label: t('nav.settings') },
  ];

  return (
    <div className="relative flex-shrink-0">
      {/* Dock Container — exact from prompt, made flex-col vertical */}
      <div className={`
        flex flex-col items-center gap-3 px-4 py-6
        rounded-2xl
        bg-black/40 backdrop-blur-xl
        border border-white/10
        shadow-2xl
        transition-all duration-500 ease-out
        ${hoveredItem ? 'scale-105' : ''}
      `}>
        {/* App logo mark */}
        <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-1" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* Divider */}
        <div className="w-6 h-px bg-white/10 mb-1" />

        {/* Nav items */}
        {navItems.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <DockItem
              to={item.to}
              icon={item.icon}
              label={item.label}
            />
          </div>
        ))}

        {/* Divider */}
        <div className="w-6 h-px bg-white/10 mt-1" />

        {/* Sign out */}
        <div
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <DockItem
            onClick={signOut}
            icon={<LogOut size={20} />}
            label={t('nav.signOut')}
            isActive={false}
          />
        </div>
      </div>

      {/* Reflection — from prompt, below the dock */}
      <div className="absolute top-full left-0 right-0 h-16 overflow-hidden mt-1 pointer-events-none">
        <div className={`
          flex flex-col items-center gap-3 px-4 py-6
          rounded-2xl
          bg-black/20 backdrop-blur-xl
          border border-white/5
          opacity-20
          transform scale-y-[-1]
          transition-all duration-500 ease-out
          ${hoveredItem ? 'scale-x-105 scale-y-[-1.05]' : ''}
        `}>
          {navItems.map((item) => (
            <div
              key={`reflection-${item.id}`}
              className={`
                flex items-center justify-center
                w-11 h-11 rounded-lg
                bg-white/5
                transition-all duration-300 ease-out
                ${hoveredItem === item.id ? 'scale-110 -translate-y-1' : ''}
              `}
            >
              <div className="text-white/40">{item.icon}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
