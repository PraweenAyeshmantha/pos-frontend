import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';

interface AdminTile {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  accentClass: string;
}

const POSAdminPage: React.FC = () => {
  const navigate = useNavigate();

  const tiles = useMemo<AdminTile[]>(
    () => [
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Review sales trends, outlet performance, and other business KPIs.',
        path: '/admin/statistics',
        icon: '�',
        accentClass: 'bg-indigo-100 text-indigo-600',
      },
      {
        id: 'configuration',
        title: 'Configuration',
        description: 'Update POS settings, integrations, and layout preferences.',
        path: '/admin/configuration/general',
        icon: '🛠️',
        accentClass: 'bg-emerald-100 text-emerald-600',
      },
      {
        id: 'outlets',
        title: 'Outlets',
        description: 'Manage store locations, addresses, and outlet-specific settings.',
        path: '/admin/outlets',
        icon: '🏪',
        accentClass: 'bg-amber-100 text-amber-600',
      },
    ],
    [],
  );

  const handleTileClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100 px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">POS Admin</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Centralize your administrative tasks, fine-tune configuration, and keep operations running smoothly.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile.path)}
              className="group h-full rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-transform hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg focus:-translate-y-1 focus:border-blue-500 focus:shadow-lg focus:outline-none"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${tile.accentClass}`}>
                <span>{tile.icon}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-800">{tile.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{tile.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-blue-600">
                Manage
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default POSAdminPage;
