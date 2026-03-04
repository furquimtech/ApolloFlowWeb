import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../../api/cliente';
import type { Cliente } from '../../types';

function formatCpfCnpj(v: string) {
  return v ?? '-';
}

function formatCurrency(v: number) {
  return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';
}

function SituacaoBadge({ situacao }: { situacao: string }) {
  const colors: Record<string, string> = {
    Ativo: 'bg-green-100 text-green-800',
    Inativo: 'bg-gray-100 text-gray-700',
    Bloqueado: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[situacao] ?? 'bg-gray-100 text-gray-700'}`}>
      {situacao}
    </span>
  );
}

export default function ClienteList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cpfSearch, setCpfSearch] = useState('');

  async function load(nome = '', cpfCnpj = '') {
    setLoading(true);
    setError('');
    try {
      const data = await clienteApi.getAll({ nome, cpfCnpj });
      setItems(data);
    } catch {
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleBuscar() {
    load(search, cpfSearch);
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Deseja realmente excluir este cliente?')) return;
    setDeletingId(id);
    try {
      await clienteApi.remove(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch {
      alert('Erro ao excluir o cliente.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => navigate('/cliente/novo')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Pessoa/Cliente
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              placeholder="Buscar por nome"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
            <input
              type="text"
              placeholder="CPF/CNPJ"
              value={cpfSearch}
              onChange={e => setCpfSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleBuscar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">CPF/CNPJ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Situação</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo Atual</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Dias Atraso</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCpfCnpj(item.cpfCnpj)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.tipoPessoa === 'F' ? 'Física' : item.tipoPessoa === 'J' ? 'Jurídica' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <SituacaoBadge situacao={item.situacao} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.saldoAtual)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.diasAtraso ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/cliente/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          disabled={deletingId === item.id}
                          className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
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
