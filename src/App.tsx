import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { OutletProvider } from './contexts/OutletContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TenantRouteGuard from './components/auth/TenantRouteGuard';
import EnvConfigErrorPage from './components/errors/EnvConfigErrorPage';
import InvalidUrlErrorPage from './components/errors/InvalidUrlErrorPage';
import env from './config/env';
import { useAuth } from './hooks/useAuth';
import { getDefaultTenantPath } from './utils/authRoles';
import ScrollToTop from './components/layout/ScrollToTop';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const DashboardPage = lazy(() => import('./pages/admin/dashboard/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/admin/customers/CustomersPage'));
const OrdersPage = lazy(() => import('./pages/admin/orders/OrdersPage'));
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'));
const POSAdminPage = lazy(() => import('./pages/admin/pos-admin/POSAdminPage'));
const OutletsPage = lazy(() => import('./pages/admin/outlets/OutletsPage'));
const CashiersPage = lazy(() => import('./pages/admin/cashiers/CashiersPage'));
const CashierBalancingPage = lazy(() => import('./pages/admin/cashier-balancing/CashierBalancingPage'));
const TablesPage = lazy(() => import('./pages/admin/tables/TablesPage'));
const ProductsPage = lazy(() => import('./pages/admin/products/ProductsPage'));
const CouponsPage = lazy(() => import('./pages/admin/coupons/CouponsPage'));
const LoyaltyProgramPage = lazy(() => import('./pages/admin/loyalty/LoyaltyProgramPage'));
const GiftCardsPage = lazy(() => import('./pages/admin/gift-cards/GiftCardsPage'));
const AssignBarcodesPage = lazy(() => import('./pages/admin/assign-barcodes/AssignBarcodesPage'));
const AssignStocksPage = lazy(() => import('./pages/admin/assign-stocks/AssignStocksPage'));
const StockAlertsPage = lazy(() => import('./pages/admin/stock-alerts/StockAlertsPage'));
const StockConfigPage = lazy(() => import('./pages/admin/stock-config/StockConfigPage'));
const InventoryControlPage = lazy(() => import('./pages/admin/inventory-control/InventoryControlPage'));
const SuppliersPage = lazy(() => import('./pages/admin/suppliers/SuppliersPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/admin/purchasing/PurchaseOrdersPage'));
const SupplierCatalogPage = lazy(() => import('./pages/admin/purchasing/SupplierCatalogPage'));
const BrandsPage = lazy(() => import('./pages/admin/taxonomy/BrandsPage'));
const TagsPage = lazy(() => import('./pages/admin/taxonomy/TagsPage'));
const ProductCategoriesPage = lazy(() => import('./pages/admin/taxonomy/ProductCategoriesPage'));
const UsersPage = lazy(() => import('./pages/admin/users/UsersPage'));
const UserAccessPage = lazy(() => import('./pages/admin/access/UserAccessPage'));
const CashierPOSPage = lazy(() => import('./pages/cashier/CashierPOSPage'));
const CashierDashboardPage = lazy(() => import('./pages/cashier/CashierDashboardPage'));
const SharedStatisticsPage = lazy(() => import('./pages/cashier/StatisticsPage'));
const CashierBalancingPageCashier = lazy(() => import('./pages/cashier/CashierBalancingPage'));
const GoodsReceivedNotesPage = lazy(() => import('./pages/cashier/GoodsReceivedNotesPage'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const TenantLanding = () => {
  const { user } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();
  const target = getDefaultTenantPath(user, tenantId);
  return <Navigate to={target} replace />;
};

function App() {
  // Check if environment is properly configured
  if (!env.isValid) {
    return <EnvConfigErrorPage errorMessage={env.errorMessage} />;
  }

  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <OutletProvider>
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Redirect root to error - tenant ID required */}
            <Route path="/" element={
              <TenantRouteGuard>
                <Navigate to="/posai/missing-tenant" replace />
              </TenantRouteGuard>
            } />
            
            {/* All routes now require /posai/{tenantId} prefix */}
            <Route path="/posai/:tenantId/*" element={
              <TenantRouteGuard>
                <TenantProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="login" element={<LoginPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="reset-password" element={
                      <ProtectedRoute>
                        <ResetPasswordPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/" element={
                      <ProtectedRoute>
                        <TenantLanding />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/dashboard" element={
                      <ProtectedRoute screenCode="ADMIN_DASHBOARD">
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/customers" element={
                      <ProtectedRoute screenCode="SHARED_CUSTOMERS">
                        <CustomersPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/cashiers" element={
                      <ProtectedRoute screenCode="ADMIN_CASHIERS">
                        <CashiersPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/cashier-balancing" element={
                      <ProtectedRoute screenCode="ADMIN_CASHIER_BALANCING">
                        <CashierBalancingPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/orders" element={
                      <ProtectedRoute screenCode="SHARED_ORDERS">
                        <OrdersPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/pos-admin" element={
                      <ProtectedRoute screenCode="ADMIN_POS_ADMIN">
                        <POSAdminPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/outlets" element={
                      <ProtectedRoute screenCode="ADMIN_OUTLETS">
                        <OutletsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/tables" element={
                      <ProtectedRoute screenCode="ADMIN_TABLES">
                        <TablesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/products" element={
                      <ProtectedRoute screenCode="ADMIN_PRODUCTS">
                        <ProductsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/suppliers" element={
                      <ProtectedRoute screenCode="ADMIN_SUPPLIERS">
                        <SuppliersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="admin/procurement/purchase-orders" element={
                      <ProtectedRoute screenCode="ADMIN_PURCHASE_ORDERS">
                        <PurchaseOrdersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="admin/procurement/vendor-catalog" element={
                      <ProtectedRoute screenCode="ADMIN_VENDOR_CATALOG">
                        <SupplierCatalogPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/coupons" element={
                      <ProtectedRoute screenCode="ADMIN_COUPONS">
                        <CouponsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/loyalty" element={
                      <ProtectedRoute screenCode="ADMIN_LOYALTY">
                        <LoyaltyProgramPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/gift-cards" element={
                      <ProtectedRoute screenCode="ADMIN_GIFT_CARDS">
                        <GiftCardsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/assign-barcodes" element={
                      <ProtectedRoute screenCode="ADMIN_ASSIGN_BARCODES">
                        <AssignBarcodesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/assign-stocks" element={
                      <ProtectedRoute screenCode="ADMIN_ASSIGN_STOCKS">
                        <AssignStocksPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/stock-alerts" element={
                      <ProtectedRoute screenCode="ADMIN_STOCK_ALERTS">
                        <StockAlertsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/stock-config" element={
                      <ProtectedRoute screenCode="ADMIN_STOCK_CONFIG">
                        <StockConfigPage />
                      </ProtectedRoute>
                    } />
                    <Route path="admin/inventory/control" element={
                      <ProtectedRoute screenCode="ADMIN_INVENTORY_CONTROL">
                        <InventoryControlPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/brands" element={
                      <ProtectedRoute screenCode="ADMIN_POS_ADMIN_BRANDS">
                        <BrandsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/tags" element={
                      <ProtectedRoute screenCode="ADMIN_POS_ADMIN_TAGS">
                        <TagsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/categories" element={
                      <ProtectedRoute screenCode="ADMIN_POS_ADMIN_CATEGORIES">
                        <ProductCategoriesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/statistics" element={
                      <ProtectedRoute screenCode="ADMIN_STATISTICS">
                        <SharedStatisticsPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/configuration/general" element={
                      <ProtectedRoute screenCode="ADMIN_CONFIGURATION_GENERAL">
                        <AdminPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/settings" element={
                      <ProtectedRoute screenCode="SHARED_SETTINGS">
                        <SettingsPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/users" element={
                      <ProtectedRoute screenCode="ADMIN_USERS">
                        <UsersPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/access" element={
                      <ProtectedRoute screenCode="ADMIN_USER_ACCESS">
                        <UserAccessPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier" element={<Navigate to="cashier/dashboard" replace />} />

                    <Route path="cashier/dashboard" element={
                      <ProtectedRoute screenCode="CASHIER_DASHBOARD">
                        <CashierDashboardPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier/statistics" element={
                      <ProtectedRoute screenCode="CASHIER_STATISTICS">
                        <SharedStatisticsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier/pos" element={
                      <ProtectedRoute screenCode="CASHIER_POS">
                        <CashierPOSPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier/goods-received" element={
                      <ProtectedRoute screenCode="CASHIER_GOODS_RECEIVED">
                        <GoodsReceivedNotesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier/balancing" element={
                      <ProtectedRoute screenCode="CASHIER_BALANCING">
                        <CashierBalancingPageCashier />
                      </ProtectedRoute>
                    } />

                    {/* Catch-all for invalid URLs within tenant scope */}
                    <Route path="*" element={<InvalidUrlErrorPage />} />
                  </Routes>
                </TenantProvider>
              </TenantRouteGuard>
            } />

            {/* Catch-all for any other invalid URLs */}
            <Route path="*" element={<InvalidUrlErrorPage />} />
          </Routes>
        </Suspense>
        </OutletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
