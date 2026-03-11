import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import type { ReactNode } from 'react';

// Administração
import AplicacaoList from './pages/aplicacao/AplicacaoList';
import AplicacaoForm from './pages/aplicacao/AplicacaoForm';
import UserList from './pages/user/UserList';
import UserForm from './pages/user/UserForm';

// Cadastros
import AssessoriaList from './pages/assessoria/AssessoriaList';
import AssessoriaForm from './pages/assessoria/AssessoriaForm';
import CarteiraList from './pages/carteira/CarteiraList';
import CarteiraForm from './pages/carteira/CarteiraForm';
import ProdutoList from './pages/produto/ProdutoList';
import ProdutoForm from './pages/produto/ProdutoForm';
import MotivoContatoList from './pages/motivo-contato/MotivoContatoList';
import MotivoContatoForm from './pages/motivo-contato/MotivoContatoForm';
import MotivoAtrasoList from './pages/motivo-atraso/MotivoAtrasoList';
import MotivoAtrasoForm from './pages/motivo-atraso/MotivoAtrasoForm';

// Operacional
import FilaPage from './pages/fila/FilaPage';
import ClienteList from './pages/cliente/ClienteList';
import ClienteForm from './pages/cliente/ClienteForm';
import AtendimentoCliente from './pages/atendimento/AtendimentoCliente';
import ContratoList from './pages/contrato/ContratoList';
import ContratoForm from './pages/contrato/ContratoForm';
import OcorrenciaList from './pages/ocorrencia/OcorrenciaList';
import OcorrenciaForm from './pages/ocorrencia/OcorrenciaForm';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-ftech-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />

        {/* Administração */}
        <Route path="/aplicacao" element={<AplicacaoList />} />
        <Route path="/aplicacao/novo" element={<AplicacaoForm />} />
        <Route path="/aplicacao/:id" element={<AplicacaoForm />} />
        <Route path="/usuario" element={<UserList />} />
        <Route path="/usuario/novo" element={<UserForm />} />
        <Route path="/usuario/:id" element={<UserForm />} />

        {/* Cadastros */}
        <Route path="/assessoria" element={<AssessoriaList />} />
        <Route path="/assessoria/novo" element={<AssessoriaForm />} />
        <Route path="/assessoria/:id" element={<AssessoriaForm />} />
        <Route path="/carteira" element={<CarteiraList />} />
        <Route path="/carteira/novo" element={<CarteiraForm />} />
        <Route path="/carteira/:id" element={<CarteiraForm />} />
        <Route path="/produto" element={<ProdutoList />} />
        <Route path="/produto/novo" element={<ProdutoForm />} />
        <Route path="/produto/:id" element={<ProdutoForm />} />
        <Route path="/motivo-contato" element={<MotivoContatoList />} />
        <Route path="/motivo-contato/novo" element={<MotivoContatoForm />} />
        <Route path="/motivo-contato/:id" element={<MotivoContatoForm />} />
        <Route path="/motivo-atraso" element={<MotivoAtrasoList />} />
        <Route path="/motivo-atraso/novo" element={<MotivoAtrasoForm />} />
        <Route path="/motivo-atraso/:id" element={<MotivoAtrasoForm />} />

        {/* Operacional */}
        <Route path="/atendimento" element={<AtendimentoCliente />} />
        <Route path="/fila" element={<FilaPage />} />
        <Route path="/cliente" element={<ClienteList />} />
        <Route path="/cliente/novo" element={<ClienteForm />} />
        <Route path="/cliente/:id" element={<ClienteForm />} />
        <Route path="/contrato" element={<ContratoList />} />
        <Route path="/contrato/novo" element={<ContratoForm />} />
        <Route path="/contrato/:id" element={<ContratoForm />} />
        <Route path="/ocorrencia" element={<OcorrenciaList />} />
        <Route path="/ocorrencia/novo" element={<OcorrenciaForm />} />
        <Route path="/ocorrencia/:id" element={<OcorrenciaForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
