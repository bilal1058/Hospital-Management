import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(formData);
    setLoading(false);
    
    if (result.success) {
      setEditing(false);
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.message);
    }
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
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-person-circle me-2"></i>
          My Profile
        </h4>
      </div>

      <div className="row">
        {/* Profile Card */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                   style={{ width: '120px', height: '120px' }}>
                <i className="bi bi-person-fill text-primary" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="mb-1">{user?.full_name}</h4>
              <p className="text-muted mb-3">@{user?.username}</p>
              <span className={`badge ${getRoleBadge()}`}>
                {user?.role?.toUpperCase()}
              </span>
              {user?.is_active && (
                <span className="badge bg-success ms-2">
                  <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                  Active
                </span>
              )}
            </div>
            {user?.role === 'doctor' && user?.doctor_id && (
              <div className="card-footer bg-white border-top text-center">
                <small className="text-muted">Linked Doctor ID: {user.doctor_id}</small>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Profile Information
              </h5>
              {!editing && (
                <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
                  <i className="bi bi-pencil me-1"></i> Edit
                </button>
              )}
            </div>
            <div className="card-body">
              {editing ? (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="03001234567"
                        pattern="^03\d{9}$"
                        title="11 digits starting with 03"
                      />
                      <small className="text-muted">11 digits starting with 03</small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</>
                      ) : (
                        <><i className="bi bi-check-lg me-1"></i> Save Changes</>
                      )}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Full Name</label>
                    <p className="mb-0 fw-medium">{user?.full_name}</p>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Username</label>
                    <p className="mb-0 fw-medium">{user?.username}</p>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Email</label>
                    <p className="mb-0 fw-medium">{user?.email}</p>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Phone</label>
                    <p className="mb-0 fw-medium">{user?.phone || 'Not set'}</p>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Role</label>
                    <p className="mb-0 fw-medium">
                      <span className={`badge ${getRoleBadge()}`}>{user?.role?.toUpperCase()}</span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="text-muted small">Account Status</label>
                    <p className="mb-0 fw-medium">
                      <span className={`badge ${user?.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small">Last Login</label>
                    <p className="mb-0 fw-medium">
                      {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role Permissions Card */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-shield-check me-2"></i>
                Your Permissions
              </h5>
            </div>
            <div className="card-body">
              {user?.role === 'admin' && (
                <ul className="list-unstyled mb-0">
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Full access to all modules</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Manage users and system settings</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>View all appointments</li>
                  <li><i className="bi bi-x-circle text-danger me-2"></i>Cannot perform doctor-specific actions (prescriptions)</li>
                </ul>
              )}
              {user?.role === 'doctor' && (
                <ul className="list-unstyled mb-0">
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>View and manage your own appointments</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Create prescriptions for your patients</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Update appointment status</li>
                  <li><i className="bi bi-x-circle text-danger me-2"></i>Cannot view other doctors' appointments</li>
                </ul>
              )}
              {user?.role === 'receptionist' && (
                <ul className="list-unstyled mb-0">
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Manage patient records</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Schedule and manage appointments</li>
                  <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Handle billing and payments</li>
                  <li><i className="bi bi-x-circle text-danger me-2"></i>Cannot manage doctors or system users</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
