import api from './client';
import type { Cliente } from '../types';

export const clienteApi = {
  getAll: (params?: { nome?: string; cpfCnpj?: string; page?: number; pageSize?: number }) =>
    api.get<Cliente[]>('/clientes', {
      params: { dadosExtras: 'emails,enderecos,telefones', pageSize: 50, ...params },
    }).then(r => r.data),

  getById: (id: number) =>
    api.get<Cliente>(`/clientes/${id}`, {
      params: { dadosExtras: 'emails,enderecos,telefones' },
    }).then(r => r.data),

  // POST serve tanto para criar quanto para atualizar (merge por CpfCnpj)
  save: (data: Partial<Cliente>) =>
    api.post<Cliente>('/clientes', data).then(r => r.data),

  remove: (id: number) => api.delete(`/clientes/${id}`),
};
