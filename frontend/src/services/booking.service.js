import api from '@/lib/api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getById: (id) => api.get(`/bookings/single/${id}`),
  getUserBookings: (userId) => api.get(`/bookings/user/${userId}`),
  getAll: () => api.get('/bookings'),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id, reason) => api.put(`/bookings/cancel/${id}`, { cancellationReason: reason }),
  reschedule: (id, data) => api.put(`/bookings/reschedule/${id}`, data),
  getBiddingBookings: () => api.get('/bookings/bidding-bookings'),
  getStatus: (id) => api.get(`/bookings/status/${id}`),
  getUserCancellable: (userId) => api.get(`/bookings/user/${userId}/cancellable`),
  getHistory: (id) => api.get(`/bookings/history/${id}`),
  // Technician dashboard routes (consolidated — NOT /techDashboard)
  getTechnicianBookings: (userId, status) =>
    api.get(`/bookings/technician/${userId}/bookings`, { params: status ? { status } : {} }),
  getAllTechnicianBookings: (userId) =>
    api.get(`/bookings/technician/${userId}/all-bookings`),
  updateTechnicianBookingStatus: (bookingId, data) =>
    api.patch(`/bookings/technician/${bookingId}/status`, data),
};
