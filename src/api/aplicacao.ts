import api from './client';
import type { Aplicacao, AplicacaoRequest } from '../types';

export const aplicacaoApi = {
  getAll: () => api.get<Aplicacao[]>('/aplicacao').then((r) => r.data),
  getById: (id: number) => api.get<Aplicacao>(`/aplicacao/${id}`).then((r) => r.data),
  create: (data: AplicacaoRequest) => api.post<Aplicacao>('/aplicacao', data).then((r) => r.data),
  update: (id: number, data: AplicacaoRequest) =>
    api.put<Aplicacao>(`/aplicacao/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/aplicacao/${id}`),
};
