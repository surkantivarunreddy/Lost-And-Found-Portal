import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ReportLost, ReportFound } from './pages/ReportLost'; // ✅ Fixed: was './p ages/ReportLost'
import SearchItems from './pages/SearchItems';
import Dashboard from './pages/Dashboard';
import ItemDetail from './pages/ItemDetail';
import AdminDashboard from './pages/AdminDashboard';
 
// Redirect unauthenticated users to login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};
 
// Redirect non-admins to dashboard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};
 
const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<SearchItems />} />
      <Route path="/items/:id" element={<ItemDetail />} />
      <Route path="/report-lost" element={<ProtectedRoute><ReportLost /></ProtectedRoute>} />
      <Route path="/report-found" element={<ProtectedRoute><ReportFound /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Admin-only */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Footer />
  </>
);
 
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);
 
export default App;