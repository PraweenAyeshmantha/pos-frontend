import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/admin/AdminPage';
import DashboardPage from './pages/admin/dashboard/DashboardPage';
import CustomersPage from './pages/admin/customers/CustomersPage';
import OrdersPage from './pages/admin/orders/OrdersPage';
import StatisticsPage from './pages/admin/statistics/StatisticsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/customers" element={<CustomersPage />} />
        <Route path="/admin/orders" element={<OrdersPage />} />
        <Route path="/admin/statistics" element={<StatisticsPage />} />
        <Route path="/admin/configuration/general" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
