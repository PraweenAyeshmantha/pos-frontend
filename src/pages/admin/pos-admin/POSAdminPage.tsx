import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { userHasScreenAccess } from '../../../utils/authRoles';

interface AdminTile {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  accentClass: string;
  screenCode: string;
}

interface AdminCategory {
  id: string;
  title: string;
  description: string;
  tiles: AdminTile[];
}

const POSAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo<AdminCategory[]>(
    () => [
      {
        id: 'insights-settings',
        title: 'Insights & Settings',
        description: 'Monitor business KPIs and keep global configuration aligned.',
        tiles: [
          {
            id: 'analytics',
            title: 'Analytics',
            description: 'Review sales trends, outlet performance, and other business KPIs.',
            path: '/admin/statistics',
            icon: '📊',
            accentClass: 'bg-indigo-100 text-indigo-600',
            screenCode: 'ADMIN_STATISTICS',
          },
          {
            id: 'configuration',
            title: 'Configuration',
            description: 'Update POS settings, integrations, and layout preferences.',
            path: '/admin/configuration/general',
            icon: '🛠️',
            accentClass: 'bg-emerald-100 text-emerald-600',
            screenCode: 'ADMIN_CONFIGURATION_GENERAL',
          },
          {
            id: 'stock-config',
            title: 'Stock Configuration',
            description: 'Configure stock management settings, thresholds, and alert preferences.',
            path: '/admin/stock-config',
            icon: '⚙️',
            accentClass: 'bg-slate-100 text-slate-600',
            screenCode: 'ADMIN_STOCK_CONFIG',
          },
        ],
      },
      {
        id: 'locations-service',
        title: 'Locations & Service',
        description: 'Manage outlets and in-store dining layouts.',
        tiles: [
          {
            id: 'outlets',
            title: 'Outlets',
            description: 'Manage store locations, addresses, and outlet-specific settings.',
            path: '/admin/outlets',
            icon: '🏪',
            accentClass: 'bg-amber-100 text-amber-600',
            screenCode: 'ADMIN_OUTLETS',
          },
          {
            id: 'tables',
            title: 'Tables',
            description: 'Configure dining tables, seating capacity, and availability per outlet.',
            path: '/admin/tables',
            icon: '🍽️',
            accentClass: 'bg-rose-100 text-rose-600',
            screenCode: 'ADMIN_TABLES',
          },
        ],
      },
      {
        id: 'catalog-taxonomy',
        title: 'Catalog & Taxonomy',
        description: 'Structure the menu, search metadata, and product attributes.',
        tiles: [
          {
            id: 'products',
            title: 'Products',
            description: 'View and manage your product catalog, prices, and barcodes.',
            path: '/admin/products',
            icon: '🛍️',
            accentClass: 'bg-cyan-100 text-cyan-600',
            screenCode: 'ADMIN_PRODUCTS',
          },
          {
            id: 'categories',
            title: 'Categories',
            description: 'Maintain product categories to organize menus and analytics.',
            path: '/admin/pos-admin/categories',
            icon: '📂',
            accentClass: 'bg-slate-100 text-slate-600',
            screenCode: 'ADMIN_POS_ADMIN_CATEGORIES',
          },
          {
            id: 'brands',
            title: 'Brands',
            description: 'Standardize product branding to streamline filters and reporting.',
            path: '/admin/pos-admin/brands',
            icon: '🏷️',
            accentClass: 'bg-fuchsia-100 text-fuchsia-600',
            screenCode: 'ADMIN_POS_ADMIN_BRANDS',
          },
          {
            id: 'tags',
            title: 'Tags',
            description: 'Create reusable tags for quick search, promotions, and product groupings.',
            path: '/admin/pos-admin/tags',
            icon: '🔖',
            accentClass: 'bg-lime-100 text-lime-600',
            screenCode: 'ADMIN_POS_ADMIN_TAGS',
          },
        ],
      },
      {
        id: 'inventory-tools',
        title: 'Inventory Tools',
        description: 'Assign identifiers, balance stock, and prevent outages.',
        tiles: [
          {
            id: 'assign-barcodes',
            title: 'Assign Barcodes',
            description: 'Assign and manage barcodes for products. Update barcodes and print labels.',
            path: '/admin/assign-barcodes',
            icon: '📊',
            accentClass: 'bg-purple-100 text-purple-600',
            screenCode: 'ADMIN_ASSIGN_BARCODES',
          },
          {
            id: 'assign-stocks',
            title: 'Assign Stocks',
            description: 'Manage product stock levels for your outlets. Update custom stock quantities.',
            path: '/admin/assign-stocks',
            icon: '📦',
            accentClass: 'bg-teal-100 text-teal-600',
            screenCode: 'ADMIN_ASSIGN_STOCKS',
          },
          {
            id: 'stock-alerts',
            title: 'Stock Alerts',
            description: 'Monitor low stock and out of stock alerts across your outlets.',
            path: '/admin/stock-alerts',
            icon: '🚨',
            accentClass: 'bg-amber-100 text-amber-600',
            screenCode: 'ADMIN_STOCK_ALERTS',
          },
        ],
      },
      {
        id: 'procurement',
        title: 'Procurement',
        description: 'Keep vendor master data current so receiving stays organized.',
        tiles: [
          {
            id: 'suppliers',
            title: 'Suppliers',
            description: 'Manage supplier contacts, tax IDs, and fulfillment preferences.',
            path: '/admin/suppliers',
            icon: '🤝',
            accentClass: 'bg-emerald-100 text-emerald-600',
            screenCode: 'ADMIN_SUPPLIERS',
          },
        ],
      },
      {
        id: 'promotions',
        title: 'Promotions',
        description: 'Launch and manage marketing incentives.',
        tiles: [
          {
            id: 'coupons',
            title: 'Coupons',
            description: 'Create and manage discount coupons to drive sales and customer loyalty.',
            path: '/admin/coupons',
            icon: '🎟️',
            accentClass: 'bg-orange-100 text-orange-600',
            screenCode: 'ADMIN_COUPONS',
          },
        ],
      },
      {
        id: 'workforce-cash',
        title: 'Workforce & Cash',
        description: 'Control staff access and reconcile daily balances.',
        tiles: [
          {
            id: 'users',
            title: 'Users',
            description: 'Create users, assign categories, and manage branch access.',
            path: '/admin/users',
            icon: '👤',
            accentClass: 'bg-blue-100 text-blue-600',
            screenCode: 'ADMIN_USERS',
          },
          {
            id: 'access-control',
            title: 'Access Control',
            description: 'Grant access to pages and UI capabilities.',
            path: '/admin/access',
            icon: '🔐',
            accentClass: 'bg-slate-100 text-slate-600',
            screenCode: 'ADMIN_USER_ACCESS',
          },
          {
            id: 'cashiers',
            title: 'Cashiers',
            description: 'Manage cashier accounts, credentials, and outlet assignments.',
            path: '/admin/cashiers',
            icon: '👥',
            accentClass: 'bg-sky-100 text-sky-600',
            screenCode: 'ADMIN_CASHIERS',
          },
          {
            id: 'cashier-balancing',
            title: 'Cashier Balancing',
            description: 'Monitor and manage cashier sessions, balances, and cash transactions.',
            path: '/admin/cashier-balancing',
            icon: '💰',
            accentClass: 'bg-green-100 text-green-600',
            screenCode: 'ADMIN_CASHIER_BALANCING',
          },
        ],
      },
    ],
    [],
  );

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const hasKeyword = keyword.length > 0;

    return categories
      .map((category) => ({
        ...category,
        tiles: category.tiles.filter((tile) => {
          if (!userHasScreenAccess(user, tile.screenCode)) {
            return false;
          }
          if (!hasKeyword) {
            return true;
          }
          return (
            tile.title.toLowerCase().includes(keyword) ||
            tile.description.toLowerCase().includes(keyword) ||
            category.title.toLowerCase().includes(keyword)
          );
        }),
      }))
      .filter((category) => category.tiles.length > 0);
  }, [categories, searchTerm, user]);

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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-gray-700" htmlFor="tiles-search">
            Search admin tools
          </label>
          <input
            id="tiles-search"
            type="search"
            placeholder="Search by name, purpose, or category..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-md"
          />
        </div>

        <div className="flex flex-col gap-10">
          {filteredCategories.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
              No admin tools match "<span className="font-medium text-gray-800">{searchTerm}</span>".
              Try another keyword.
            </div>
          )}

          {filteredCategories.map((category) => (
            <section key={category.id} className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{category.title}</h2>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {category.tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleTileClick(tile.path)}
                    className="group h-full rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg focus:-translate-y-1 focus:border-blue-500 focus:shadow-lg focus:outline-none"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${tile.accentClass}`}
                    >
                      <span>{tile.icon}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-gray-800">{tile.title}</h3>
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
            </section>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default POSAdminPage;
