import api from './client';
import type { Assessoria, AssessoriaRequest } from '../types';

export const assessoriaApi = {
  getAll: () => api.get<Assessoria[]>('/assessoria').then(r => r.data),
  getById: (id: number) => api.get<Assessoria>(`/assessoria/${id}`).then(r => r.data),
  create: (data: AssessoriaRequest) => api.post<Assessoria>('/assessoria', data).then(r => r.data),
  update: (id: number, data: AssessoriaRequest) =>
    api.put<Assessoria>(`/assessoria/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/assessoria/${id}`),
};
