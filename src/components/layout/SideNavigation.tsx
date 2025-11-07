import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { getUserRoleCodes } from '../../utils/authRoles';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const roleCodes = useMemo(() => getUserRoleCodes(user), [user]);
  const hasAdminRole = roleCodes.has('ADMIN');
  const hasCashierRole = roleCodes.has('CASHIER');

  const navigationItems = useMemo(() => {
    const adminItems: NavigationItem[] = [
      { id: 'admin-home', label: 'Home', icon: '🏠', path: '/admin/dashboard' },
      { id: 'admin-pos-admin', label: 'POS Admin', icon: '🗂️', path: '/admin/pos-admin' },
      { id: 'admin-customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
      { id: 'admin-orders', label: 'Orders', icon: '🛍️', path: '/admin/orders' },
      { id: 'admin-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
    ];

    const cashierItems: NavigationItem[] = [
      { id: 'cashier-home', label: 'POS Home', icon: '🏠', path: '/cashier/dashboard' },
      { id: 'cashier-pos', label: 'POS', icon: '🛒', path: '/cashier/pos' },
      { id: 'cashier-orders', label: 'Sales', icon: '🛍️', path: '/admin/orders' },
      { id: 'cashier-customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
      { id: 'cashier-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
    ];

    const items: NavigationItem[] = [];

    if (hasAdminRole) {
      items.push(...adminItems);
    }

    if (hasCashierRole) {
      items.push(...cashierItems);
    }

    if (items.length === 0) {
      return adminItems;
    }

    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.path)) {
        return false;
      }
      seen.add(item.path);
      return true;
    });
  }, [hasAdminRole, hasCashierRole]);

  const handleNavigation = useCallback((path: string) => {
    // Prepend tenant ID to the path
    const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
    navigate(fullPath);
  }, [navigate, tenantId]);

  const isActive = useCallback((path: string) => {
    // Check if current path matches, accounting for tenant ID prefix
    const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
    return location.pathname === fullPath || location.pathname.startsWith(fullPath);
  }, [location.pathname, tenantId]);

  const handleLogout = useCallback(() => {
    logout();
    const loginPath = tenantId ? `/posai/${tenantId}/login` : '/';
    navigate(loginPath);
  }, [logout, navigate, tenantId]);

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
