import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelectedChild } from '../../hooks/useChild';
import { LayoutDashboard, TrendingUp, BookOpen, MessageCircle, Settings } from 'lucide-react';

export default function MobileNav() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const [hoveredItem, setHoveredItem] = useState(null);

  const items = [
    { id: 'dashboard', to: '/dashboard',                          icon: <LayoutDashboard size={20} />, label: t('nav.home') },
    { id: 'growth',    to: child ? `/child/${child.id}/growth` : '/dashboard', icon: <TrendingUp size={20} />, label: t('nav.growth') },
    { id: 'guides',    to: '/guides',                             icon: <BookOpen size={20} />,       label: t('nav.guides') },
    { id: 'ask',       to: '/ask',                                icon: <MessageCircle size={20} />,  label: t('nav.askAi') },
    { id: 'settings',  to: '/settings',                           icon: <Settings size={20} />,       label: t('nav.more') },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end lg:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
    >
      {/* Exact dock container from prompt — horizontal for mobile */}
      <div className={`
        flex items-end gap-3 px-6 py-4
        rounded-2xl
        bg-black/40 backdrop-blur-xl
        border border-white/10
        shadow-2xl
        transition-all duration-500 ease-out
        ${hoveredItem ? 'scale-105' : ''}
      `}>
        {items.map((item) => (
          <NavLink key={item.id} to={item.to}>
            {({ isActive }) => (
              <div
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => setHoveredItem(item.id)}
                onTouchEnd={() => setTimeout(() => setHoveredItem(null), 400)}
              >
                {/* Exact DockItem from prompt */}
                <div
                  className={`
                    relative flex items-center justify-center
                    w-11 h-11 rounded-lg
                    bg-white/5 backdrop-blur-[2px]
                    border border-white/10
                    transition-all duration-300 ease-out
                    cursor-pointer
                    shadow-none
                    ${(hoveredItem === item.id || isActive)
                      ? 'scale-110 bg-white/10 border-white/20 -translate-y-1 shadow-lg shadow-white/10'
                      : 'hover:scale-105 hover:bg-white/7 hover:-translate-y-0.5'
                    }
                  `}
                  style={{
                    boxShadow: (hoveredItem === item.id || isActive)
                      ? '0 4px 24px 0 rgba(255,255,255,0.08)'
                      : undefined,
                    transitionProperty: 'box-shadow, transform, background, border-color',
                  }}
                >
                  <div className={`
                    transition-all duration-300
                    ${(hoveredItem === item.id || isActive)
                      ? 'text-white scale-105 drop-shadow-[0_1px_4px_rgba(255,255,255,0.10)]'
                      : 'text-white/60'
                    }
                  `}>
                    {item.icon}
                  </div>
                </div>

                {/* Tooltip — above for mobile horizontal dock */}
                <div className={`
                  absolute -top-10 left-1/2 transform -translate-x-1/2
                  px-2.5 py-1 rounded-md
                  bg-black/70 backdrop-blur
                  text-white text-xs font-normal
                  border border-white/5
                  transition-all duration-200
                  pointer-events-none
                  whitespace-nowrap
                  ${hoveredItem === item.id
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-1'
                  }
                  shadow-sm
                `}>
                  {item.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-black/70 rotate-45 border-r border-b border-white/5" />
                  </div>
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Reflection — exact from prompt */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-[320px] h-16 overflow-hidden pointer-events-none">
        <div className={`
          flex items-start gap-3 px-6 py-4
          rounded-2xl
          bg-black/20 backdrop-blur-xl
          border border-white/5
          opacity-30
          transform scale-y-[-1]
          transition-all duration-500 ease-out
          ${hoveredItem ? 'scale-105 scale-y-[-1.05]' : ''}
        `}>
          {items.map((item) => (
            <div
              key={`r-${item.id}`}
              className={`
                flex items-center justify-center
                w-11 h-11 rounded-lg bg-white/5
                transition-all duration-300 ease-out
                ${hoveredItem === item.id ? 'scale-110 -translate-y-1' : ''}
              `}
            >
              <div className="text-white/40">{item.icon}</div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
