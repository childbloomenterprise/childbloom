import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import { useAuth } from './hooks/useAuth';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Skeleton from './components/ui/Skeleton';
import Toast from './components/ui/Toast';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/ui/SplashScreen';
// ── Auth pages: eager (critical first-load paths) ──
import AuthPage from './features/auth/AuthPage';
import AuthCallback from './features/auth/AuthCallback';
import OnboardingPage from './features/onboarding/OnboardingPage';

// ── App pages: lazy-loaded (only fetched when needed) ──
const LandingPage       = lazy(() => import('./features/landing/LandingPage'));
const DashboardPage     = lazy(() => import('./features/dashboard/DashboardPage'));
const WeeklyUpdatePage  = lazy(() => import('./features/weekly-update/WeeklyUpdatePage'));
const UpdateHistoryPage = lazy(() => import('./features/weekly-update/UpdateHistoryPage'));
const GrowthPage        = lazy(() => import('./features/growth/GrowthPage'));
const GrowthChartPage   = lazy(() => import('./features/growth/GrowthChartPage'));
const FoodTrackerPage   = lazy(() => import('./features/food/FoodTrackerPage'));
const HealthRecordsPage  = lazy(() => import('./features/health/HealthRecordsPage'));
const VaccinationPage    = lazy(() => import('./features/health/VaccinationPage'));
const GuidesPage        = lazy(() => import('./features/guides/GuidesPage'));
const GuideDetailPage   = lazy(() => import('./features/guides/GuideDetailPage'));
const AskAiPage         = lazy(() => import('./features/ask/AskAiPage'));
const SettingsPage      = lazy(() => import('./features/settings/SettingsPage'));
const PrivacyPage          = lazy(() => import('./features/privacy/PrivacyPage'));
const EmergencyGuidePage   = lazy(() => import('./features/emergency/EmergencyGuidePage'));

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

// Logged-in users skip the landing page and go straight to dashboard
function RootRedirect() {
  const { session, isLoading } = useAuthStore();
  if (isLoading) return null; // SplashScreen covers the wait
  if (session)   return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}


export default function App() {
  useAuth();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Root → dashboard if logged in, landing page if not ── */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── New combined auth page ─────────────────── */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* ── Legacy routes → redirect to /auth ─────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"  element={<Navigate to="/auth" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
          </Route>

          {/* ── Dashboard — visible without login (demo mode) ── */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* ── Protected app routes ───────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/child/:id/weekly-update"      element={<WeeklyUpdatePage />} />
              <Route path="/child/:id/updates"            element={<UpdateHistoryPage />} />
              <Route path="/child/:id/growth"             element={<GrowthPage />} />
              <Route path="/child/:id/development"        element={<GrowthChartPage />} />
              <Route path="/child/:id/food"               element={<FoodTrackerPage />} />
              <Route path="/child/:id/health"             element={<HealthRecordsPage />} />
              <Route path="/child/:id/vaccinations"      element={<VaccinationPage />} />
              <Route path="/guides"                       element={<GuidesPage />} />
              <Route path="/guides/:stage"                element={<GuideDetailPage />} />
              <Route path="/ask"                          element={<AskAiPage />} />
              <Route path="/settings"                     element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Public pages ───────────────────────────── */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route element={<AppLayout />}>
            <Route path="/emergency" element={<EmergencyGuidePage />} />
          </Route>

          {/* ── Fallback ───────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toast />
      <InstallPrompt />
    </>
  );
}
