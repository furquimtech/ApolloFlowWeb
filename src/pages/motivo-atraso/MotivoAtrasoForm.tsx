import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motivoAtrasoApi } from '../../api/motivoAtraso';
import type { MotivoAtrasoRequest } from '../../types';

const EMPTY: MotivoAtrasoRequest = {
  descricao: '',
  idCobransaas: '',
};

export default function MotivoAtrasoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState<MotivoAtrasoRequest>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    motivoAtrasoApi
      .getById(Number(id))
      .then(data =>
        setForm({
          descricao: data.descricao,
          idCobransaas: data.idCobransaas ?? '',
        })
      )
      .catch(() => setError('Erro ao carregar motivo de atraso.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await motivoAtrasoApi.update(Number(id), form);
      } else {
        await motivoAtrasoApi.create(form);
      }
      navigate('/motivo-atraso');
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.mensagem ?? 'Erro ao salvar motivo de atraso.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/motivo-atraso')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Voltar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Motivo de Atraso' : 'Novo Motivo de Atraso'}
        </h1>
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
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Cobransaas
              <span className="ml-1 text-xs font-normal text-gray-400">(de-para para lançamento de tarefas)</span>
            </label>
            <input
              type="text"
              name="idCobransaas"
              value={form.idCobransaas ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent"
              placeholder="ID no Cobransaas (opcional)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-ftech-600 hover:bg-ftech-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/motivo-atraso')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
