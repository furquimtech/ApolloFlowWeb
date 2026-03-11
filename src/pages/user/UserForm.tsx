import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../../api/user';
import { carteiraApi } from '../../api/carteira';
import type { Carteira, UserRequest } from '../../types';

const EMPTY: UserRequest = {
  username: '',
  nome: '',
  password: '',
  tipoUsuario: 'OPERADOR',
  situacao: 'Ativo',
  carteiraIds: [],
};

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState<UserRequest>(EMPTY);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCarteiras, setLoadingCarteiras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingCarteiras(true);
    carteiraApi
      .getAll()
      .then((data) => setCarteiras(data))
      .catch(() => setError('Erro ao carregar carteiras.'))
      .finally(() => setLoadingCarteiras(false));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    userApi
      .getById(Number(id))
      .then((data) =>
        setForm({
          username: data.username,
          nome: data.nome,
          password: '',
          tipoUsuario: data.tipoUsuario,
          situacao: data.situacao,
          carteiraIds: data.carteiras?.map((c) => c.id) ?? data.carteiraIds ?? [],
        })
      )
      .catch(() => setError('Erro ao carregar usuário.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCarteiraToggle(carteiraId: number) {
    setForm((prev) => {
      const selected = prev.carteiraIds ?? [];
      const exists = selected.includes(carteiraId);
      const carteiraIds = exists
        ? selected.filter((itemId) => itemId !== carteiraId)
        : [...selected, carteiraId];

      return { ...prev, carteiraIds };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: UserRequest = {
        ...form,
        // Em edição, só envia password se preenchido.
        password: form.password || undefined,
        carteiraIds: Array.from(new Set(form.carteiraIds ?? [])),
      };
      if (isEdit) {
        await userApi.update(Number(id), payload);
      } else {
        await userApi.create(payload);
      }
      navigate('/usuario');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Erro ao salvar usuário.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/usuario')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Altere os dados e salve' : 'Preencha os dados do novo usuário'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Ex: joao.silva"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              placeholder="Nome completo"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
              placeholder={isEdit ? 'Deixe em branco para não alterar' : 'Senha de acesso'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 placeholder-gray-400"
            />
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">
                Deixe em branco para manter a senha atual.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Usuário
            </label>
            <select
              name="tipoUsuario"
              value={form.tipoUsuario}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 bg-white"
            >
              <option value="OPERADOR">Operador</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Situação
            </label>
            <select
              name="situacao"
              value={form.situacao}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent text-gray-800 bg-white"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carteiras que o usuário pode atuar
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
              {loadingCarteiras && (
                <p className="text-sm text-gray-400">Carregando carteiras...</p>
              )}

              {!loadingCarteiras && carteiras.length === 0 && (
                <p className="text-sm text-gray-400">Nenhuma carteira disponível.</p>
              )}

              {!loadingCarteiras &&
                carteiras.map((carteira) => {
                  const checked = (form.carteiraIds ?? []).includes(carteira.id);
                  return (
                    <label
                      key={carteira.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCarteiraToggle(carteira.id)}
                        className="mt-0.5 w-4 h-4 text-ftech-600 border-gray-300 rounded focus:ring-ftech-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {carteira.nome}
                        </p>
                        {carteira.descricao && (
                          <p className="text-xs text-gray-500 truncate">
                            {carteira.descricao}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Selecione uma ou mais carteiras para esse usuário.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ftech-600 hover:bg-ftech-700 disabled:bg-ftech-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/usuario')}
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
