import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AdminPage from './pages/admin/AdminPage';
import DashboardPage from './pages/admin/dashboard/DashboardPage';
import CustomersPage from './pages/admin/customers/CustomersPage';
import OrdersPage from './pages/admin/orders/OrdersPage';
import StatisticsPage from './pages/admin/statistics/StatisticsPage';
import SettingsPage from './pages/admin/settings/SettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/reset-password" element={
            <ProtectedRoute>
              <ResetPasswordPage />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/customers" element={
            <ProtectedRoute>
              <CustomersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/statistics" element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/configuration/general" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
