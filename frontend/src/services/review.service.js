import api from '@/lib/api';

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByTechnician: (technicianId) => api.get(`/reviews/technician/${technicianId}`),
  respond: (reviewId, data) => api.put(`/reviews/${reviewId}/respond`, data),
};
