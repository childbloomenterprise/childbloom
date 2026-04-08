import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import AuthCallback from './features/auth/AuthCallback';
import OnboardingPage from './features/onboarding/OnboardingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import WeeklyUpdatePage from './features/weekly-update/WeeklyUpdatePage';
import UpdateHistoryPage from './features/weekly-update/UpdateHistoryPage';
import GrowthPage from './features/growth/GrowthPage';
import FoodTrackerPage from './features/food/FoodTrackerPage';
import HealthRecordsPage from './features/health/HealthRecordsPage';
import GuidesPage from './features/guides/GuidesPage';
import GuideDetailPage from './features/guides/GuideDetailPage';
import AskAiPage from './features/ask/AskAiPage';
import SettingsPage from './features/settings/SettingsPage';
import Toast from './components/ui/Toast';
import InstallPrompt from './components/InstallPrompt';
import PrivacyPage from './features/privacy/PrivacyPage';

export default function App() {
  useAuth();

  return (
    <>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/child/:id/weekly-update" element={<WeeklyUpdatePage />} />
            <Route path="/child/:id/updates" element={<UpdateHistoryPage />} />
            <Route path="/child/:id/growth" element={<GrowthPage />} />
            <Route path="/child/:id/food" element={<FoodTrackerPage />} />
            <Route path="/child/:id/health" element={<HealthRecordsPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:stage" element={<GuideDetailPage />} />
            <Route path="/ask" element={<AskAiPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Public pages — no auth required */}
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toast />
      <InstallPrompt />
    </>
  );
}
