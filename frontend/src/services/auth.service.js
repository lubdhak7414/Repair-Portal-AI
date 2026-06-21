import api from '@/lib/api';

export const authService = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (userData) => api.post('/users', userData),
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
};
