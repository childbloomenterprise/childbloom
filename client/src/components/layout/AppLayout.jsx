import { Outlet } from 'react-router-dom';
import CBTabBar from '../cb/CBTabBar';
import { useChildren } from '../../hooks/useChild';
import ErrorBoundary from '../shared/ErrorBoundary';
import { T } from '../cb/tokens';

export default function AppLayout() {
  useChildren();

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      <main style={{ paddingBottom: 83 }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <CBTabBar />
    </div>
  );
}
