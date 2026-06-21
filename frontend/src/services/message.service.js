import api from '@/lib/api';

export const messageService = {
  getHistory: (userId, otherUserId) => api.get(`/messages/${userId}/${otherUserId}`),
  getConversations: (userId) => api.get(`/messages/${userId}/conversations`),
  markAsRead: (userId, otherUserId) =>
    api.put(`/messages/markRead/${userId}/${otherUserId}`),
  send: (data) => api.post('/messages', data),
};
