import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    hospitalName: 'City Hospital',
    email: 'info@cityhospital.com',
    phone: '03001234567',
    address: 'Main Boulevard, Islamabad, Pakistan',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    appointmentDuration: '30',
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMS: false,
    darkMode: false,
    language: 'en'
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = () => {
    localStorage.setItem('hospitalSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-gear me-2"></i>
          Settings
        </h4>
        <button className="btn btn-primary" onClick={handleSave}>
          <i className="bi bi-check-lg me-1"></i> Save Changes
        </button>
      </div>

      <div className="row">
        {/* Settings Navigation */}
        <div className="col-lg-3 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'general' ? 'active' : ''}`}
                  onClick={() => setActiveTab('general')}
                >
                  <i className="bi bi-building me-3"></i>
                  General
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="bi bi-bell me-3"></i>
                  Notifications
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  <i className="bi bi-calendar me-3"></i>
                  Appointments
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'appearance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  <i className="bi bi-palette me-3"></i>
                  Appearance
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <i className="bi bi-shield-lock me-3"></i>
                  Security
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-lg-9">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>
                  General Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Hospital Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="hospitalName"
                      value={settings.hospitalName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={settings.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={settings.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Currency</label>
                    <select
                      className="form-select"
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                    >
                      <option value="PKR">PKR - Pakistani Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      rows="2"
                      value={settings.address}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Timezone</label>
                    <select
                      className="form-select"
                      name="timezone"
                      value={settings.timezone}
                      onChange={handleChange}
                    >
                      <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Language</label>
                    <select
                      className="form-select"
                      name="language"
                      value={settings.language}
                      onChange={handleChange}
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-bell me-2"></i>
                  Notification Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableNotifications"
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="enableNotifications">
                    <strong>Enable Push Notifications</strong>
                    <p className="text-muted small mb-0">Receive notifications for appointments, bills, etc.</p>
                  </label>
                </div>
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableEmailAlerts"
                    name="enableEmailAlerts"
                    checked={settings.enableEmailAlerts}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="enableEmailAlerts">
                    <strong>Email Alerts</strong>
                    <p className="text-muted small mb-0">Receive email notifications for important updates</p>
                  </label>
                </div>
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableSMS"
                    name="enableSMS"
                    checked={settings.enableSMS}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="enableSMS">
                    <strong>SMS Notifications</strong>
                    <p className="text-muted small mb-0">Send SMS reminders to patients</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Settings */}
          {activeTab === 'appointments' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar me-2"></i>
                  Appointment Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Default Appointment Duration (minutes)</label>
                    <select
                      className="form-select"
                      name="appointmentDuration"
                      value={settings.appointmentDuration}
                      onChange={handleChange}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                </div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Appointment slots are automatically generated based on doctor availability and this duration setting.
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-palette me-2"></i>
                  Appearance Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="darkMode"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="darkMode">
                    <strong>Dark Mode</strong>
                    <p className="text-muted small mb-0">Enable dark theme for the application</p>
                  </label>
                </div>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Dark mode is coming soon in the next update.
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Security Settings
                </h5>
              </div>
              <div className="card-body">
                <h6>Change Password</h6>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-control" placeholder="Enter current password" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-control" placeholder="Enter new password" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-control" placeholder="Confirm new password" />
                  </div>
                </div>
                <button className="btn btn-warning">
                  <i className="bi bi-key me-1"></i> Update Password
                </button>
                
                <hr className="my-4" />
                
                <h6>Session Management</h6>
                <p className="text-muted">You are currently logged in on this device.</p>
                <button className="btn btn-outline-danger">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout All Devices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
