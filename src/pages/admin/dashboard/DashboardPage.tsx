import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const DashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4 text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin dashboard.</p>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
