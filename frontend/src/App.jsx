import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Bills from './pages/Bills';
import Prescriptions from './pages/Prescriptions';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Users from './pages/Users';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Route Protection
const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  
  return children;
};

const StaffRoute = ({ children }) => {
  const { user, canManageBilling } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageBilling()) return <Navigate to="/" replace />;
  
  return children;
};

const PatientsRoute = ({ children }) => {
  const { user, canManagePatients } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!canManagePatients()) return <Navigate to="/" replace />;
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientsRoute><Patients /></PatientsRoute>} />
        <Route path="doctors" element={<AdminRoute><Doctors /></AdminRoute>} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="bills" element={<StaffRoute><Bills /></StaffRoute>} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
