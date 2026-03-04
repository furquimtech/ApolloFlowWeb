import api from './client';
import type { Ocorrencia, OcorrenciaRequest } from '../types';

export const ocorrenciaApi = {
  getAll: () => api.get<Ocorrencia[]>('/ocorrencia').then(r => r.data),
  getById: (id: number) => api.get<Ocorrencia>(`/ocorrencia/${id}`).then(r => r.data),
  create: (data: OcorrenciaRequest) =>
    api.post<Ocorrencia>('/ocorrencia', data).then(r => r.data),
  update: (id: number, data: OcorrenciaRequest) =>
    api.put<Ocorrencia>(`/ocorrencia/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/ocorrencia/${id}`),
};
