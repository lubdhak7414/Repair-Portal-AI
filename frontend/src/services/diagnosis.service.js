import api from '@/lib/api';

export const diagnosisService = {
  getDiagnosis: (data) => api.post('/diagnosis', data),
};
