import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('hospitalUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Patient API
export const patientAPI = {
  getAll: () => api.get('/patients/'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get(`/patients/search/${query}`),
};

// Doctor API
export const doctorAPI = {
  getAll: () => api.get('/doctors/'),
  getById: (id) => api.get(`/doctors/${id}`),
  getActive: () => api.get('/doctors/active'),
  getBySpecialization: (spec) => api.get(`/doctors/specialization/${spec}`),
  getSpecializations: () => api.get('/doctors/specializations/list'),
  create: (data) => api.post('/doctors/', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Appointment API
export const appointmentAPI = {
  getAll: () => api.get('/appointments/'),
  getById: (id) => api.get(`/appointments/${id}`),
  getToday: () => api.get('/appointments/today'),
  getByPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  getByStatus: (status) => api.get(`/appointments/status/${status}`),
  create: (data) => api.post('/appointments/', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Billing API
export const billAPI = {
  getAll: () => api.get('/billing/bills'),
  getById: (id) => api.get(`/billing/bills/${id}`),
  getByPatient: (patientId) => api.get(`/billing/bills/patient/${patientId}`),
  getByStatus: (status) => api.get(`/billing/bills/status/${status}`),
  getPending: () => api.get('/billing/bills/pending'),
  create: (data) => api.post('/billing/bills', data),
  update: (id, data) => api.put(`/billing/bills/${id}`, data),
  pay: (id, amount, method) => api.put(`/billing/bills/${id}/pay?amount=${amount}&payment_method=${method}`),
  delete: (id) => api.delete(`/billing/bills/${id}`),
};

// Prescription API
export const prescriptionAPI = {
  getAll: () => api.get('/billing/prescriptions'),
  getById: (id) => api.get(`/billing/prescriptions/${id}`),
  getByPatient: (patientId) => api.get(`/billing/prescriptions/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/billing/prescriptions/doctor/${doctorId}`),
  create: (data) => api.post('/billing/prescriptions', data),
  update: (id, data) => api.put(`/billing/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/billing/prescriptions/${id}`),
};

export default api;
