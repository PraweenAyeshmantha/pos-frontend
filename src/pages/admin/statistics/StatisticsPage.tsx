import React from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';

const StatisticsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4 text-gray-800">Statistics</h1>
        <p className="text-gray-600">View sales statistics and reports here.</p>
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
