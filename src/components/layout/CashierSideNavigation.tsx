import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserRoleCodes } from '../../utils/authRoles';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const CashierSideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();

  const roleCodes = useMemo(() => getUserRoleCodes(user), [user]);
  const hasAdminRole = roleCodes.has('ADMIN');
  const hasCashierRole = roleCodes.has('CASHIER');

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [];

    if (hasCashierRole) {
      items.push(
        { id: 'cashier-home', label: 'Home', icon: '🏠', path: '/cashier/dashboard' },
        { id: 'cashier-pos', label: 'POS', icon: '🛒', path: '/cashier/pos' },
        { id: 'cashier-balancing', label: 'Balance', icon: '💰', path: '/cashier/balancing' },
        { id: 'cashier-goods-received', label: 'Goods In', icon: '📦', path: '/cashier/goods-received' },
        { id: 'cashier-statistics', label: 'Statistics', icon: '$', path: '/cashier/statistics' },
        { id: 'cashier-orders', label: 'Sales', icon: '🛍️', path: '/admin/orders' },
        { id: 'cashier-customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
        { id: 'cashier-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
      );
    }

    if (hasAdminRole) {
      items.push(
        { id: 'admin-dashboard', label: 'Admin', icon: '🏛️', path: '/admin/dashboard' },
        { id: 'admin-orders', label: 'Orders', icon: '🛍️', path: '/admin/orders' },
        { id: 'admin-customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
        { id: 'admin-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
      );
    }

    if (items.length === 0 && user) {
      // Fallback for authenticated users with no detected roles
      return [
        { id: 'cashier-home-fallback', label: 'Home', icon: '🏠', path: '/cashier/dashboard' },
        { id: 'cashier-pos-fallback', label: 'POS', icon: '🛒', path: '/cashier/pos' },
        { id: 'cashier-balancing-fallback', label: 'Balance', icon: '💰', path: '/cashier/balancing' },
        { id: 'cashier-statistics-fallback', label: 'Statistics', icon: '$', path: '/cashier/statistics' },
        { id: 'cashier-settings-fallback', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
      ];
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

  const handleNavigation = (path: string) => {
    const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
    navigate(fullPath);
  };

  const isActive = (path: string) => {
    const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
    return location.pathname === fullPath || location.pathname.startsWith(fullPath);
  };

  const handleLogout = useCallback(() => {
    logout();
    const loginPath = tenantId ? `/posai/${tenantId}/login` : '/';
    navigate(loginPath);
  }, [logout, navigate, tenantId]);

  return (
    <div className="w-20 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col items-center py-4 h-screen fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="w-14 h-14 bg-teal-400 rounded-full flex items-center justify-center text-white text-2xl mb-6">
        🏪
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center space-y-2 w-full">
        {isLoading ? (
          // Loading state - show skeleton or spinner
          <div className="flex flex-col items-center space-y-2 w-full py-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-8 h-2 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          navigationItems.map((item) => (
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
          ))
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center w-full py-4 text-gray-600 hover:bg-gray-100 transition-all mt-2"
      >
        <span className="text-2xl mb-1">🔓</span>
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </div>
  );
};

export default CashierSideNavigation;
