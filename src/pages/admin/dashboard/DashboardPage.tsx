import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

const DashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Dashboard"
          description="Monitor the health of your locations, discover trends, and act quickly on live POS insights."
        />

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Dashboard widgets are on the way. Configure analytics in the meantime to unlock real-time visibility.
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
