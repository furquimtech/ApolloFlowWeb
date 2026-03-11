import api from './client';
import type { CarteiraCobransaas, CarteiraCobransaasRequest } from '../types';

export const carteiraCobransaasApi = {
  getAll: () => api.get<CarteiraCobransaas[]>('/carteiracobransaas').then(r => r.data),
  getByCarteira: (carteiraId: number) =>
    api.get<CarteiraCobransaas>(`/carteiracobransaas/carteira/${carteiraId}`).then(r => r.data),
  create: (data: CarteiraCobransaasRequest) =>
    api.post<CarteiraCobransaas>('/carteiracobransaas', data).then(r => r.data),
  update: (id: number, data: CarteiraCobransaasRequest) =>
    api.put<CarteiraCobransaas>(`/carteiracobransaas/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/carteiracobransaas/${id}`),
};
