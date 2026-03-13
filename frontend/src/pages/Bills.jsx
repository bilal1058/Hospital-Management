import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { billAPI, patientAPI } from '../services/api';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [formData, setFormData] = useState({
    patient_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    consultation_fee: 0,
    medicine_cost: 0,
    lab_test_cost: 0,
    other_charges: 0,
    discount: 0,
    total_amount: 0,
    paid_amount: 0,
    payment_status: 'pending',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const total = parseFloat(formData.consultation_fee || 0) +
                  parseFloat(formData.medicine_cost || 0) +
                  parseFloat(formData.lab_test_cost || 0) +
                  parseFloat(formData.other_charges || 0) -
                  parseFloat(formData.discount || 0);
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }));
  }, [formData.consultation_fee, formData.medicine_cost, formData.lab_test_cost, formData.other_charges, formData.discount]);

  const fetchData = async () => {
    try {
      const [billsRes, patientsRes] = await Promise.all([
        billAPI.getAll(),
        patientAPI.getAll()
      ]);
      setBills(billsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      bill_date: new Date().toISOString().split('T')[0],
      consultation_fee: 0,
      medicine_cost: 0,
      lab_test_cost: 0,
      other_charges: 0,
      discount: 0,
      total_amount: 0,
      paid_amount: 0,
      payment_status: 'pending',
      payment_method: '',
      notes: ''
    });
    setEditMode(false);
    setSelectedBill(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        patient_id: parseInt(formData.patient_id),
        consultation_fee: parseFloat(formData.consultation_fee),
        medicine_cost: parseFloat(formData.medicine_cost),
        lab_test_cost: parseFloat(formData.lab_test_cost),
        other_charges: parseFloat(formData.other_charges),
        discount: parseFloat(formData.discount),
        total_amount: parseFloat(formData.total_amount),
        paid_amount: parseFloat(formData.paid_amount)
      };
      
      if (editMode) {
        await billAPI.update(selectedBill.id, submitData);
        toast.success('Bill updated successfully');
      } else {
        await billAPI.create(submitData);
        toast.success('Bill created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (bill) => {
    if (bill.payment_status === 'paid') {
      toast.warning('Paid bills cannot be edited');
      return;
    }

    setSelectedBill(bill);
    setFormData({
      patient_id: bill.patient_id.toString(),
      bill_date: bill.bill_date,
      consultation_fee: bill.consultation_fee,
      medicine_cost: bill.medicine_cost,
      lab_test_cost: bill.lab_test_cost,
      other_charges: bill.other_charges,
      discount: bill.discount,
      total_amount: bill.total_amount,
      paid_amount: bill.paid_amount,
      payment_status: bill.payment_status,
      payment_method: bill.payment_method || '',
      notes: bill.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handlePayment = (bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.total_amount - bill.paid_amount);
    setPayMethod('cash');
    setShowPayModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await billAPI.pay(selectedBill.id, payAmount, payMethod);
      toast.success('Payment recorded successfully');
      setShowPayModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billAPI.delete(id);
        toast.success('Bill deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete bill');
      }
    }
  };

  const getPatientName = (id) => {
    const patient = patients.find(p => p.id === id);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      paid: 'bg-success',
      partial: 'bg-info',
      cancelled: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  const filteredBills = filterStatus === 'all' 
    ? bills 
    : bills.filter(b => b.payment_status === filterStatus);

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
          <h2><i className="bi bi-receipt me-2"></i>Billing Management</h2>
          <p className="text-muted">Generate and manage patient bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <i className="bi bi-plus-circle me-2"></i>Generate Bill
        </button>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="btn-group" role="group">
                <button className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterStatus('all')}>All</button>
                <button className={`btn ${filterStatus === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setFilterStatus('pending')}>Pending</button>
                <button className={`btn ${filterStatus === 'partial' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setFilterStatus('partial')}>Partial</button>
                <button className={`btn ${filterStatus === 'paid' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilterStatus('paid')}>Paid</button>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">Total: {filteredBills.length} bills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card">
        <div className="card-body">
          {filteredBills.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-receipt"></i>
              <p>No bills found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      <td><strong>#{bill.id}</strong></td>
                      <td>{bill.bill_date}</td>
                      <td>{getPatientName(bill.patient_id)}</td>
                      <td><strong>PKR {bill.total_amount.toFixed(2)}</strong></td>
                      <td className="text-success">PKR {bill.paid_amount.toFixed(2)}</td>
                      <td className="text-danger">PKR {(bill.total_amount - bill.paid_amount).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(bill.payment_status)}`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td>
                        {bill.payment_status !== 'paid' && (
                          <button className="btn btn-sm btn-outline-success me-1" onClick={() => handlePayment(bill)} title="Record Payment">
                            <i className="bi bi-cash"></i>
                          </button>
                        )}
                        {bill.payment_status !== 'paid' && (
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(bill)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {bill.payment_status !== 'paid' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(bill.id)} title="Delete">
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

      {/* Create/Edit Bill Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${editMode ? 'pencil' : 'receipt'} me-2`}></i>
                  {editMode ? 'Edit Bill' : 'Generate New Bill'}
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
                      <label className="form-label">Bill Date *</label>
                      <input type="date" className="form-control" name="bill_date" value={formData.bill_date} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="col-12"><hr /><h6>Charges</h6></div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Consultation Fee (PKR)</label>
                      <input type="number" className="form-control" name="consultation_fee" value={formData.consultation_fee} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Medicine Cost (PKR)</label>
                      <input type="number" className="form-control" name="medicine_cost" value={formData.medicine_cost} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Lab Test Cost (PKR)</label>
                      <input type="number" className="form-control" name="lab_test_cost" value={formData.lab_test_cost} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Other Charges (PKR)</label>
                      <input type="number" className="form-control" name="other_charges" value={formData.other_charges} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Discount (PKR)</label>
                      <input type="number" className="form-control" name="discount" value={formData.discount} onChange={handleInputChange} min="0" step="0.01" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Total Amount (PKR)</label>
                      <input type="number" className="form-control bg-light" name="total_amount" value={formData.total_amount} readOnly />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows="2"></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi bi-${editMode ? 'check' : 'receipt'} me-2`}></i>
                    {editMode ? 'Update' : 'Generate Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash me-2"></i>Record Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPayModal(false)}></button>
              </div>
              <form onSubmit={submitPayment}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Bill #{selectedBill.id}</strong><br />
                    Total: PKR {selectedBill.total_amount.toFixed(2)} | Paid: PKR {selectedBill.paid_amount.toFixed(2)} | Balance: PKR {(selectedBill.total_amount - selectedBill.paid_amount).toFixed(2)}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Amount (PKR) *</label>
                    <input type="number" className="form-control" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value))} min="0.01" step="0.01" max={selectedBill.total_amount - selectedBill.paid_amount} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Method *</label>
                    <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} required>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="insurance">Insurance</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-check me-2"></i>Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
