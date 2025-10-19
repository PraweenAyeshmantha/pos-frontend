import React from 'react';
import SideNavigation from './SideNavigation';
import TopNavigation from './TopNavigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Side Navigation */}
      <SideNavigation />
      
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main Content */}
      <div className="ml-24 pt-16">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
