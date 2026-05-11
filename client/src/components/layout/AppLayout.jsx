import { Outlet } from 'react-router-dom';
import CBTabBar from '../cb/CBTabBar';
import { useChildren } from '../../hooks/useChild';
import ErrorBoundary from '../shared/ErrorBoundary';
import { T, FONTS } from '../cb/tokens';

export default function AppLayout() {
  useChildren();

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>
      <main style={{ paddingBottom: 96 }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <CBTabBar />
    </div>
  );
}
