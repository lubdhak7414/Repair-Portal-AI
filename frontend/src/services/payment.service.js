import api from '@/lib/api';

export const paymentService = {
  create: (data) => api.post('/payments', data),
  process: (paymentId, data) => api.put(`/payments/${paymentId}/process`, data),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
};
