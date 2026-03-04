import api from './client';
import type { Carteira, CarteiraRequest } from '../types';

export const carteiraApi = {
  getAll: () => api.get<Carteira[]>('/carteira').then(r => r.data),
  getById: (id: number) => api.get<Carteira>(`/carteira/${id}`).then(r => r.data),
  create: (data: CarteiraRequest) => api.post<Carteira>('/carteira', data).then(r => r.data),
  update: (id: number, data: CarteiraRequest) =>
    api.put<Carteira>(`/carteira/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/carteira/${id}`),
};
