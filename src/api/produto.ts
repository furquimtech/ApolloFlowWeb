import api from './client';
import type { Produto, ProdutoRequest } from '../types';

export const produtoApi = {
  getAll: () => api.get<Produto[]>('/produto').then(r => r.data),
  getById: (id: number) => api.get<Produto>(`/produto/${id}`).then(r => r.data),
  create: (data: ProdutoRequest) => api.post<Produto>('/produto', data).then(r => r.data),
  update: (id: number, data: ProdutoRequest) =>
    api.put<Produto>(`/produto/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/produto/${id}`),
};
