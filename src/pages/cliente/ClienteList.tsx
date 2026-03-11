import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [codigo, setCodigo] = useState('');

  async function handleBuscar() {
    const filtroNome = nome.trim();
    const filtroCpf = cpfCnpj.trim();
    const filtroCodigo = codigo.trim();

    if (!filtroNome && !filtroCpf && !filtroCodigo) {
      setError('Informe pelo menos um filtro para pesquisar clientes.');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await clienteApi.search({
        nome: filtroNome || undefined,
        cpfCnpj: filtroCpf || undefined,
        codigo: filtroCodigo || undefined,
      });
      setItems(data);
    } catch {
      setError('Erro ao pesquisar clientes.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Deseja realmente excluir este cliente?')) return;
    setDeletingId(id);
    try {
      await clienteApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert('Erro ao excluir o cliente.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Use filtros para buscar clientes sem carregar a base completa.
          </p>
        </div>
        <button
          onClick={() => navigate('/cliente/novo')}
          className="inline-flex items-center gap-2 bg-ftech-600 hover:bg-ftech-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Pessoa/Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              placeholder="Ex: Maria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
            <input
              type="text"
              placeholder="Somente números ou formatado"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              placeholder="Código interno"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="bg-ftech-600 hover:bg-ftech-700 disabled:bg-ftech-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Pesquisando...' : 'Pesquisar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {!hasSearched ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-sm text-gray-500">
          Informe os filtros acima e clique em <strong>Pesquisar</strong>.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
              Pesquisando...
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
              Nenhum cliente encontrado para os filtros informados.
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
                  {items.map((item) => (
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
                            className="text-ftech-600 hover:text-ftech-800 font-medium text-xs px-2 py-1 rounded hover:bg-ftech-50 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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
      )}
    </div>
  );
}
