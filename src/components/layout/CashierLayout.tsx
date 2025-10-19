import React from 'react';
import CashierSideNavigation from './CashierSideNavigation';
import TopNavigation from './TopNavigation';

interface CashierLayoutProps {
  children: React.ReactNode;
}

const CashierLayout: React.FC<CashierLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Side Navigation */}
      <CashierSideNavigation />
      
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main Content */}
      <div className="ml-20 pt-14">
        {children}
      </div>
    </div>
  );
};

export default CashierLayout;
