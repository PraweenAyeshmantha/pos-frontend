import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user requires password reset
  // Read from sessionStorage as fallback to ensure we have the latest data
  // This prevents race conditions where React state hasn't updated yet
  let requirePasswordReset = user?.requirePasswordReset || false;
  
  // Double-check with sessionStorage to get the most recent value
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      const sessionUser = JSON.parse(userStr);
      requirePasswordReset = sessionUser.requirePasswordReset === true;
    } catch {
      // If parsing fails, use the context value
      requirePasswordReset = user?.requirePasswordReset || false;
    }
  }

  // If user requires password reset, redirect to reset password page
  if (requirePasswordReset && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
