import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/admin/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/configuration/general" replace />} />
        <Route path="/admin/configuration/general" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
