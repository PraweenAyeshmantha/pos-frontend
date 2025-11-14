import React from 'react';
import { useLocation } from 'react-router-dom';
import CashierSideNavigation from './CashierSideNavigation';
import TopNavigation from './TopNavigation';

interface CashierLayoutProps {
  children: React.ReactNode;
}

const CashierLayout: React.FC<CashierLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isPosRoute = location.pathname.includes('/cashier/pos');

  return (
    <div className={`min-h-screen bg-gray-100 ${isPosRoute ? 'overflow-hidden' : ''}`}>
      {!isPosRoute && (
        <>
          <CashierSideNavigation />
          <TopNavigation />
        </>
      )}

      {/* Exit button now rendered inside POS header controls */}

      <div className={`${isPosRoute ? 'h-screen' : 'ml-20 pt-16 min-h-screen'}`}>
        {children}
      </div>
    </div>
  );
};

export default CashierLayout;
