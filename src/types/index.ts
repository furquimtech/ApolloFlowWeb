// Auth
export interface AutenticacaoRequest {
  codigo: string;
  chave: string;
}

export interface AutenticacaoResponse {
  token: string;
  expiracao: string;
  aplicacaoId: number;
  codigo: string;
  nome: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiracao: string;
  userId: number;
  username: string;
}

// Aplicacao
export interface Aplicacao {
  id: number;
  codigo: string;
  nome: string;
  chave: string;
}

export interface AplicacaoRequest {
  codigo: string;
  nome: string;
  chave: string;
}

// Operador (Usuario)
export interface Operador {
  id: number;
  codigo: string;
  nome: string;
  chave: string;
  situacao: string;
  dataHoraInclusao: string;
  dataHoraModificacao: string;
}

export interface OperadorRequest {
  codigo: string;
  nome: string;
  chave: string;
  situacao: string;
}
