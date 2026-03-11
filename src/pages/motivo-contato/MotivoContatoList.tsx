import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motivoContatoApi } from '../../api/motivoContato';
import type { MotivoContato } from '../../types';

export default function MotivoContatoList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MotivoContato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setItems(await motivoContatoApi.getAll());
    } catch {
      setError('Erro ao carregar motivos de contato.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('Confirma a exclusão deste motivo de contato?')) return;
    try {
      setDeletingId(id);
      await motivoContatoApi.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('Erro ao excluir motivo de contato.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Motivos de Contato</h1>
        <button
          onClick={() => navigate('/motivo-contato/novo')}
          className="bg-ftech-600 hover:bg-ftech-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Novo Motivo
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-ftech-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm">Nenhum motivo de contato encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 w-24">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Descrição</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-24">Produtivo</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">CPC</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">Ativo</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.descricao}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.produtivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.produtivo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.cpc ? 'bg-ftech-100 text-ftech-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.cpc ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/motivo-contato/${item.id}`)}
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
