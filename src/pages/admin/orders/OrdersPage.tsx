import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const OrdersPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4 text-gray-800">Orders</h1>
        <p className="text-gray-600">View and manage orders here.</p>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
