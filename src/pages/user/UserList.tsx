import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/user';
import type { User } from '../../types';

function situacaoBadge(situacao: string) {
  const active = situacao?.toLowerCase() === 'ativo';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {situacao}
    </span>
  );
}

function tipoBadge(tipo: string) {
  const isAdmin = tipo?.toUpperCase() === 'ADMINISTRADOR';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin ? 'bg-ftech-100 text-ftech-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {tipo}
    </span>
  );
}

function formatDate(dt: string) {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('pt-BR');
}

export default function UserList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await userApi.getAll();
      setItems(data);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('Confirma a exclusão deste usuário?')) return;
    try {
      setDeletingId(id);
      await userApi.remove(id);
      setItems((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('Erro ao excluir usuário.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => navigate('/usuario/novo')}
          className="bg-ftech-600 hover:bg-ftech-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Situação</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastro</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{item.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{item.username}</td>
                  <td className="px-6 py-4 text-gray-700">{item.nome}</td>
                  <td className="px-6 py-4">{tipoBadge(item.tipoUsuario)}</td>
                  <td className="px-6 py-4">{situacaoBadge(item.situacao)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(item.dataHoraInclusao)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/usuario/${item.id}`)}
                        className="text-ftech-600 hover:text-ftech-800 font-medium transition-colors text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors text-xs disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
