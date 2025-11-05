import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests (optional - for guest mode)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show alert for 401 errors in guest mode - just log it
    if (error.response?.status === 401 && !localStorage.getItem('token')) {
      console.warn('API call failed - guest mode: No authentication token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Rooms API
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getOne: (id) => api.get(`/rooms/${id}`),
  getMembers: (id) => api.get(`/rooms/${id}/members`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`)
};

// Invites API
export const invitesAPI = {
  create: (data) => api.post('/invites', data),
  getByToken: (token) => api.get(`/invites/${token}`),
  accept: (token) => api.post(`/invites/${token}/accept`)
};

export default api;

