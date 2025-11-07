import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

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
  const { tenantId } = useParams<{ tenantId: string }>();

  const tiles = useMemo<AdminTile[]>(
    () => [
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Review sales trends, outlet performance, and other business KPIs.',
        path: '/admin/statistics',
        icon: '📊',
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
      {
        id: 'products',
        title: 'Products',
        description: 'View and manage your product catalog, prices, and barcodes.',
        path: '/admin/products',
        icon: '🛍️',
        accentClass: 'bg-cyan-100 text-cyan-600',
      },
      {
        id: 'coupons',
        title: 'Coupons',
        description: 'Create and manage discount coupons to drive sales and customer loyalty.',
        path: '/admin/coupons',
        icon: '🎟️',
        accentClass: 'bg-orange-100 text-orange-600',
      },
      {
        id: 'brands',
        title: 'Brands',
        description: 'Standardize product branding to streamline filters and reporting.',
        path: '/admin/pos-admin/brands',
        icon: '🏷️',
        accentClass: 'bg-fuchsia-100 text-fuchsia-600',
      },
      {
        id: 'tags',
        title: 'Tags',
        description: 'Create reusable tags for quick search, promotions, and product groupings.',
        path: '/admin/pos-admin/tags',
        icon: '🔖',
        accentClass: 'bg-lime-100 text-lime-600',
      },
      {
        id: 'categories',
        title: 'Categories',
        description: 'Maintain product categories to organize menus and analytics.',
        path: '/admin/pos-admin/categories',
        icon: '📂',
        accentClass: 'bg-slate-100 text-slate-600',
      },
      {
        id: 'cashiers',
        title: 'Cashiers',
        description: 'Manage cashier accounts, credentials, and outlet assignments.',
        path: '/admin/cashiers',
        icon: '👥',
        accentClass: 'bg-sky-100 text-sky-600',
      },
      {
        id: 'tables',
        title: 'Tables',
        description: 'Configure dining tables, seating capacity, and availability per outlet.',
        path: '/admin/tables',
        icon: '🍽️',
        accentClass: 'bg-rose-100 text-rose-600',
      },
      {
        id: 'assign-barcodes',
        title: 'Assign Barcodes',
        description: 'Assign and manage barcodes for products. Update barcodes and print labels.',
        path: '/admin/assign-barcodes',
        icon: '📊',
        accentClass: 'bg-purple-100 text-purple-600',
      },
      {
        id: 'assign-stocks',
        title: 'Assign Stocks',
        description: 'Manage product stock levels for your outlets. Update custom stock quantities.',
        path: '/admin/assign-stocks',
        icon: '📦',
        accentClass: 'bg-teal-100 text-teal-600',
      },
    ],
    [],
  );

  const handleTileClick = useCallback(
    (path: string) => {
      const fullPath = tenantId ? `/posai/${tenantId}${path}` : path;
      navigate(fullPath);
    },
    [navigate, tenantId],
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="POS Admin"
          description="Centralize your administrative tasks, fine-tune configuration, and keep operations running smoothly."
        />

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile.path)}
              className="group h-full rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg focus:-translate-y-1 focus:border-blue-500 focus:shadow-lg focus:outline-none"
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
