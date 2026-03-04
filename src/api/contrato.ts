import api from './client';
import type { Contrato, ContratoRequest } from '../types';

export const contratoApi = {
  getAll: () => api.get<Contrato[]>('/contrato').then(r => r.data),
  getById: (id: number) => api.get<Contrato>(`/contrato/${id}`).then(r => r.data),
  create: (data: ContratoRequest) => api.post<Contrato>('/contrato', data).then(r => r.data),
  update: (id: number, data: ContratoRequest) =>
    api.put<Contrato>(`/contrato/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/contrato/${id}`),
};
