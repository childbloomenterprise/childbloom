import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Skeleton from './components/ui/Skeleton';
import Toast from './components/ui/Toast';
import InstallPrompt from './components/InstallPrompt';
import useAuthStore from './stores/authStore';

// ── Auth pages: eager (critical first-load paths) ──
import AuthPage from './features/auth/AuthPage';
import AuthCallback from './features/auth/AuthCallback';
import OnboardingPage from './features/onboarding/OnboardingPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';

// ── Landing page: lazy-loaded ──
const LandingPage = lazy(() => import('./features/landing/LandingPage'));

// ── App pages: lazy-loaded (only fetched when needed) ──
const DashboardPage     = lazy(() => import('./features/dashboard/DashboardPage'));
const WeeklyUpdatePage  = lazy(() => import('./features/weekly-update/WeeklyUpdatePage'));
const UpdateHistoryPage = lazy(() => import('./features/weekly-update/UpdateHistoryPage'));
const GrowthPage        = lazy(() => import('./features/growth/GrowthPage'));
const FoodTrackerPage   = lazy(() => import('./features/food/FoodTrackerPage'));
const HealthRecordsPage = lazy(() => import('./features/health/HealthRecordsPage'));
const GuidesPage        = lazy(() => import('./features/guides/GuidesPage'));
const GuideDetailPage   = lazy(() => import('./features/guides/GuideDetailPage'));
const AskAiPage         = lazy(() => import('./features/ask/AskAiPage'));
const SettingsPage      = lazy(() => import('./features/settings/SettingsPage'));
const PrivacyPage       = lazy(() => import('./features/privacy/PrivacyPage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}

// Shows landing page for guests; redirects logged-in users to /dashboard
function AuthGate({ children }) {
  const { session, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading) return <PageFallback />;
  if (session) return null;
  return children;
}

export default function App() {
  useAuth();

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Landing page (public, guests only) ─────── */}
          <Route path="/" element={<AuthGate><LandingPage /></AuthGate>} />

          {/* ── New combined auth page ─────────────────── */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* ── Legacy routes → redirect to /auth ─────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"  element={<Navigate to="/auth" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
          </Route>

          {/* ── Protected app routes ───────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"                    element={<DashboardPage />} />
              <Route path="/child/:id/weekly-update"      element={<WeeklyUpdatePage />} />
              <Route path="/child/:id/updates"            element={<UpdateHistoryPage />} />
              <Route path="/child/:id/growth"             element={<GrowthPage />} />
              <Route path="/child/:id/food"               element={<FoodTrackerPage />} />
              <Route path="/child/:id/health"             element={<HealthRecordsPage />} />
              <Route path="/guides"                       element={<GuidesPage />} />
              <Route path="/guides/:stage"                element={<GuideDetailPage />} />
              <Route path="/ask"                          element={<AskAiPage />} />
              <Route path="/settings"                     element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Public pages ───────────────────────────── */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* ── Fallback ───────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toast />
      <InstallPrompt />
    </>
  );
}
