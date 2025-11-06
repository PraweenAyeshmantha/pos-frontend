import React, { memo } from 'react';
import SideNavigation from './SideNavigation';
import TopNavigation from './TopNavigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Side Navigation */}
      <SideNavigation />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <main className="ml-20 pt-16">
        <div className="px-4 pb-12 sm:px-8 lg:px-12">{children}</div>
      </main>
    </div>
  );
};

export default memo(AdminLayout);
