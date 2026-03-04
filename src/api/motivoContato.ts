import api from './client';
import type { MotivoContato, MotivoContatoRequest } from '../types';

export const motivoContatoApi = {
  getAll: () => api.get<MotivoContato[]>('/motivocontato').then(r => r.data),
  getById: (id: number) => api.get<MotivoContato>(`/motivocontato/${id}`).then(r => r.data),
  create: (data: MotivoContatoRequest) =>
    api.post<MotivoContato>('/motivocontato', data).then(r => r.data),
  update: (id: number, data: MotivoContatoRequest) =>
    api.put<MotivoContato>(`/motivocontato/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/motivocontato/${id}`),
};
