import axios from 'axios';

const API_BASE = '/api';
const APP_CODIGO = 'apollofront';
const APP_CHAVE = '85c7e6a7-4d4f-40b8-b7f5-2375db9a3705';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: injeta o token do usuário nas requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redireciona para login em caso de 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('appToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api, API_BASE, APP_CODIGO, APP_CHAVE };
export default api;
