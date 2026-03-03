import api from './client';
import type { Operador, OperadorRequest } from '../types';

export const operadorApi = {
  getAll: () => api.get<Operador[]>('/operador').then((r) => r.data),
  getById: (id: number) => api.get<Operador>(`/operador/${id}`).then((r) => r.data),
  create: (data: OperadorRequest) => api.post<Operador>('/operador', data).then((r) => r.data),
  update: (id: number, data: OperadorRequest) =>
    api.put<Operador>(`/operador/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/operador/${id}`),
};
