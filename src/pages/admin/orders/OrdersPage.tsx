import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

const OrdersPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Orders"
          description="Review, fulfill, and reconcile POS orders across channels in real time."
        />

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Order management is coming soon. Connect your sales channels to populate this workspace.
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
