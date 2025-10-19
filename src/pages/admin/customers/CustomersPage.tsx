import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const CustomersPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4 text-gray-800">Customers</h1>
        <p className="text-gray-600">Manage your customers here.</p>
      </div>
    </AdminLayout>
  );
};

export default CustomersPage;
