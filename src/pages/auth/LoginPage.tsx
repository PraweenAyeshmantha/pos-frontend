import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import { getDefaultTenantPath } from '../../utils/authRoles';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [toast, setToast] = useState<{ type: AlertType; text: string } | null>(null);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useParams<{ tenantId: string }>();

  // Get the intended destination or default to dashboard
  // Filter out /reset-password from 'from' to avoid redirect loop after password reset
  const fromPath = (location.state as { from?: { pathname: string }; passwordResetSuccess?: boolean })?.from?.pathname;
  const baseFrom = fromPath && !fromPath.includes('/reset-password') ? fromPath : undefined;
  const passwordResetSuccess = (location.state as { passwordResetSuccess?: boolean })?.passwordResetSuccess || false;

  const showToast = useCallback((type: AlertType, text: string) => {
    setToast({ type, text });
  }, []);

  // Redirect if already authenticated (e.g., user navigated to /login while logged in)
  // Skip this check if we're already navigating from a login submission
  useEffect(() => {
    if (isAuthenticated && user && !isNavigating) {
      // If password reset is required, redirect to reset password page
      if (user.requirePasswordReset) {
        navigate(`/posai/${tenantId}/reset-password`, { replace: true });
      } else {
        const defaultPath = getDefaultTenantPath(user, tenantId);
        const targetPath = baseFrom ?? defaultPath;
        navigate(targetPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, baseFrom, isNavigating, tenantId]);

  useEffect(() => {
    if (passwordResetSuccess) {
      showToast('success', 'Password reset successful! Please login with your new password.');
    }
  }, [passwordResetSuccess, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showToast('warning', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const loggedInUser = await login(username, password);
      // Set navigating flag to prevent useEffect from interfering
      setIsNavigating(true);
      // Navigate immediately after successful login based on the response
      // This ensures we use the latest requirePasswordReset value from the backend
      if (loggedInUser.requirePasswordReset) {
        navigate(`/posai/${tenantId}/reset-password`, { replace: true });
      } else {
        const defaultPath = getDefaultTenantPath(loggedInUser, tenantId);
        const targetPath = baseFrom ?? defaultPath;
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      let message = 'Unable to connect to the server. Please try again.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401) {
        message = 'Invalid username or password';
      } else if (error.response?.status === 400) {
        message = error.response?.data?.message || 'Account is inactive or invalid credentials';
      }

      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">POS System</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Enter your credentials to access the POS system</p>
        </div>
      </div>

      {toast && (
        <ToastContainer>
          <Alert
            type={toast.type}
            title={toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
            message={toast.text}
            onClose={() => setToast(null)}
          />
        </ToastContainer>
      )}
    </div>
  );
};

export default LoginPage;
