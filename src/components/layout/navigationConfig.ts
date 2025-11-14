import type { User } from '../../types/auth';
import { getPosPortalLabel, userHasScreenAccess } from '../../utils/authRoles';

export type NavigationArea = 'admin' | 'cashier';

export interface NavigationItemConfig {
  id: string;
  label: string;
  icon: string;
  path: string;
  screenCode: string;
  area: NavigationArea;
  priority: number;
}

// Keep in sync with shortcuts surfaced on POSAdminPage so we don't duplicate entries in the sidebar.
const POS_ADMIN_PAGE_PATHS = new Set<string>([
  '/admin/statistics',
  '/admin/configuration/general',
  '/admin/stock-config',
  '/admin/outlets',
  '/admin/tables',
  '/admin/products',
  '/admin/pos-admin/categories',
  '/admin/pos-admin/brands',
  '/admin/pos-admin/tags',
  '/admin/assign-barcodes',
  '/admin/assign-stocks',
  '/admin/stock-alerts',
  '/admin/inventory/control',
  '/admin/suppliers',
  '/admin/procurement/purchase-orders',
  '/admin/procurement/vendor-catalog',
  '/admin/coupons',
  '/admin/users',
  '/admin/access',
  '/admin/cashiers',
  '/admin/cashier-balancing',
]);

const BASE_ITEMS: NavigationItemConfig[] = [
  { id: 'admin-home', label: 'Home', icon: '🏠', path: '/admin/dashboard', screenCode: 'ADMIN_DASHBOARD', area: 'admin', priority: 10 },
  { id: 'admin-pos-admin', label: 'POS Admin', icon: '🗂️', path: '/admin/pos-admin', screenCode: 'ADMIN_POS_ADMIN', area: 'admin', priority: 20 },
  { id: 'admin-users', label: 'Users', icon: '👤', path: '/admin/users', screenCode: 'ADMIN_USERS', area: 'admin', priority: 30 },
  { id: 'admin-access', label: 'Access', icon: '🔐', path: '/admin/access', screenCode: 'ADMIN_USER_ACCESS', area: 'admin', priority: 40 },
  { id: 'admin-customers', label: 'Customers', icon: '👥', path: '/admin/customers', screenCode: 'SHARED_CUSTOMERS', area: 'admin', priority: 50 },
  { id: 'admin-orders', label: 'Orders', icon: '🛍️', path: '/admin/orders', screenCode: 'SHARED_ORDERS', area: 'admin', priority: 60 },
  { id: 'admin-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings', screenCode: 'SHARED_SETTINGS', area: 'admin', priority: 90 },
  { id: 'cashier-home', label: 'POS Home', icon: '🏠', path: '/cashier/dashboard', screenCode: 'CASHIER_DASHBOARD', area: 'cashier', priority: 10 },
  { id: 'cashier-pos', label: 'POS', icon: '🛒', path: '/cashier/pos', screenCode: 'CASHIER_POS', area: 'cashier', priority: 20 },
  { id: 'cashier-balancing', label: 'Balance', icon: '💰', path: '/cashier/balancing', screenCode: 'CASHIER_BALANCING', area: 'cashier', priority: 30 },
  { id: 'cashier-orders', label: 'Sales', icon: '🛍️', path: '/admin/orders', screenCode: 'SHARED_ORDERS', area: 'cashier', priority: 40 },
  { id: 'cashier-customers', label: 'Customers', icon: '👥', path: '/admin/customers', screenCode: 'SHARED_CUSTOMERS', area: 'cashier', priority: 50 },
  { id: 'cashier-statistics', label: 'Statistics', icon: '$', path: '/cashier/statistics', screenCode: 'CASHIER_STATISTICS', area: 'cashier', priority: 60 },
  { id: 'cashier-settings', label: 'Settings', icon: '⚙️', path: '/admin/settings', screenCode: 'SHARED_SETTINGS', area: 'cashier', priority: 90 },
];

export const buildNavigationItems = (user: User | null, areas: NavigationArea[] = ['admin', 'cashier']) => {
  const areaSet = new Set(areas);
  let workingItems = BASE_ITEMS.filter(
    (item) =>
      areaSet.has(item.area) &&
      userHasScreenAccess(user, item.screenCode) &&
      !(item.area === 'admin' && POS_ADMIN_PAGE_PATHS.has(item.path))
  );

  if (workingItems.length === 0 && user && areaSet.has('cashier')) {
    workingItems = BASE_ITEMS.filter((item) => item.area === 'cashier' && userHasScreenAccess(user, item.screenCode));
  }

  const seenPaths = new Set<string>();
  return workingItems
    .map((item) => (item.id === 'admin-pos-admin' ? { ...item, label: getPosPortalLabel(user) } : item))
    .sort((a, b) => a.priority - b.priority)
    .filter((item) => {
      if (seenPaths.has(item.path)) {
        return false;
      }
      seenPaths.add(item.path);
      return true;
    });
};
