import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, ...userDataWithoutToken } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userDataWithoutToken);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      
      const { token, ...userDataWithoutToken } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userDataWithoutToken);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const { token, ...userDataWithoutToken } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      setUser(prevUser => ({
        ...prevUser,
        ...userDataWithoutToken
      }));
      
      toast.success('Profile updated successfully');
      return { success: true, data: userDataWithoutToken };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
  try {
    const response = await authAPI.getProfile();
    setUser(response.data);
  } catch (error) {
    console.error('Error refreshing user:', error);
  }
};

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};