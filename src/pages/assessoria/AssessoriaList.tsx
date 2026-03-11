import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessoriaApi } from '../../api/assessoria';
import type { Assessoria } from '../../types';

export default function AssessoriaList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Assessoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setItems(await assessoriaApi.getAll());
    } catch {
      setError('Erro ao carregar assessorias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Confirma a exclusão desta assessoria?')) return;
    try {
      setDeletingId(id);
      await assessoriaApi.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('Erro ao excluir assessoria.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assessorias</h1>
        <button
          onClick={() => navigate('/assessoria/novo')}
          className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Nova Assessoria
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="animate-spin h-8 w-8 text-ftech-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Nenhuma assessoria encontrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 w-16">ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="px-4 py-3 font-semibold text-gray-600">CNPJ</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Situação</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Nº Carteiras</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{item.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{item.cnpj}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.situacao === 'Ativo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.carteiras?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/assessoria/${item.id}`)}
                        className="text-ftech-600 hover:text-ftech-800 text-xs font-medium px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
