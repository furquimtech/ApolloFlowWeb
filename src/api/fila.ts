import api from './client';
import type { Fila, FilaRequest, FilaRegistro, FilaFiltroRequest } from '../types';

export const filaApi = {
  getAll: () => api.get<Fila[]>('/fila').then(r => r.data),
  getById: (id: number) => api.get<Fila>(`/fila/${id}`).then(r => r.data),
  create: (data: FilaRequest) => api.post<Fila>('/fila', data).then(r => r.data),
  update: (id: number, data: FilaRequest) =>
    api.put<Fila>(`/fila/${id}`, { ...data, id }).then(r => r.data),
  remove: (id: number) => api.delete(`/fila/${id}`),

  getRegistros: (filaId: number, page = 0, size = 50, atendido?: boolean) =>
    api.get<{ total: number; page: number; size: number; items: FilaRegistro[] }>(
      `/fila/${filaId}/registros`,
      { params: { page, size, ...(atendido !== undefined ? { atendido } : {}) } }
    ).then(r => r.data),

  addRegistros: (filaId: number, registros: Array<Partial<FilaRegistro>>) =>
    api.post<{ inseridos: number }>(`/fila/${filaId}/registros`, registros).then(r => r.data),

  popularPorFiltro: (filaId: number, filtro: FilaFiltroRequest) =>
    api.post<{ inseridos: number; mensagem?: string }>(
      `/fila/${filaId}/registros/filtro`, filtro
    ).then(r => r.data),

  popularPorCsv: (filaId: number, file: File) => {
    const form = new FormData();
    form.append('arquivo', file);
    return api.post<{ inseridos: number; naoEncontrados: string[]; erros: string[] }>(
      `/fila/${filaId}/registros/csv`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
};
