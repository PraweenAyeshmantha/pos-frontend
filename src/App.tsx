import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TenantRouteGuard from './components/auth/TenantRouteGuard';

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

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
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
                    
                    <Route path="/" element={<Navigate to="admin/dashboard" replace />} />
                    
                    <Route path="admin/dashboard" element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/customers" element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/orders" element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/pos-admin" element={
                      <ProtectedRoute>
                        <POSAdminPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/outlets" element={
                      <ProtectedRoute>
                        <OutletsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="admin/statistics" element={
                      <ProtectedRoute>
                        <StatisticsPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/configuration/general" element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="admin/settings" element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </TenantProvider>
              </TenantRouteGuard>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
