import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Skeleton from '../ui/Skeleton';

export default function ProtectedRoute() {
  const { session, isLoading, profile } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
