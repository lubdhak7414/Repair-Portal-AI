import api from '@/lib/api';

export const bidService = {
  create: (data) => api.post('/bids', data),
  getByBooking: (bookingId) => api.get(`/bids/booking/${bookingId}`),
  getByTechnician: (technicianId) => api.get(`/bids/technician/${technicianId}`),
  accept: (bidId) => api.put(`/bids/${bidId}/accept`),
};
