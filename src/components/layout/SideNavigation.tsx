import React, { memo, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', path: '/admin/dashboard' },
  { id: 'posAdmin', label: 'POS Admin', icon: '🗂️', path: '/admin/pos-admin' },
  { id: 'customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
  { id: 'orders', label: 'Orders', icon: '🛍️', path: '/admin/orders' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
];

const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    handleCloseDialog();
    handleLogout();
  }, [handleCloseDialog, handleLogout]);

  return (
    <div className="w-20 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col items-center py-4 h-screen fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="w-14 h-14 bg-teal-400 rounded-full flex items-center justify-center text-white text-2xl mb-6">
        🏪
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center space-y-2 w-full">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all ${
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogoutClick}
        className="flex flex-col items-center justify-center w-full py-4 text-gray-600 hover:bg-gray-100 transition-all mt-2"
      >
        <span className="text-2xl mb-1">🔓</span>
        <span className="text-[10px] font-medium">Logout</span>
      </button>

      <ConfirmationDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="You will be signed out of the admin portal. Are you sure you want to continue?"
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onCancel={handleCloseDialog}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};

export default memo(SideNavigation);
