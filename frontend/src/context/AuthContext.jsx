import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('hospitalUser');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      
      // Store token and user
      localStorage.setItem('token', access_token);
      localStorage.setItem('hospitalUser', JSON.stringify(userData));
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('hospitalUser');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.put('/auth/me', updates);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('hospitalUser', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Update failed' };
    }
  };

  // Role check helpers
  const isAdmin = () => user?.role === 'admin';
  const isDoctor = () => user?.role === 'doctor';
  const isReceptionist = () => user?.role === 'receptionist';
  const canManagePatients = () => ['admin', 'receptionist'].includes(user?.role);
  const canManageAppointments = () => ['admin', 'receptionist'].includes(user?.role);
  const canManageBilling = () => ['admin', 'receptionist'].includes(user?.role);
  const canManageDoctors = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateProfile, 
      loading,
      isAdmin,
      isDoctor,
      isReceptionist,
      canManagePatients,
      canManageAppointments,
      canManageBilling,
      canManageDoctors
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
