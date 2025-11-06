import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

const CustomersPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Customers"
          description="Build lasting relationships with a unified view of your shoppers and their visits."
        />

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Customer profiles and loyalty tools will appear here once the module is enabled.
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomersPage;
