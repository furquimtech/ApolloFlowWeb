import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { autenticarAplicacao, loginUsuario } from '../api/auth';

interface AuthUser {
  userId: number;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaura sessão do localStorage
    const token = localStorage.getItem('userToken');
    const storedUser = localStorage.getItem('authUser');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    // Passo 1: autentica a aplicação
    const appAuth = await autenticarAplicacao();
    localStorage.setItem('appToken', appAuth.token);

    // Passo 2: autentica o usuário
    const userAuth = await loginUsuario(username, password, appAuth.token);
    localStorage.setItem('userToken', userAuth.token);

    const authUser: AuthUser = {
      userId: userAuth.userId,
      username: userAuth.username,
    };
    localStorage.setItem('authUser', JSON.stringify(authUser));
    setUser(authUser);
  }

  function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('appToken');
    localStorage.removeItem('authUser');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
