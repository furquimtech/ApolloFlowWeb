import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contratoApi } from '../../api/contrato';
import { clienteApi } from '../../api/cliente';
import { carteiraApi } from '../../api/carteira';
import type { ContratoRequest, Cliente, Carteira } from '../../types';

const EMPTY: ContratoRequest = {
  numeroContrato: '', numeroParcelas: 1,
  dataEmissao: '', dataOperacao: '',
  situacao: 'Ativo', tipo: '',
  taxaOperacao: 0, valorDevolucao: 0, valorIof: 0,
  valorLiquido: 0, valorTarifa: 0, valorTotal: 0,
  saldoAtual: 0, saldoTotal: 0, saldoAtraso: 0, saldoContabil: 0,
  diasAtraso: 0, lp: false,
  carteiraId: 0, clienteId: 0,
};

export default function ContratoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState<ContratoRequest>(EMPTY);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([clienteApi.getAll(), carteiraApi.getAll()])
      .then(([c, k]) => { setClientes(c); setCarteiras(k); })
      .catch(() => setError('Erro ao carregar dados auxiliares.'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    contratoApi
      .getById(Number(id))
      .then((data) =>
        setForm({
          numeroContrato: data.numeroContrato,
          numeroParcelas: data.numeroParcelas,
          dataEmissao: data.dataEmissao?.slice(0, 10) ?? '',
          dataOperacao: data.dataOperacao?.slice(0, 10) ?? '',
          situacao: data.situacao,
          tipo: data.tipo ?? '',
          taxaOperacao: data.taxaOperacao,
          valorDevolucao: data.valorDevolucao,
          valorIof: data.valorIof,
          valorLiquido: data.valorLiquido ?? 0,
          valorTarifa: data.valorTarifa,
          valorTotal: data.valorTotal,
          saldoAtual: data.saldoAtual,
          saldoTotal: data.saldoTotal,
          saldoAtraso: data.saldoAtraso,
          saldoContabil: data.saldoContabil,
          diasAtraso: data.diasAtraso ?? 0,
          lp: data.lp,
          carteiraId: data.carteiraId,
          clienteId: data.clienteId,
        })
      )
      .catch(() => setError('Erro ao carregar contrato.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNumber(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  }

  function handleInt(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await contratoApi.update(Number(id), form);
      } else {
        await contratoApi.create(form);
      }
      navigate('/contrato');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ??
        'Erro ao salvar contrato.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400';
  const selectClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/contrato')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Altere os dados e salve' : 'Preencha os dados do novo contrato'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">

            {/* Row 1: N Contrato / N Parcelas */}
            <div>
              <label className={labelClass}>
                N Contrato <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numeroContrato"
                value={form.numeroContrato}
                onChange={handleChange}
                required
                placeholder="Numero do contrato"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                N Parcelas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numeroParcelas"
                value={form.numeroParcelas}
                onChange={handleNumber}
                required
                min={1}
                className={inputClass}
              />
            </div>

            {/* Row 2: Cliente / Carteira */}
            <div>
              <label className={labelClass}>
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                name="clienteId"
                value={form.clienteId || ''}
                onChange={handleInt}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.cpfCnpj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Carteira <span className="text-red-500">*</span>
              </label>
              <select
                name="carteiraId"
                value={form.carteiraId || ''}
                onChange={handleInt}
                required
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {carteiras.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Data Emissao / Data Operacao */}
            <div>
              <label className={labelClass}>
                Data Emissao <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dataEmissao"
                value={form.dataEmissao}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Data Operacao <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dataOperacao"
                value={form.dataOperacao}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Row 4: Situacao / Tipo */}
            <div>
              <label className={labelClass}>Situacao</label>
              <select
                name="situacao"
                value={form.situacao}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="Ativo">Ativo</option>
                <option value="Liquidado">Liquidado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <input
                type="text"
                name="tipo"
                value={form.tipo ?? ''}
                onChange={handleChange}
                placeholder="Tipo do contrato"
                className={inputClass}
              />
            </div>

            {/* Row 5: Taxa Operacao / Valor IOF */}
            <div>
              <label className={labelClass}>Taxa Operacao %</label>
              <input
                type="number"
                name="taxaOperacao"
                value={form.taxaOperacao}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Valor IOF</label>
              <input
                type="number"
                name="valorIof"
                value={form.valorIof}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>

            {/* Row 6: Valor Total / Valor Liquido */}
            <div>
              <label className={labelClass}>Valor Total</label>
              <input
                type="number"
                name="valorTotal"
                value={form.valorTotal}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Valor Liquido</label>
              <input
                type="number"
                name="valorLiquido"
                value={form.valorLiquido ?? 0}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>

            {/* Row 7: Saldo Atual / Saldo Atraso */}
            <div>
              <label className={labelClass}>Saldo Atual</label>
              <input
                type="number"
                name="saldoAtual"
                value={form.saldoAtual}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Saldo Atraso</label>
              <input
                type="number"
                name="saldoAtraso"
                value={form.saldoAtraso}
                onChange={handleNumber}
                step={0.01}
                className={inputClass}
              />
            </div>

            {/* Row 8: Dias Atraso / LP */}
            <div>
              <label className={labelClass}>Dias Atraso</label>
              <input
                type="number"
                name="diasAtraso"
                value={form.diasAtraso ?? 0}
                onChange={handleNumber}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                name="lp"
                id="lp"
                checked={form.lp}
                onChange={(e) => setForm((p) => ({ ...p, lp: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="lp" className="text-sm font-medium text-gray-700 cursor-pointer">
                Lancamento Provisorio
              </label>
            </div>

          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
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
              onClick={() => navigate('/contrato')}
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
