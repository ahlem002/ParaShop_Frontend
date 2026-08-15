import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
  /** Allow access while password/profile onboarding is incomplete. */
  allowOnboarding?: boolean;
}

export function ProtectedRoute({
  allowedRoles,
  children,
  allowOnboarding = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowOnboarding && user.mustChangePassword) {
    return <Navigate to="/auth/change-password" replace />;
  }

  if (
    !allowOnboarding &&
    user.role === 'DELIVERY' &&
    user.profileCompleted === false &&
    location.pathname !== '/auth/complete-profile'
  ) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'COMPANY' && user.companyVerificationStatus !== 'APPROVED') {
    return <Navigate to="/company/pending" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
