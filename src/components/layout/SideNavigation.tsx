import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/admin/dashboard' },
    { id: 'customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
    { id: 'orders', label: 'Orders', icon: '🛍️', path: '/admin/orders' },
    { id: 'statistics', label: 'Statistics', icon: '💲', path: '/admin/statistics' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/configuration/general' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="w-24 bg-white shadow-lg flex flex-col items-center py-6 space-y-6 h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center text-white text-2xl mb-4">
        🏪
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center space-y-4 w-full">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => console.log('Logout clicked')}
        className="flex flex-col items-center justify-center w-full py-3 text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span className="text-2xl mb-1">🔄</span>
        <span className="text-xs font-medium">Logout</span>
      </button>
    </div>
  );
};

export default SideNavigation;
