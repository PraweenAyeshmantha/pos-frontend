import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

const SettingsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Settings"
          description="Control global preferences, integrations, and rollout policies across every outlet."
        />

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Settings management is in progress. Visit Configuration to adjust POS modules for now.
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
