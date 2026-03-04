import api from './client';
import type { User, UserRequest } from '../types';

export const userApi = {
  getAll: () => api.get<User[]>('/user').then((r) => r.data),
  getById: (id: number) => api.get<User>(`/user/${id}`).then((r) => r.data),
  create: (data: UserRequest) => api.post<User>('/user', data).then((r) => r.data),
  update: (id: number, data: UserRequest) =>
    api.put<User>(`/user/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/user/${id}`),
};
