import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import GeneralConfiguration from '../../components/admin/GeneralConfiguration/GeneralConfiguration';

const AdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <GeneralConfiguration />
    </AdminLayout>
  );
};

export default AdminPage;
