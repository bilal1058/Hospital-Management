import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Layout = () => {
  const { user, logout, isAdmin, isDoctor, canManagePatients, canManageBilling } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  // Role badge colors
  const getRoleBadge = () => {
    switch(user?.role) {
      case 'admin': return 'bg-danger';
      case 'doctor': return 'bg-success';
      case 'receptionist': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar d-flex flex-column p-3" style={{ width: '260px' }}>
        <div className="text-center mb-4 pt-3">
          <i className="bi bi-hospital fs-1 text-white"></i>
          <h5 className="text-white mt-2 mb-0">Hospital Management</h5>
          <small className="text-white-50">System v1.0</small>
        </div>
        
        <hr className="border-light opacity-25" />
        
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <i className="bi bi-speedometer2"></i>
              Dashboard
            </NavLink>
          </li>
          
          {/* Patients - Admin & Receptionist */}
          {canManagePatients() && (
            <li className="nav-item">
              <NavLink to="/patients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people"></i>
                Patients
              </NavLink>
            </li>
          )}
          
          {/* Doctors - Admin only for full access */}
          {isAdmin() && (
            <li className="nav-item">
              <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-badge"></i>
                Doctors
              </NavLink>
            </li>
          )}
          
          {/* Appointments - All roles but different views */}
          <li className="nav-item">
            <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-calendar-check"></i>
              {isDoctor() ? 'My Appointments' : 'Appointments'}
            </NavLink>
          </li>
          
          {/* Bills - Admin & Receptionist */}
          {canManageBilling() && (
            <li className="nav-item">
              <NavLink to="/bills" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-receipt"></i>
                Bills
              </NavLink>
            </li>
          )}
          
          {/* Prescriptions - All roles */}
          <li className="nav-item">
            <NavLink to="/prescriptions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-file-medical"></i>
              Prescriptions
            </NavLink>
          </li>

          {/* User Management - Admin only */}
          {isAdmin() && (
            <li className="nav-item">
              <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people-fill"></i>
                User Management
              </NavLink>
            </li>
          )}
        </ul>

        <hr className="border-light opacity-25" />
        
        <div className="text-center text-white-50 small">
          <p className="mb-0">© 2026 HMS</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4 py-3">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h5">
              <i className="bi bi-grid me-2"></i>
              Hospital Management System
            </span>
            <div className="d-flex align-items-center">
              <span className="text-muted me-3 d-none d-lg-block">
                <i className="bi bi-clock me-1"></i>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className={`badge ${getRoleBadge()} me-3`}>
                {user?.role?.toUpperCase()}
              </span>
              <div className="dropdown">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.full_name || 'User'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="px-3 py-2 text-muted small">
                    Signed in as <strong>{user?.username}</strong>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                      <i className="bi bi-person me-2"></i>Profile
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => navigate('/settings')}>
                      <i className="bi bi-gear me-2"></i>Settings
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
