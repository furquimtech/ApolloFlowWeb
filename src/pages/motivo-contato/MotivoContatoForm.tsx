import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motivoContatoApi } from '../../api/motivoContato';
import type { MotivoContatoRequest } from '../../types';

const EMPTY: MotivoContatoRequest = {
  codigo: '',
  descricao: '',
  produtivo: false,
  cpc: false,
  diasStandBy: 0,
  ativo: true,
  historicoPadrao: '',
  codigoExterno: '',
  descricaoExterno: '',
};

export default function MotivoContatoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState<MotivoContatoRequest>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    motivoContatoApi
      .getById(Number(id))
      .then(data =>
        setForm({
          codigo: data.codigo,
          descricao: data.descricao,
          produtivo: data.produtivo,
          cpc: data.cpc,
          diasStandBy: data.diasStandBy,
          ativo: data.ativo,
          historicoPadrao: data.historicoPadrao,
          codigoExterno: data.codigoExterno,
          descricaoExterno: data.descricaoExterno,
        })
      )
      .catch(() => setError('Erro ao carregar motivo de contato.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'diasStandBy') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await motivoContatoApi.update(Number(id), form);
      } else {
        await motivoContatoApi.create(form);
      }
      navigate('/motivo-contato');
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.mensagem ?? 'Erro ao salvar motivo de contato.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ftech-500 focus:border-transparent';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/motivo-contato')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Voltar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Motivo de Contato' : 'Novo Motivo de Contato'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-ftech-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Identificação</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input type="text" name="codigo" value={form.codigo} onChange={handleChange}
                  required className={inputCls} placeholder="Ex: MC001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input type="text" name="descricao" value={form.descricao} onChange={handleChange}
                  required className={inputCls} placeholder="Descrição do motivo" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Histórico Padrão</label>
              <textarea name="historicoPadrao" value={form.historicoPadrao} onChange={handleChange}
                rows={3} className={inputCls + ' resize-none'}
                placeholder="Texto padrão a ser registrado na ocorrência" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Standby</label>
              <input type="number" name="diasStandBy" value={form.diasStandBy} onChange={handleChange}
                min={0} className={inputCls} />
              <p className="mt-1 text-xs text-gray-400">Dias de espera antes do próximo contato</p>
            </div>
          </div>

          {/* Flags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Configurações</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="produtivo" checked={form.produtivo} onChange={handleChange}
                className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500" />
              <span className="text-sm text-gray-700">Contato Produtivo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="cpc" checked={form.cpc} onChange={handleChange}
                className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500" />
              <span className="text-sm text-gray-700">CPC (Contato com Pessoa Certa)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="ativo" checked={form.ativo} onChange={handleChange}
                className="w-4 h-4 text-ftech-600 rounded border-gray-300 focus:ring-ftech-500" />
              <span className="text-sm text-gray-700">Ativo</span>
            </label>
          </div>

          {/* Integração Externa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Integração Externa</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Externo</label>
                <input type="text" name="codigoExterno" value={form.codigoExterno} onChange={handleChange}
                  className={inputCls} placeholder="Código no sistema externo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Externa</label>
                <input type="text" name="descricaoExterno" value={form.descricaoExterno} onChange={handleChange}
                  className={inputCls} placeholder="Descrição no sistema externo" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-ftech-600 hover:bg-ftech-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
              {saving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => navigate('/motivo-contato')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
