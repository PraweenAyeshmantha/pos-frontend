import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmationDialog from '../common/ConfirmationDialog';
import type { NavigationItemConfig } from './navigationConfig';
import { buildNavigationItems } from './navigationConfig';

const MAX_PRIMARY_ITEMS = 7;

const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigationItems = useMemo<NavigationItemConfig[]>(() => buildNavigationItems(user), [user]);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showMoreMenu) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current?.contains(target) || moreButtonRef.current?.contains(target)) {
        return;
      }
      setShowMoreMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    setShowMoreMenu(false);
  }, [navigationItems]);

  const handleNavigation = useCallback(
    (path: string) => {
      const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
      setShowMoreMenu(false);
      navigate(fullPath);
    },
    [navigate, tenantId]
  );

  const isActive = useCallback(
    (path: string) => {
      const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
      return location.pathname === fullPath || location.pathname.startsWith(fullPath);
    },
    [location.pathname, tenantId]
  );

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

  const visibleItems = navigationItems.slice(0, MAX_PRIMARY_ITEMS);
  const overflowItems = navigationItems.slice(MAX_PRIMARY_ITEMS);

  const renderNavButton = (item: NavigationItemConfig, variant: 'primary' | 'dropdown' = 'primary') => (
    <button
      key={item.id}
      onClick={() => handleNavigation(item.path)}
      className={`flex flex-col items-center justify-center w-full py-4 transition-all ${
        isActive(item.path)
          ? 'bg-blue-600 text-white shadow-sm'
          : variant === 'primary'
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="text-2xl mb-1">{item.icon}</span>
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  );

  return (
    <div className="w-20 bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col items-center py-4 h-screen fixed left-0 top-0 z-20">
      <div className="w-14 h-14 bg-teal-400 rounded-full flex items-center justify-center text-white text-2xl mb-6">
        🏪
      </div>

      <div className="flex-1 flex flex-col items-center w-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center space-y-2 w-full overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2 w-full py-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-8 h-2 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            visibleItems.map((item) => renderNavButton(item))
          )}
        </div>

        {!isLoading && overflowItems.length > 0 && (
          <div className="w-full relative mt-2">
            <button
              ref={moreButtonRef}
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="flex flex-col items-center justify-center w-full py-4 text-gray-600 hover:bg-gray-100 transition-all"
              aria-haspopup="true"
              aria-expanded={showMoreMenu}
            >
              <span className="text-2xl mb-1">⋮</span>
              <span className="text-[10px] font-medium">More</span>
            </button>

            {showMoreMenu && (
              <div
                ref={moreMenuRef}
                className="absolute right-0 left-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-30"
              >
                {overflowItems.map((item) => (
                  <div key={item.id} className="px-2">
                    {renderNavButton(item, 'dropdown')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full mt-auto pt-2">
        <button
          onClick={handleLogoutClick}
          className="flex flex-col items-center justify-center w-full py-4 text-gray-600 hover:bg-gray-100 transition-all"
        >
          <span className="text-2xl mb-1">🔓</span>
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>

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
