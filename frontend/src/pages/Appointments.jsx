import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { appointmentAPI, patientAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Appointments = () => {
  const { isDoctor, canManageAppointments } = useAuth();
  const doctorMode = isDoctor();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    reason: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
        appointmentAPI.getAll(),
        doctorMode ? Promise.resolve({ data: [] }) : patientAPI.getAll(),
        doctorAPI.getActive()
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [doctorMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      status: 'scheduled',
      reason: '',
      notes: ''
    });
    setEditMode(false);
    setSelectedAppointment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        patient_id: parseInt(formData.patient_id),
        doctor_id: parseInt(formData.doctor_id)
      };
      
      if (editMode) {
        await appointmentAPI.update(selectedAppointment.id, submitData);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentAPI.create(submitData);
        toast.success('Appointment booked successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id.toString(),
      doctor_id: appointment.doctor_id.toString(),
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openStatusModal = (appointment, status) => {
    setSelectedAppointment(appointment);
    setStatusForm({ status, notes: appointment.notes || '' });
    setShowStatusModal(true);
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      await appointmentAPI.updateStatus(selectedAppointment.id, statusForm);
      toast.success(`Appointment marked as ${statusForm.status}`);
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update appointment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentAPI.delete(id);
        toast.success('Appointment deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete appointment');
      }
    }
  };

  const getPatientName = (id) => {
    const appointmentPatient = appointments.find((appointment) => appointment.patient_id === id)?.patient_name;
    if (appointmentPatient) return appointmentPatient;

    const patient = patients.find(p => p.id === id);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${id}`;
  };

  const getDoctorName = (id) => {
    const appointmentDoctor = appointments.find((appointment) => appointment.doctor_id === id)?.doctor_name;
    if (appointmentDoctor) return appointmentDoctor;

    const doctor = doctors.find(d => d.id === id);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : `Doctor #${id}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-info',
      completed: 'bg-success',
      cancelled: 'bg-danger',
      no_show: 'bg-warning'
    };
    return badges[status] || 'bg-secondary';
  };

  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filterStatus);

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
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2><i className="bi bi-calendar-check me-2"></i>{doctorMode ? 'My Appointments' : 'Appointment Management'}</h2>
          <p className="text-muted">
            {doctorMode ? 'View and update your own appointments only' : 'Book and manage patient appointments'}
          </p>
        </div>
        {canManageAppointments() && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <i className="bi bi-calendar-plus me-2"></i>Book Appointment
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="btn-group" role="group">
                <button className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterStatus('all')}>All</button>
                <button className={`btn ${filterStatus === 'scheduled' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setFilterStatus('scheduled')}>Scheduled</button>
                <button className={`btn ${filterStatus === 'completed' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilterStatus('completed')}>Completed</button>
                <button className={`btn ${filterStatus === 'cancelled' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFilterStatus('cancelled')}>Cancelled</button>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">Total: {filteredAppointments.length} appointments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="card">
        <div className="card-body">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-calendar-x"></i>
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date & Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>#{apt.id}</td>
                      <td>
                        <strong>{apt.appointment_date}</strong><br />
                        <small className="text-muted">{apt.appointment_time}</small>
                      </td>
                      <td>{getPatientName(apt.patient_id)}</td>
                      <td>{getDoctorName(apt.doctor_id)}</td>
                      <td><small>{apt.reason || '-'}</small></td>
                      <td>
                        <span className={`badge ${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        {apt.status === 'scheduled' && (
                          <>
                            <button className="btn btn-sm btn-outline-success me-1" onClick={() => openStatusModal(apt, 'completed')} title="Complete with remarks">
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openStatusModal(apt, 'cancelled')} title="Cancel with remarks">
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        )}
                        {canManageAppointments() && (
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(apt)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {canManageAppointments() && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(apt.id)} title="Delete">
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && canManageAppointments() && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${editMode ? 'pencil' : 'calendar-plus'} me-2`}></i>
                  {editMode ? 'Edit Appointment' : 'Book New Appointment'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Patient *</label>
                      <select className="form-select" name="patient_id" value={formData.patient_id} onChange={handleInputChange} required>
                        <option value="">Select Patient</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Doctor *</label>
                      <select className="form-select" name="doctor_id" value={formData.doctor_id} onChange={handleInputChange} required>
                        <option value="">Select Doctor</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} - {d.specialization}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date *</label>
                      <input type="date" className="form-control" name="appointment_date" value={formData.appointment_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Time *</label>
                      <input type="time" className="form-control" name="appointment_time" value={formData.appointment_time} onChange={handleInputChange} required />
                    </div>
                    {editMode && (
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label">Reason for Visit</label>
                      <input type="text" className="form-control" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="e.g., Regular checkup, Follow-up" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows="3"></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi bi-${editMode ? 'check' : 'calendar-plus'} me-2`}></i>
                    {editMode ? 'Update' : 'Book Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedAppointment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-chat-square-text me-2"></i>
                  Update Appointment Status
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
              </div>
              <form onSubmit={submitStatusUpdate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <input type="text" className="form-control bg-light" value={statusForm.status} readOnly />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={statusForm.notes}
                      onChange={(e) => setStatusForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add doctor remarks or follow-up notes"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
