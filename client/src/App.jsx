import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { capturePageview } from './lib/analytics';
import { useNightDim } from './hooks/useNightDim';
import useAuthStore from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import Skeleton from './components/ui/Skeleton';
import Toast from './components/ui/Toast';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/ui/SplashScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';
import PWAUpdatePrompt from './components/ui/PWAUpdatePrompt';

// ── App pages: lazy-loaded ──
const DashboardPage     = lazy(() => import('./features/dashboard/DashboardPage'));
const WeeklyUpdatePage  = lazy(() => import('./features/weekly-update/WeeklyUpdatePage'));
const UpdateHistoryPage = lazy(() => import('./features/weekly-update/UpdateHistoryPage'));
const WeeklyReportPage  = lazy(() => import('./features/weekly-report/WeeklyReportPage'));
const GrowthPage        = lazy(() => import('./features/growth/GrowthPage'));
const GrowthChartPage   = lazy(() => import('./features/growth/GrowthChartPage'));
const FoodTrackerPage   = lazy(() => import('./features/food/FoodTrackerPage'));
const HealthRecordsPage = lazy(() => import('./features/health/HealthRecordsPage'));
const VaccinationPage   = lazy(() => import('./features/health/VaccinationPage'));
const GuidesPage        = lazy(() => import('./features/guides/GuidesPage'));
const GuideDetailPage   = lazy(() => import('./features/guides/GuideDetailPage'));
const AskAiPage         = lazy(() => import('./features/ask/AskAiPage'));
const SettingsPage      = lazy(() => import('./features/settings/SettingsPage'));
const PrivacyPage       = lazy(() => import('./features/privacy/PrivacyPage'));
const TermsPage         = lazy(() => import('./features/legal/TermsPage'));
const RefundPage        = lazy(() => import('./features/legal/RefundPage'));
const MadaDemoPage      = lazy(() => import('./features/mada-demo/MadaDemoPage'));
const EmergencyGuidePage  = lazy(() => import('./features/emergency/EmergencyGuidePage'));
const EmergencyTopicPage  = lazy(() => import('./features/emergency/EmergencyTopicPage'));
const GuidedActionMode    = lazy(() => import('./features/emergency/GuidedActionMode'));
const CarePage          = lazy(() => import('./features/care/CarePage'));
const DoctorCarePage    = lazy(() => import('./features/care/DoctorCarePage'));
const FamilyPage        = lazy(() => import('./features/family/FamilyPage'));
const AuthPage          = lazy(() => import('./features/auth/AuthPage'));
const AuthCallback      = lazy(() => import('./features/auth/AuthCallback'));
const OnboardingPage    = lazy(() => import('./features/onboarding/OnboardingPage'));
const LandingPage       = lazy(() => import('./features/landing/LandingPage'));
const AchievementsPage  = lazy(() => import('./features/achievements/AchievementsPage'));
const BloomGardenPage   = lazy(() => import('./features/bloom/BloomGardenPage'));
const BloomAreaPage     = lazy(() => import('./features/bloom/BloomAreaPage'));
const HelpPage          = lazy(() => import('./features/help/HelpPage'));
const InboxPage         = lazy(() => import('./features/inbox/InboxPage'));
const PremiumPage       = lazy(() => import('./features/premium/PremiumPage'));
const MythsPage         = lazy(() => import('./features/myths/MythsPage'));
const JoinPage          = lazy(() => import('./features/install/JoinPage'));

function RootRoute() {
  const session   = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user      = session?.user;
  // A real signed-in user is one with a session that is NOT anonymous.
  // useAuth() always upgrades visitors to an anonymous session, so we must
  // explicitly exclude that case before sending anyone into the app shell.
  const signedIn = !!user && !user.is_anonymous;

  if (isLoading) return <PageFallback />;
  return signedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

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

function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center', background: '#F7F4EF', flexDirection: 'column', gap: 0,
    }}>
      {/* Animated decoration */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, animation: 'bloom-breathe 2.4s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 38 }}>🌱</span>
      </div>
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, color: '#1D3D2E', fontStyle: 'italic', marginBottom: 10, animation: 'fade-in-up 0.5s ease-out both' }}>
          Page not found
        </div>
        <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 20, lineHeight: 1.5, animation: 'fade-in-up 0.5s ease-out 0.1s both' }}>
          The page you were looking for has moved or doesn't exist.
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-block', padding: '11px 24px', borderRadius: 999,
            background: '#1D6A47', color: '#fff', textDecoration: 'none',
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
            boxShadow: '0 3px 12px rgba(29,106,71,0.3)',
            animation: 'fade-in-up 0.5s ease-out 0.2s both',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(29,106,71,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 12px rgba(29,106,71,0.3)'; }}
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

// Captures a PostHog $pageview on every SPA route change (the app disables
// PostHog's automatic pageview so navigations between lazy routes are counted).
function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    capturePageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  useAuth();
  useNightDim();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <PageviewTracker />
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </AnimatePresence>
      <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<RootRoute />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard"                   element={<DashboardPage />} />
            <Route path="/child/:id/weekly-update"     element={<WeeklyUpdatePage />} />
            <Route path="/child/:id/updates"           element={<UpdateHistoryPage />} />
            <Route path="/child/:id/weekly-report"     element={<WeeklyReportPage />} />
            <Route path="/child/:id/growth"            element={<GrowthPage />} />
            <Route path="/child/:id/development"       element={<GrowthChartPage />} />
            <Route path="/child/:id/food"              element={<FoodTrackerPage />} />
            <Route path="/child/:id/health"            element={<HealthRecordsPage />} />
            <Route path="/child/:id/vaccinations"      element={<VaccinationPage />} />
            <Route path="/child/:id/doctor"            element={<DoctorCarePage />} />
            <Route path="/child/:id/bloom"             element={<BloomGardenPage />} />
            <Route path="/child/:id/bloom/:area"       element={<BloomAreaPage />} />
            <Route path="/emergency"                   element={<EmergencyGuidePage />} />
            <Route path="/emergency/:topic"            element={<EmergencyTopicPage />} />
            <Route path="/guides"                      element={<GuidesPage />} />
            <Route path="/guides/:stage"               element={<GuideDetailPage />} />
            <Route path="/ask"                         element={<AskAiPage />} />
            <Route path="/care"                        element={<CarePage />} />
            <Route path="/settings"                    element={<SettingsPage />} />
            <Route path="/family"                      element={<FamilyPage />} />
            <Route path="/achievements"               element={<AchievementsPage />} />
            <Route path="/help"                        element={<HelpPage />} />
            <Route path="/inbox"                       element={<InboxPage />} />
            <Route path="/premium"                     element={<PremiumPage />} />
            <Route path="/myths"                       element={<MythsPage />} />
          </Route>

          {/* Guided Action Mode — full-screen, immersive (no tab bar) */}
          <Route path="/emergency/:topic/guided" element={<GuidedActionMode />} />

          <Route path="/auth"          element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding"    element={<OnboardingPage />} />
          <Route path="/privacy"       element={<PrivacyPage />} />
          <Route path="/terms"         element={<TermsPage />} />
          <Route path="/refund"        element={<RefundPage />} />
          <Route path="/mada-demo"     element={<MadaDemoPage />} />
          <Route path="/join"          element={<JoinPage />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toast />
      <InstallPrompt />
      <PWAUpdatePrompt />
    </>
  );
}
