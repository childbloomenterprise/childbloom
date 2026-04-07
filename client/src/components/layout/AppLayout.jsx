import { Outlet, useNavigate } from 'react-router-dom';
import MinimalDock from '../ui/MinimalDock';
import Header from './Header';
import MobileNav from './MobileNav';
import { useChildren } from '../../hooks/useChild';
import ErrorBoundary from '../shared/ErrorBoundary';
import { ChatIcon } from '../../assets/icons';

export default function AppLayout() {
  useChildren();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F4EF' }}>

      {/* Vertical dock — desktop left */}
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

      {/* Mobile horizontal dock */}
      <MobileNav />

      {/* Floating Dr. Bloom button */}
      <button
        onClick={() => navigate('/ask')}
        title="Ask Dr. Bloom"
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-6 z-40 w-13 h-13 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all duration-200 hover:scale-105"
        style={{
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
          boxShadow: '0 4px 20px rgba(45, 106, 79, 0.35)',
        }}
      >
        <ChatIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
