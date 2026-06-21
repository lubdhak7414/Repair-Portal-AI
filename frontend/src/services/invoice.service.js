import api from '@/lib/api';

export const invoiceService = {
  create: (bookingId) => api.post(`/invoices/booking/${bookingId}`),
  getById: (id) => api.get(`/invoices/${id}`),
  getUserInvoices: (userId) => api.get(`/invoices/user/${userId}`),
  generatePdf: (invoiceId) => api.get(`/invoices/${invoiceId}/pdf`),
};
