import api from '@/lib/api';

export const technicianService = {
  search: (filters) => api.post('/technicians/search', filters),
  getAll: () => api.get('/technicians'),
  getById: (id) => api.get(`/technicians/${id}`),
  create: (data) => api.post('/technicians', data),
  getDashboard: (technicianId) => api.get(`/technicians/${technicianId}/dashboard`),
};
