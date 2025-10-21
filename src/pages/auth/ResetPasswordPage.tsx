import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';

const ResetPasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: AlertType; text: string } | null>(null);
  const { resetPassword, logout, user } = useAuth();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: AlertType, text: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ type, text });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('warning', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 4) {
      showToast('warning', 'New password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('warning', 'New password and confirm password do not match');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('warning', 'New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(currentPassword, newPassword, confirmPassword);
      // Password reset successful - logout and redirect to login
      // User needs to login again with new password to authenticate
      logout();
      const loginPath = tenantId ? `/posai/${tenantId}/login` : '/';
      navigate(loginPath, { replace: true, state: { passwordResetSuccess: true } });
    } catch (err) {
      console.error('Password reset error:', err);
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      let message = 'Unable to reset password. Please try again.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 400) {
        message = error.response?.data?.message || 'Password reset failed. Please check your inputs.';
      }

      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {user?.name ? `Welcome, ${user.name}!` : 'Welcome!'}
          </p>
          <p className="text-sm text-amber-600 mt-2">
            Please change your password to continue
          </p>
        </div>

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your current password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your new password"
              disabled={isLoading}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 4 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your new password"
              disabled={isLoading}
              autoComplete="new-password"
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
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Choose a strong password to secure your account</p>
        </div>
      </div>

      {toast && (
        <ToastContainer>
          <Alert
            type={toast.type}
            title={toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
            message={toast.text}
          />
        </ToastContainer>
      )}
    </div>
  );
};

export default ResetPasswordPage;
