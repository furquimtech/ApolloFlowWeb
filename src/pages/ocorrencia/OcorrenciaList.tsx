import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ocorrenciaApi } from '../../api/ocorrencia';
import type { Ocorrencia } from '../../types';

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('pt-BR');
}

export default function OcorrenciaList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await ocorrenciaApi.getAll();
      setItems(data);
    } catch {
      setError('Erro ao carregar ocorrencias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('Confirma a exclusão desta ocorrencia?')) return;
    try {
      setDeletingId(id);
      await ocorrenciaApi.remove(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Erro ao excluir ocorrencia.');
    } finally {
      setDeletingId(null);
    }
  }

  function badgeClass(situacao: string) {
    if (situacao === 'Concluida' || situacao === 'Concluída') return 'bg-green-100 text-green-800';
    if (situacao === 'Pendente') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ocorrencias</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as ocorrencias cadastradas</p>
        </div>
        <button
          onClick={() => navigate('/ocorrencia/novo')}
          className="bg-ftech-600 hover:bg-ftech-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Ocorrencia
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
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
            <p>Nenhuma ocorrencia cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Contato</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo Contato</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Situacao</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsavel</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{item.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{item.cliente?.nome ?? '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{formatDate(item.dataHoraContato)}</td>
                    <td className="px-6 py-4 text-gray-700">{item.motivoContato?.descricao ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass(item.situacao)}`}>
                        {item.situacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.usuarioResponsavel?.nome ?? '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/ocorrencia/${item.id}`)}
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
          </div>
        )}
      </div>
    </div>
  );
}
