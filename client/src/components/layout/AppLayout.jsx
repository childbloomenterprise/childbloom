import { Outlet } from 'react-router-dom';
import CBTabBar from '../cb/CBTabBar';
import { useChildren } from '../../hooks/useChild';
import ErrorBoundary from '../shared/ErrorBoundary';
import { T, FONTS } from '../cb/tokens';
import AchievementCelebration from '../../features/achievements/AchievementCelebration';
import PageTransition from './PageTransition';
import useScrollHaptics from '../../hooks/useScrollHaptics';
import { useNotifications } from '../../hooks/useNotifications';

export default function AppLayout() {
  useChildren();
  useScrollHaptics();
  useNotifications();

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>
      <main style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>
        <ErrorBoundary>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </ErrorBoundary>
      </main>
      <CBTabBar />
      <AchievementCelebration />
    </div>
  );
}
