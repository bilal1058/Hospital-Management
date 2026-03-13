import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, doctorAPI, appointmentAPI, billAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { isAdmin, isDoctor, canManageBilling } = useAuth();
  const adminMode = isAdmin();
  const doctorMode = isDoctor();
  const billingMode = canManageBilling();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingBills: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, billsRes] = await Promise.all([
        adminMode ? patientAPI.getAll() : Promise.resolve({ data: [] }),
        doctorAPI.getAll(),
        appointmentAPI.getToday(),
        billingMode ? billAPI.getPending() : Promise.resolve({ data: [] })
      ]);

      setStats({
        patients: patientsRes.data.length,
        doctors: doctorsRes.data.length,
        appointments: appointmentsRes.data.length,
        pendingBills: billsRes.data.length
      });

      setRecentAppointments(appointmentsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [adminMode, billingMode]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2><i className="bi bi-speedometer2 me-2"></i>Dashboard</h2>
        <p className="text-muted">Welcome to Hospital Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Total Patients</p>
                <h3 className="stat-value text-primary mb-0">{stats.patients}</h3>
              </div>
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-people"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Total Doctors</p>
                <h3 className="stat-value text-success mb-0">{stats.doctors}</h3>
              </div>
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-person-badge"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Today's Appointments</p>
                <h3 className="stat-value text-info mb-0">{stats.appointments}</h3>
              </div>
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-calendar-check"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Pending Bills</p>
                <h3 className="stat-value text-warning mb-0">{stats.pendingBills}</h3>
              </div>
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-receipt"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Appointments */}
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0"><i className="bi bi-lightning me-2"></i>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {adminMode && (
                  <Link to="/patients" className="btn btn-outline-primary">
                    <i className="bi bi-person-plus me-2"></i>Register Patient
                  </Link>
                )}
                <Link to="/appointments" className="btn btn-outline-info">
                  <i className="bi bi-calendar-plus me-2"></i>{doctorMode ? 'View My Appointments' : 'Book Appointment'}
                </Link>
                {billingMode && (
                  <Link to="/bills" className="btn btn-outline-success">
                    <i className="bi bi-receipt me-2"></i>Generate Bill
                  </Link>
                )}
                <Link to="/prescriptions" className="btn btn-outline-warning">
                  <i className="bi bi-file-medical me-2"></i>{doctorMode ? 'Write Prescription' : 'View Prescriptions'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="bi bi-calendar-check me-2"></i>Today's Appointments</h5>
              <Link to="/appointments" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              {recentAppointments.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-calendar-x"></i>
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Patient ID</th>
                        <th>Doctor ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td>{apt.appointment_time}</td>
                          <td>#{apt.patient_id}</td>
                          <td>#{apt.doctor_id}</td>
                          <td>
                            <span className={`badge bg-${apt.status === 'scheduled' ? 'info' : apt.status === 'completed' ? 'success' : 'danger'}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted">System Status</h6>
                  <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Online</span>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Database</h6>
                  <span className="badge bg-success"><i className="bi bi-database me-1"></i>Connected</span>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Version</h6>
                  <span className="badge bg-primary">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
