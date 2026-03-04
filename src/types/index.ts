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
  nome: string; // adicionado no backend
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

// User (substitui Operador — tabela Operadores foi removida do backend)
export interface User {
  id: number;
  username: string;
  nome: string;
  tipoUsuario: string;
  situacao: string;
  dataHoraInclusao: string;
  dataHoraModificacao: string;
  pessoaId?: number;
  assessoriaId?: number;
}

export interface UserRequest {
  username: string;
  nome: string;
  password?: string;
  tipoUsuario: string;
  situacao: string;
  assessoriaId?: number;
  pessoaId?: number;
}
