import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const demoAccounts = {
  admin: {
    label: 'Admin',
    username: 'admin',
    password: 'admin123',
  },
  receptionist: {
    label: 'Receptionist',
    username: 'receptionist',
    password: 'reception123',
  },
  doctor: {
    label: 'Doctor',
    username: 'dr.ahmed',
    password: 'doctor123',
  },
};

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [username, setUsername] = useState(demoAccounts.admin.username);
  const [password, setPassword] = useState(demoAccounts.admin.password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setUsername(demoAccounts[role].username);
    setPassword(demoAccounts[role].password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="bi bi-hospital fs-1 text-primary"></i>
                  <h3 className="mt-2 mb-1">Hospital Management</h3>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                <div className="alert alert-info small mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-person-badge me-2"></i>
                    <strong>Quick Test Login</strong>
                  </div>
                  <label className="form-label mb-1">Select Account</label>
                  <select
                    className="form-select form-select-sm mb-3"
                    value={selectedRole}
                    onChange={handleDemoRoleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Doctor</option>
                  </select>
                  <div>Username: <code>{demoAccounts[selectedRole].username}</code></div>
                  <div>Password: <code>{demoAccounts[selectedRole].password}</code></div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-top">
                  <p className="text-muted small mb-2"><strong>System Roles:</strong></p>
                  <ul className="text-muted small mb-0 ps-3">
                    <li><strong>Admin:</strong> Full access, manage all modules</li>
                    <li><strong>Doctor:</strong> View own appointments and own prescriptions</li>
                    <li><strong>Receptionist:</strong> Manage patients, appointments, and billing</li>
                  </ul>
                </div>

                <div className="text-center mt-4 pt-3 border-top">
                  <small className="text-muted">
                    © 2026 Hospital Management System
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
