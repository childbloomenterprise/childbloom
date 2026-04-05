import { Outlet } from 'react-router-dom';
import MinimalDock from '../ui/MinimalDock';
import Header from './Header';
import MobileNav from './MobileNav';
import { useChildren } from '../../hooks/useChild';
import ErrorBoundary from '../shared/ErrorBoundary';

export default function AppLayout() {
  useChildren();

  return (
    // Exact background from prompt
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex">

      {/* Vertical dock — desktop only, left side */}
      <div className="hidden lg:flex items-start justify-center px-4 py-6 flex-shrink-0">
        <div className="sticky top-6">
          <MinimalDock />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 px-4 sm:px-5 lg:px-8 py-5 sm:py-6 pb-36 lg:pb-8 max-w-5xl w-full mx-auto">
          <ErrorBoundary>
            <div className="animate-fade-in-up">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom dock */}
      <MobileNav />
    </div>
  );
}
