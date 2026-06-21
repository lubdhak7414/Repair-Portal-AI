import api from '@/lib/api';

export const warrantyService = {
  create: (bookingId) => api.post(`/warranties/booking/${bookingId}`),
  getById: (id) => api.get(`/warranties/${id}`),
  getUserWarranties: (userId) => api.get(`/warranties/user/${userId}`),
  generatePdf: (warrantyId) => api.get(`/warranties/${warrantyId}/pdf`),
  createClaim: (warrantyId, description) =>
    api.post(`/warranties/${warrantyId}/claims`, { description }),
};
