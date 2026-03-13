import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { prescriptionAPI, patientAPI, doctorAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Prescriptions = () => {
  const { user, isDoctor } = useAuth();
  const doctorMode = isDoctor();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    prescription_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    medications: '',
    instructions: '',
    follow_up_date: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const prescriptionsPromise = doctorMode
        ? prescriptionAPI.getByDoctor(user?.doctor_id)
        : prescriptionAPI.getAll();

      const [prescriptionsRes, patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
        prescriptionsPromise,
        doctorMode ? Promise.resolve({ data: [] }) : patientAPI.getAll(),
        doctorAPI.getAll(),
        doctorMode ? appointmentAPI.getAll() : Promise.resolve({ data: [] })
      ]);
      setPrescriptions(prescriptionsRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);

      if (doctorMode) {
        const uniquePatients = [];
        const seenIds = new Set();
        appointmentsRes.data.forEach((appointment) => {
          if (!seenIds.has(appointment.patient_id)) {
            seenIds.add(appointment.patient_id);
            uniquePatients.push({
              id: appointment.patient_id,
              name: appointment.patient_name || `Patient #${appointment.patient_id}`,
            });
          }
        });
        setDoctorPatients(uniquePatients);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [doctorMode, user?.doctor_id]);

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
      prescription_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      symptoms: '',
      medications: '',
      instructions: '',
      follow_up_date: ''
    });
    setEditMode(false);
    setSelectedPrescription(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctorMode) {
      toast.error('Only doctors can create or edit prescriptions');
      return;
    }

    try {
      const submitData = {
        ...formData,
        patient_id: parseInt(formData.patient_id),
        doctor_id: doctorMode ? user?.doctor_id : parseInt(formData.doctor_id),
        follow_up_date: formData.follow_up_date || null
      };
      
      if (editMode) {
        await prescriptionAPI.update(selectedPrescription.id, submitData);
        toast.success('Prescription updated successfully');
      } else {
        await prescriptionAPI.create(submitData);
        toast.success('Prescription created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (prescription) => {
    if (!doctorMode) {
      toast.error('Admin/Receptionist can only view prescriptions');
      return;
    }

    setSelectedPrescription(prescription);
    setFormData({
      patient_id: prescription.patient_id.toString(),
      doctor_id: prescription.doctor_id.toString(),
      prescription_date: prescription.prescription_date,
      diagnosis: prescription.diagnosis || '',
      symptoms: prescription.symptoms || '',
      medications: prescription.medications || '',
      instructions: prescription.instructions || '',
      follow_up_date: prescription.follow_up_date || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (prescription) => {
    setSelectedPrescription(prescription);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!doctorMode) {
      toast.error('Admin/Receptionist can only view prescriptions');
      return;
    }

    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await prescriptionAPI.delete(id);
        toast.success('Prescription deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete prescription');
      }
    }
  };

  const getPatientName = (id) => {
    const prescriptionPatient = prescriptions.find((prescription) => prescription.patient_id === id)?.patient_name;
    if (prescriptionPatient) return prescriptionPatient;

    const doctorPatient = doctorPatients.find((patient) => patient.id === id);
    if (doctorPatient) return doctorPatient.name;

    const patient = patients.find(p => p.id === id);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${id}`;
  };

  const getDoctorName = (id) => {
    const prescriptionDoctor = prescriptions.find((prescription) => prescription.doctor_id === id)?.doctor_name;
    if (prescriptionDoctor) return prescriptionDoctor;

    const doctor = doctors.find(d => d.id === id);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : `Doctor #${id}`;
  };

  const renderMedications = (medications) => {
    if (!medications) {
      return <p className="mb-0">N/A</p>;
    }

    try {
      const parsed = JSON.parse(medications);
      if (Array.isArray(parsed)) {
        return (
          <div className="list-group list-group-flush">
            {parsed.map((item, index) => (
              <div key={`${item.name || 'med'}-${index}`} className="list-group-item px-0 bg-transparent border-bottom">
                <div className="fw-semibold">{item.name || 'Medication'}</div>
                <div className="small text-muted">
                  {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' | ') || 'No dosage details'}
                </div>
              </div>
            ))}
          </div>
        );
      }
    } catch (error) {
      // Plain text medications are rendered below.
    }

    return <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{medications}</pre>;
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    getPatientName(p.patient_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDoctorName(p.doctor_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h2><i className="bi bi-file-medical me-2"></i>Prescription Management</h2>
          <p className="text-muted">
            {doctorMode ? 'Create and manage your own prescriptions' : 'View prescriptions'}
          </p>
        </div>
        {doctorMode && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <i className="bi bi-plus-circle me-2"></i>New Prescription
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by patient, doctor, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">Total: {filteredPrescriptions.length} prescriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="card">
        <div className="card-body">
          {filteredPrescriptions.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-file-medical"></i>
              <p>No prescriptions found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                    <th>Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td><strong>#{rx.id}</strong></td>
                      <td>{rx.prescription_date}</td>
                      <td>{getPatientName(rx.patient_id)}</td>
                      <td>{getDoctorName(rx.doctor_id)}</td>
                      <td><small>{rx.diagnosis ? rx.diagnosis.substring(0, 30) + '...' : '-'}</small></td>
                      <td>{rx.follow_up_date || '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleView(rx)} title="View">
                          <i className="bi bi-eye"></i>
                        </button>
                        {doctorMode && (
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(rx)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {doctorMode && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rx.id)} title="Delete">
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

      {/* Create/Edit Modal */}
      {showModal && doctorMode && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${editMode ? 'pencil' : 'file-medical'} me-2`}></i>
                  {editMode ? 'Edit Prescription' : 'New Prescription'}
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
                        {(doctorMode ? doctorPatients : patients.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }))).map((patient) => (
                          <option key={patient.id} value={patient.id}>{patient.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Doctor *</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={doctors.find((d) => d.id === user?.doctor_id)
                          ? `Dr. ${doctors.find((d) => d.id === user?.doctor_id).first_name} ${doctors.find((d) => d.id === user?.doctor_id).last_name}`
                          : 'Linked doctor profile'}
                        readOnly
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Prescription Date *</label>
                      <input type="date" className="form-control" name="prescription_date" value={formData.prescription_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Follow-up Date</label>
                      <input type="date" className="form-control" name="follow_up_date" value={formData.follow_up_date} onChange={handleInputChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Symptoms</label>
                      <textarea className="form-control" name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows="2" placeholder="Patient's symptoms..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Diagnosis</label>
                      <textarea className="form-control" name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} rows="2" placeholder="Medical diagnosis..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Medications</label>
                      <textarea className="form-control" name="medications" value={formData.medications} onChange={handleInputChange} rows="4" placeholder="Medicine Name - Dosage - Frequency - Duration&#10;e.g., Paracetamol - 500mg - 3 times daily - 5 days"></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Instructions</label>
                      <textarea className="form-control" name="instructions" value={formData.instructions} onChange={handleInputChange} rows="3" placeholder="Special instructions for the patient..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi bi-${editMode ? 'check' : 'file-medical'} me-2`}></i>
                    {editMode ? 'Update' : 'Create Prescription'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPrescription && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><i className="bi bi-file-medical me-2"></i>Prescription #{selectedPrescription.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="text-muted">Patient</h6>
                    <p className="mb-0"><strong>{getPatientName(selectedPrescription.patient_id)}</strong></p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted">Doctor</h6>
                    <p className="mb-0"><strong>{getDoctorName(selectedPrescription.doctor_id)}</strong></p>
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="text-muted">Date</h6>
                    <p className="mb-0">{selectedPrescription.prescription_date}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted">Follow-up Date</h6>
                    <p className="mb-0">{selectedPrescription.follow_up_date || 'Not scheduled'}</p>
                  </div>
                </div>
                <hr />
                <div className="mb-3">
                  <h6 className="text-muted">Symptoms</h6>
                  <p>{selectedPrescription.symptoms || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Diagnosis</h6>
                  <p>{selectedPrescription.diagnosis || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Medications</h6>
                  <div className="bg-light p-3 rounded">
                    {renderMedications(selectedPrescription.medications)}
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Instructions</h6>
                  <p>{selectedPrescription.instructions || 'N/A'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
