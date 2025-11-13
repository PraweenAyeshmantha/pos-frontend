import React, { memo, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultTenantPath, userHasAnyScreenAccess, userHasScreenAccess } from '../../utils/authRoles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  screenCode?: string;
  permission?: 'view' | 'create' | 'edit' | 'delete';
}

// Loading component extracted for reusability
const LoadingSpinner = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, screenCode, permission = 'view' }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [forcedLogout, setForcedLogout] = useState(false);

  // Memoize password reset check to avoid recalculation
  const requirePasswordReset = useMemo(() => {
    // Check if user requires password reset
    // Read from sessionStorage as fallback to ensure we have the latest data
    // This prevents race conditions where React state hasn't updated yet
    let needsReset = user?.requirePasswordReset || false;
    
    // Double-check with sessionStorage to get the most recent value
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const sessionUser = JSON.parse(userStr);
        needsReset = sessionUser.requirePasswordReset === true;
      } catch {
        // If parsing fails, use the context value
        needsReset = user?.requirePasswordReset || false;
      }
    }
    
    return needsReset;
  }, [user]);

  const hasAccess = useMemo(() => userHasScreenAccess(user, screenCode, permission), [permission, screenCode, user]);
  const hasAnyAccess = useMemo(() => userHasAnyScreenAccess(user), [user]);

  useEffect(() => {
    if (isAuthenticated && user && !hasAnyAccess && !forcedLogout) {
      setForcedLogout(true);
      logout();
    }
  }, [forcedLogout, hasAnyAccess, isAuthenticated, logout, user]);

  if (forcedLogout) {
    const loginPath = tenantId ? `/posai/${tenantId}/login` : '/';
    return <Navigate to={loginPath} state={{ from: location, accessRevoked: true }} replace />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    // Include tenant ID in the redirect URL
    const loginPath = tenantId ? `/posai/${tenantId}/login` : '/';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If user requires password reset, redirect to reset password page
  if (requirePasswordReset && !location.pathname.includes('/reset-password')) {
    const resetPath = tenantId ? `/posai/${tenantId}/reset-password` : '/';
    return <Navigate to={resetPath} replace />;
  }

  if (!hasAccess) {
    const fallbackPath = getDefaultTenantPath(user, tenantId);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default memo(ProtectedRoute);
