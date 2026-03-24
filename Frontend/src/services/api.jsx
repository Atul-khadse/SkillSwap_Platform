// services/api.jsx
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


console.log('🔧 API_URL:', API_URL);


const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
   withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  searchUsers: (params) => api.get('/users/search', { params }),
  getPotentialMatches: () => api.get('/users/matches'),
  getUserPairs: () => api.get('/users/me/pairs'),
  getUpcomingSessions: () => api.get('/users/me/sessions/upcoming'),
  // Add getPair function
  getPair: (pairId) => api.get(`/pairs/${pairId}`),
};


export const ratingAPI = {
  submitRating: (data) => api.post('/ratings', data),
  getUserRatings: (userId) => api.get(`/ratings/user/${userId}`),
  checkUserRating: (userId) => api.get(`/ratings/check/${userId}`)
};


export const exchangeAPI = {
  sendRequest: (data) => api.post('/exchange/request', data),
  getRequests: (type) => api.get(`/exchange/requests?type=${type}`),
  acceptRequest: (id) => api.put(`/exchange/requests/${id}/accept`),
  rejectRequest: (id) => api.put(`/exchange/requests/${id}/reject`),
};





export const sessionAPI = {
  createSession: (data) => api.post('/sessions', data),
  getSessionsByPair: (pairId, status) => 
    api.get(`/sessions/pair/${pairId}${status ? `?status=${status}` : ''}`),
  updateSessionStatus: (id, data) => api.put(`/sessions/${id}/status`, data),
  addSessionNote: (id, note) => api.post(`/sessions/${id}/notes`, note),
};

// Remove duplicate getPair function since it's already in userAPI
export const pairAPI = {
  getPair: (pairId) => api.get(`/pairs/${pairId}`),
  completePair: (pairId) => api.put(`/pairs/${pairId}/complete`),
  completeUserTeaching: (pairId) => api.put(`/pairs/${pairId}/complete-user`),
};

export default api;