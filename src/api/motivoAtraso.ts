import api from './client';
import type { MotivoAtraso, MotivoAtrasoRequest } from '../types';

export const motivoAtrasoApi = {
  getAll: () => api.get<MotivoAtraso[]>('/motivoatraso').then(r => r.data),
  getById: (id: number) => api.get<MotivoAtraso>(`/motivoatraso/${id}`).then(r => r.data),
  create: (data: MotivoAtrasoRequest) =>
    api.post<MotivoAtraso>('/motivoatraso', data).then(r => r.data),
  update: (id: number, data: MotivoAtrasoRequest) =>
    api.put<MotivoAtraso>(`/motivoatraso/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/motivoatraso/${id}`),
};
