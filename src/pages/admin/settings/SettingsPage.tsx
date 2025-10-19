import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const SettingsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Settings</h1>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-gray-600">Settings page will be implemented here.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
