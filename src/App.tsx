import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TenantRouteGuard from './components/auth/TenantRouteGuard';
import EnvConfigErrorPage from './components/errors/EnvConfigErrorPage';
import InvalidUrlErrorPage from './components/errors/InvalidUrlErrorPage';
import env from './config/env';
import { useAuth } from './hooks/useAuth';
import { getDefaultTenantPath } from './utils/authRoles';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const DashboardPage = lazy(() => import('./pages/admin/dashboard/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/admin/customers/CustomersPage'));
const OrdersPage = lazy(() => import('./pages/admin/orders/OrdersPage'));
const StatisticsPage = lazy(() => import('./pages/admin/statistics/StatisticsPage'));
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'));
const POSAdminPage = lazy(() => import('./pages/admin/pos-admin/POSAdminPage'));
const OutletsPage = lazy(() => import('./pages/admin/outlets/OutletsPage'));
const CashiersPage = lazy(() => import('./pages/admin/cashiers/CashiersPage'));
const TablesPage = lazy(() => import('./pages/admin/tables/TablesPage'));
const ProductsPage = lazy(() => import('./pages/admin/products/ProductsPage'));
const CouponsPage = lazy(() => import('./pages/admin/coupons/CouponsPage'));
const AssignBarcodesPage = lazy(() => import('./pages/admin/assign-barcodes/AssignBarcodesPage'));
const AssignStocksPage = lazy(() => import('./pages/admin/assign-stocks/AssignStocksPage'));
const BrandsPage = lazy(() => import('./pages/admin/taxonomy/BrandsPage'));
const TagsPage = lazy(() => import('./pages/admin/taxonomy/TagsPage'));
const ProductCategoriesPage = lazy(() => import('./pages/admin/taxonomy/ProductCategoriesPage'));
const CashierPOSPage = lazy(() => import('./pages/cashier/CashierPOSPage'));
const CashierDashboardPage = lazy(() => import('./pages/cashier/CashierDashboardPage'));

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
      <AuthProvider>
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
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/customers" element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                        <CustomersPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/cashiers" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CashiersPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/orders" element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                        <OrdersPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/pos-admin" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <POSAdminPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/outlets" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <OutletsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/tables" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <TablesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/products" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ProductsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/coupons" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CouponsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/assign-barcodes" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AssignBarcodesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/assign-stocks" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AssignStocksPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/brands" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <BrandsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/tags" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <TagsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/pos-admin/categories" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ProductCategoriesPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/statistics" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <StatisticsPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/configuration/general" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminPage />
                      </ProtectedRoute>
                    } />
                   
                    <Route path="admin/settings" element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                        <SettingsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier" element={<Navigate to="cashier/dashboard" replace />} />

                    <Route path="cashier/dashboard" element={
                      <ProtectedRoute allowedRoles={['CASHIER']}>
                        <CashierDashboardPage />
                      </ProtectedRoute>
                    } />

                    <Route path="cashier/pos" element={
                      <ProtectedRoute allowedRoles={['CASHIER']}>
                        <CashierPOSPage />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
