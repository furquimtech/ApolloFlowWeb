import axios from 'axios';
import type {
  AutenticacaoRequest,
  AutenticacaoResponse,
  LoginRequest,
  LoginResponse,
} from '../types';
import { API_BASE, APP_CODIGO, APP_CHAVE } from './client';

/** Passo 1: autentica a aplicação e obtém o app token */
export async function autenticarAplicacao(): Promise<AutenticacaoResponse> {
  const body: AutenticacaoRequest = { codigo: APP_CODIGO, chave: APP_CHAVE };
  const res = await axios.post<AutenticacaoResponse>(
    `${API_BASE}/auth/autenticacao`,
    body
  );
  return res.data;
}

/** Passo 2: autentica o usuário usando o app token */
export async function loginUsuario(
  username: string,
  password: string,
  appToken: string
): Promise<LoginResponse> {
  const body: LoginRequest = { username, password };
  const res = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, body, {
    headers: { Authorization: `Bearer ${appToken}` },
  });
  return res.data;
}
