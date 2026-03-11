import api from './client';
import type { Cliente } from '../types';

type ClienteSearchParams = {
  nome?: string;
  cpfCnpj?: string;
  codigo?: string;
  page?: number;
  pageSize?: number;
};

export const clienteApi = {
  getAll: (params?: ClienteSearchParams) =>
    api.get<Cliente[]>('/clientes', {
      params: { dadosExtras: 'emails,enderecos,telefones', pageSize: 50, ...params },
    }).then(r => r.data),

  search: (params: ClienteSearchParams) =>
    api.get<Cliente[]>('/clientes', {
      params: { pageSize: 50, ...params },
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
